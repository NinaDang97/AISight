/**
 * AnomalyContext
 *
 * React Context for managing GNSS anomaly detection across the application.
 * This context uses the GnssContext data to perform real-time anomaly detection
 * and track anomaly paths with start/end locations.
 *
 * @module AnomalyContext
 *
 * State managed:
 * - isDetecting: Whether anomaly detection is currently active
 * - activeAnomaly: Currently ongoing anomaly (if any)
 * - detectedAnomalies: Historical list of detected anomalies
 * - currentEpoch: Latest epoch data
 *
 * Usage:
 * 1. Wrap your app with AnomalyProvider (after GnssProvider)
 * 2. Use useAnomaly() hook to access anomaly detection state
 *
 * @example
 * ```tsx
 * // In App.tsx or navigation root
 * <GnssProvider>
 *   <AnomalyProvider>
 *     <Navigation />
 *   </AnomalyProvider>
 * </GnssProvider>
 *
 * // In any screen
 * const { detectedAnomalies, startDetection, stopDetection } = useAnomaly();
 * ```
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { GnssEpoch, GnssAnomalyEvent } from '../../native/GnssModule';
import { useGnss } from './GnssContext';
import {
  AnomalyDetector,
  AnomalyStorage,
  createEpoch,
  generateAnomalyId,
} from '../../services/anomaly';

type BaselineStats = {
  avgCn0: number;
  avgAgc?: number;
  satelliteCount: number;
  epochCount: number;
};

type AnomalyContextType = {
  // State
  isDetecting: boolean;
  activeAnomaly: GnssAnomalyEvent | null;
  detectedAnomalies: GnssAnomalyEvent[];
  currentEpoch: GnssEpoch | null;
  detectorReady: boolean; // True when detector has enough epochs

  // Calibration progress
  calibrationProgress: number; // 0-100%
  remainingEpochs: number; // Epochs left until calibration complete
  baselineStats: BaselineStats | null; // Baseline statistics once calibrated
  isBaselineFrozen: boolean; // True if baseline is frozen during anomaly

  // Control functions
  startDetection: () => void;
  stopDetection: () => void;
  clearAnomalies: () => void;
  recalibrate: () => void;
};

/**
 * React Context instance for Anomaly detection state
 */
const AnomalyContext = createContext<AnomalyContextType | undefined>(undefined);

/**
 * Custom hook to access AnomalyContext
 *
 * @throws {Error} If used outside of AnomalyProvider
 * @returns {AnomalyContextType} The context value
 */
export const useAnomaly = (): AnomalyContextType => {
  const context = useContext(AnomalyContext);
  if (!context) {
    throw new Error('useAnomaly must be used within an AnomalyProvider');
  }
  return context;
};

/**
 * AnomalyProvider Component
 *
 * Manages anomaly detection lifecycle and state
 */
