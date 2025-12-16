import { GnssEpoch } from '../../native/GnssModule';

/**
 * Result of anomaly detection analysis
 */
export type AnomalyDetectionResult = {
  isAnomaly: boolean;
  type?: 'ANOMALY';
  reason?:
    | 'Both C/N0 and AGC dropped'
    | 'C/N0 dropped but AGC increased'
    | 'C/N0 dropped but AGC stable/unavailable';
  severity?: 'High' | 'Medium' | 'Low';
  metrics: {
    cn0Drop: number;
    agcDrop?: number;
    avgCn0: number;
    avgAgc?: number;
    baselineCn0: number;
    baselineAgc?: number;
  };
  description?: string;
};

/**
 * AnomalyDetector
 *
 * Implements epoch-based GNSS anomaly detection using sliding window algorithm.
 * Compares the most recent 10 epochs against a baseline of 50 epochs.
 *
 * Detection algorithm based on Android GNSS Logger:
 * https://developer.android.com/develop/sensors-and-location/sensors/gnss-spoof-jam
 *
 * @example
 * const detector = new AnomalyDetector();
 * const result = detector.addEpoch(newEpoch);
 * if (result?.isAnomaly) {
 *   console.log(`Anomaly detected: ${result.type}`);
 * }
 */
export class AnomalyDetector {
  private epochBuffer: GnssEpoch[] = [];
  private frozenBaseline: GnssEpoch[] | null = null; // Frozen baseline during anomaly
  private anomalyInProgress = false;

  // Configuration
  private readonly RECENT_WINDOW = 10; // Most recent epochs to analyze
  private readonly BASELINE_WINDOW = 50; // Historical baseline epochs
  private readonly TOTAL_REQUIRED = 60; // Total epochs needed (10 + 50)

  // Thresholds for anomaly detection
  private readonly THRESHOLD_HIGH = 15; // 15% drop = High severity
  private readonly THRESHOLD_MEDIUM = 10; // 10% drop = Medium severity
  private readonly THRESHOLD_LOW = 7; // 7% drop = Low severity

  /**
   * Add a new epoch and perform anomaly detection
   *
   * @param epoch - The new epoch data to analyze
   * @returns Detection result if anomaly found, null otherwise
   */
  addEpoch(epoch: GnssEpoch): AnomalyDetectionResult | null {
    // Add to buffer
    this.epochBuffer.push(epoch);

    // Maintain buffer size
    if (this.epochBuffer.length > this.TOTAL_REQUIRED) {
      this.epochBuffer.shift();
    }

    // Need full baseline before we can detect
    if (this.epochBuffer.length < this.TOTAL_REQUIRED) {
      return null;
    }

    // Perform detection
    return this.detectAnomaly();
  }

  /**
   * Perform anomaly detection on current buffer
   */
  private detectAnomaly(): AnomalyDetectionResult | null {
    // Split buffer into recent and baseline windows
    const recentEpochs = this.epochBuffer.slice(-this.RECENT_WINDOW);

    // Use frozen baseline if anomaly is in progress, otherwise use current baseline
    const baselineEpochs =
      this.anomalyInProgress && this.frozenBaseline
        ? this.frozenBaseline
        : this.epochBuffer.slice(0, this.BASELINE_WINDOW);

    // Calculate C/N0 averages
    const recentAvgCn0 = this.calculateAverage(recentEpochs.map(e => e.avgCn0DbHz));
    const baselineAvgCn0 = this.calculateAverage(baselineEpochs.map(e => e.avgCn0DbHz));

    // Calculate C/N0 drop percentage
    const cn0Drop = ((baselineAvgCn0 - recentAvgCn0) / baselineAvgCn0) * 100;

    // Calculate AGC averages if available
    let agcDrop: number | undefined;
    let recentAvgAgc: number | undefined;
    let baselineAvgAgc: number | undefined;

    const recentWithAgc = recentEpochs.filter(e => e.avgAgcLevelDb !== undefined);
    const baselineWithAgc = baselineEpochs.filter(e => e.avgAgcLevelDb !== undefined);

    // Only calculate AGC if we have enough data points (at least 50% of epochs)
    if (
      recentWithAgc.length >= this.RECENT_WINDOW / 2 &&
      baselineWithAgc.length >= this.BASELINE_WINDOW / 2
    ) {
      recentAvgAgc = this.calculateAverage(recentWithAgc.map(e => e.avgAgcLevelDb!));
      baselineAvgAgc = this.calculateAverage(baselineWithAgc.map(e => e.avgAgcLevelDb!));
      agcDrop = ((baselineAvgAgc - recentAvgAgc) / baselineAvgAgc) * 100;
    }

    // Build metrics object
    const metrics = {
      cn0Drop,
      agcDrop,
      avgCn0: recentAvgCn0,
      avgAgc: recentAvgAgc,
      baselineCn0: baselineAvgCn0,
      baselineAgc: baselineAvgAgc,
    };

    // Determine if anomaly exists and classify it
    const detection = this.classifyAnomaly(cn0Drop, agcDrop);

    if (!detection.isAnomaly) {
      // No anomaly - unfreeze baseline if it was frozen
      if (this.anomalyInProgress) {
        this.anomalyInProgress = false;
        this.frozenBaseline = null;
      }
      return null;
    }

    // Anomaly detected - freeze baseline if not already frozen
    if (!this.anomalyInProgress) {
      this.anomalyInProgress = true;
      this.frozenBaseline = baselineEpochs.slice(); // Copy the current baseline
    }

    return {
      ...detection,
      metrics,
    };
  }