export const AnomalyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const gnss = useGnss();

  const [isDetecting, setIsDetecting] = useState(false);
  const [activeAnomaly, setActiveAnomaly] = useState<GnssAnomalyEvent | null>(null);
  const [detectedAnomalies, setDetectedAnomalies] = useState<GnssAnomalyEvent[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState<GnssEpoch | null>(null);
  const [detectorReady, setDetectorReady] = useState(false);

  // Calibration progress state
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [remainingEpochs, setRemainingEpochs] = useState(60);
  const [baselineStats, setBaselineStats] = useState<BaselineStats | null>(null);
  const [isBaselineFrozen, setIsBaselineFrozen] = useState(false);

  // Anomaly detector instance (persists across renders)
  const detectorRef = useRef(new AnomalyDetector());

  // Track active anomaly in a ref to avoid infinite loops in useEffect
  const activeAnomalyRef = useRef<GnssAnomalyEvent | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    activeAnomalyRef.current = activeAnomaly;
  }, [activeAnomaly]);

  /**
   * Start anomaly detection
   * Requires GNSS tracking to be active
   */
  const startDetection = useCallback(() => {
    if (!gnss.isTracking) {
      console.warn('[AnomalyContext] Cannot start detection: GNSS tracking not active');
      return;
    }
    setIsDetecting(true);
    detectorRef.current.reset();
    setDetectorReady(false);

    // Reset calibration progress
    setCalibrationProgress(0);
    setRemainingEpochs(60);
    setBaselineStats(null);
    setIsBaselineFrozen(false);
  }, [gnss.isTracking]);

  /**
   * Stop anomaly detection
   * Completes any active anomaly
   */
  const stopDetection = useCallback(() => {
    setIsDetecting(false);

    // If there's an active anomaly, complete it
    if (activeAnomaly) {
      const completedAnomaly: GnssAnomalyEvent = {
        ...activeAnomaly,
        status: 'Completed',
        endTime: Date.now(),
        endLocation: gnss.location,
      };
      setDetectedAnomalies(prev => [completedAnomaly, ...prev]);
      setActiveAnomaly(null);
    }
  }, [activeAnomaly, gnss.location]);

  /**
   * Clear all detected anomalies
   */
  const clearAnomalies = useCallback(async () => {
    setDetectedAnomalies([]);
    setActiveAnomaly(null);
    await AnomalyStorage.clearAll();
  }, []);

  /**
   * Recalibrate the baseline
   * Clears the epoch buffer to establish a new baseline
   * Useful when moving from poor signal area to better location
   */
  const recalibrate = useCallback(() => {
    if (!isDetecting) {
      console.warn('[AnomalyContext] Cannot recalibrate: Detection not active');
      return;
    }

    detectorRef.current.recalibrate();
    setDetectorReady(false);

    // Reset calibration progress
    setCalibrationProgress(0);
    setRemainingEpochs(60);
    setBaselineStats(null);
    setIsBaselineFrozen(false);

    // Clear active anomaly since we're establishing a new baseline
    if (activeAnomaly) {
      const completedAnomaly: GnssAnomalyEvent = {
        ...activeAnomaly,
        status: 'Completed',
        endTime: Date.now(),
        endLocation: gnss.location,
      };
      setDetectedAnomalies(prev => [completedAnomaly, ...prev]);
      setActiveAnomaly(null);
    }
  }, [isDetecting, activeAnomaly, gnss.location]);

  /**
   * Main detection logic - triggered whenever measurements update
   * This runs reactively when GnssContext receives new data from native module
   */
  useEffect(() => {
    if (!isDetecting || !gnss.isTracking) {
      return;
    }

    // Skip if no measurements available
    if (gnss.measurements.length === 0) {
      return;
    }

    // Create epoch from current measurements
    const epoch = createEpoch(gnss.measurements, gnss.location);
    setCurrentEpoch(epoch);

    // Skip if no valid measurements
    if (epoch.satelliteCount === 0) {
      return;
    }

    // Add epoch to detector
    const result = detectorRef.current.addEpoch(epoch);

    // Update detector ready state
    setDetectorReady(detectorRef.current.isReady());

    // Update calibration progress
    setCalibrationProgress(detectorRef.current.getCalibrationProgress());
    setRemainingEpochs(detectorRef.current.getRemainingEpochs());
    setBaselineStats(detectorRef.current.getBaselineStats());
    setIsBaselineFrozen(detectorRef.current.isBaselineFrozen());

    if (result && result.isAnomaly) {
      // Anomaly detected
      if (!activeAnomalyRef.current) {
        // Start new anomaly
        const newAnomaly: GnssAnomalyEvent = {
          id: generateAnomalyId(),
          type: result.type!,
          severity: result.severity!,
          status: 'Active',
          startTime: Date.now(),
          startLocation: gnss.location,
          path: gnss.location ? [gnss.location] : [],
          metrics: result.metrics,
          description: result.description!,
        };
        setActiveAnomaly(newAnomaly);
      } else {
        // Update existing anomaly
        const prev = activeAnomalyRef.current;

        // Add current location to path if it exists and is different from last
        const updatedPath = [...prev.path];
        if (gnss.location) {
          const lastLocation = updatedPath[updatedPath.length - 1];
          // Only add if location changed (avoid duplicates)
          if (!lastLocation ||
              lastLocation.latitude !== gnss.location.latitude ||
              lastLocation.longitude !== gnss.location.longitude) {
            updatedPath.push(gnss.location);
          }
        }

        const updatedAnomaly = {
          ...prev,
          path: updatedPath,
          metrics: result.metrics, // Update with latest metrics
        };
        setActiveAnomaly(updatedAnomaly);
      }
    } else if (activeAnomalyRef.current) {
      // No anomaly detected, but we have an active one - it ended
      const completedAnomaly: GnssAnomalyEvent = {
        ...activeAnomalyRef.current,
        status: 'Completed',
        endTime: Date.now(),
        endLocation: gnss.location,
      };
      setDetectedAnomalies(prev => [completedAnomaly, ...prev]);
      setActiveAnomaly(null);
    }
  }, [isDetecting, gnss.isTracking, gnss.measurements, gnss.location]);

  /**
   * Stop detection if GNSS tracking stops
   */
  useEffect(() => {
    if (!gnss.isTracking && isDetecting) {
      stopDetection();
    }
  }, [gnss.isTracking, isDetecting, stopDetection]);

  /**
   * Load persisted anomalies on mount
   */
  useEffect(() => {
    const loadAnomalies = async () => {
      try {
        const stored = await AnomalyStorage.loadAnomalies();
        setDetectedAnomalies(stored);
      } catch (error) {
        console.error('[AnomalyContext] Error loading anomalies:', error);
      }
    };
    loadAnomalies();
  }, []);

  /**
   * Save anomalies to storage whenever they change
   */
  useEffect(() => {
    if (detectedAnomalies.length > 0) {
      AnomalyStorage.saveAnomalies(detectedAnomalies).catch(error => {
        console.error('[AnomalyContext] Error saving anomalies:', error);
      });
    }
  }, [detectedAnomalies]);

  const value: AnomalyContextType = {
    isDetecting,
    activeAnomaly,
    detectedAnomalies,
    currentEpoch,
    detectorReady,
    calibrationProgress,
    remainingEpochs,
    baselineStats,
    isBaselineFrozen,
    startDetection,
    stopDetection,
    clearAnomalies,
    recalibrate,
  };

  return <AnomalyContext.Provider value={value}>{children}</AnomalyContext.Provider>;
};