  /**
   * Classify anomaly based on C/N0 and AGC drops
   */
  private classifyAnomaly(
    cn0Drop: number,
    agcDrop?: number,
  ): Pick<AnomalyDetectionResult, 'isAnomaly' | 'type' | 'reason' | 'severity' | 'description'> {
    // No anomaly if C/N0 hasn't dropped significantly
    if (cn0Drop < this.THRESHOLD_LOW) {
      return { isAnomaly: false };
    }

    // Determine severity based on drop magnitude
    let severity: 'High' | 'Medium' | 'Low';
    if (cn0Drop >= this.THRESHOLD_HIGH) {
      severity = 'High';
    } else if (cn0Drop >= this.THRESHOLD_MEDIUM) {
      severity = 'Medium';
    } else {
      severity = 'Low';
    }

    // Determine reason based on AGC behavior
    let reason:
      | 'Both C/N0 and AGC dropped'
      | 'C/N0 dropped but AGC increased'
      | 'C/N0 dropped but AGC stable/unavailable';
    let description: string;

    if (agcDrop !== undefined && agcDrop >= this.THRESHOLD_LOW) {
      // Both C/N0 and AGC dropped
      reason = 'Both C/N0 and AGC dropped';
      description = `Possible anomaly detected: Both C/N0 and AGC dropped (C/N0: ${cn0Drop.toFixed(1)}%, AGC: ${agcDrop.toFixed(1)}%)`;
    } else if (agcDrop !== undefined && agcDrop < -this.THRESHOLD_LOW) {
      // C/N0 dropped but AGC increased
      reason = 'C/N0 dropped but AGC increased';
      description = `Possible anomaly detected: C/N0 dropped ${cn0Drop.toFixed(1)}% but AGC increased ${Math.abs(agcDrop).toFixed(1)}%`;
    } else {
      // C/N0 dropped but AGC stable/unavailable
      reason = 'C/N0 dropped but AGC stable/unavailable';
      description = `Possible anomaly detected: C/N0 dropped ${cn0Drop.toFixed(1)}%`;
    }

    return {
      isAnomaly: true,
      type: 'ANOMALY',
      reason,
      severity,
      description,
    };
  }

  /**
   * Calculate average of array of numbers
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Reset the detector state
   */
  reset(): void {
    this.epochBuffer = [];
    this.frozenBaseline = null;
    this.anomalyInProgress = false;
  }

  /**
   * Recalibrate the baseline without stopping detection
   * Clears the epoch buffer and frozen baseline to establish a new baseline
   * Useful when moving from poor signal area to better location
   */
  recalibrate(): void {
    this.epochBuffer = [];
    this.frozenBaseline = null;
    // Keep anomalyInProgress state - if there's an active anomaly,
    // it will end naturally when new baseline is established
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.epochBuffer.length;
  }

  /**
   * Check if detector has enough data to start detecting
   */
  isReady(): boolean {
    return this.epochBuffer.length >= this.TOTAL_REQUIRED;
  }

  /**
   * Get calibration progress (0-100%)
   */
  getCalibrationProgress(): number {
    if (this.isReady()) return 100;
    return Math.round((this.epochBuffer.length / this.TOTAL_REQUIRED) * 100);
  }

  /**
   * Get remaining epochs needed for calibration
   */
  getRemainingEpochs(): number {
    const remaining = this.TOTAL_REQUIRED - this.epochBuffer.length;
    return Math.max(0, remaining);
  }

  /**
   * Get current baseline statistics (null if not yet calibrated)
   */
  getBaselineStats(): {
    avgCn0: number;
    avgAgc?: number;
    satelliteCount: number;
    epochCount: number;
  } | null {
    if (!this.isReady()) return null;

    const baselineEpochs = this.frozenBaseline || this.epochBuffer.slice(0, this.BASELINE_WINDOW);

    const avgCn0 = this.calculateAverage(baselineEpochs.map(e => e.avgCn0DbHz));
    const avgSatellites = this.calculateAverage(baselineEpochs.map(e => e.satelliteCount));

    // Calculate AGC average if available
    const epochsWithAgc = baselineEpochs.filter(e => e.avgAgcLevelDb !== undefined);
    const avgAgc =
      epochsWithAgc.length >= this.BASELINE_WINDOW / 2
        ? this.calculateAverage(epochsWithAgc.map(e => e.avgAgcLevelDb!))
        : undefined;

    return {
      avgCn0,
      avgAgc,
      satelliteCount: Math.round(avgSatellites),
      epochCount: baselineEpochs.length,
    };
  }

  /**
   * Check if baseline is currently frozen (anomaly in progress)
   */
  isBaselineFrozen(): boolean {
    return this.anomalyInProgress;
  }
}
