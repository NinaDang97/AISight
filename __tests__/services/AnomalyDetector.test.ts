/**
 * AnomalyDetector Tests
 * Tests for the GNSS anomaly detection service
 */

import { AnomalyDetector } from '../../src/services/anomaly/AnomalyDetector';
import { GnssEpoch } from '../../src/native/GnssModule';

describe('AnomalyDetector', () => {
  let detector: AnomalyDetector;

  beforeEach(() => {
    detector = new AnomalyDetector();
  });

  describe('initialization', () => {
    it('should start with empty buffer', () => {
      expect(detector.getBufferSize()).toBe(0);
    });

    it('should not be ready initially', () => {
      expect(detector.isReady()).toBe(false);
    });
  });

  describe('epoch buffering', () => {
    it('should add epochs to buffer', () => {
      const epoch: GnssEpoch = {
        timestamp: Date.now(),
        avgCn0DbHz: 40.0,
        satelliteCount: 10,
        location: null,
      };

      detector.addEpoch(epoch);
      expect(detector.getBufferSize()).toBe(1);
    });

    it('should become ready after 60 epochs', () => {
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }
      expect(detector.isReady()).toBe(true);
    });

    it('should maintain buffer size at 60 epochs max', () => {
      for (let i = 0; i < 70; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }
      expect(detector.getBufferSize()).toBe(60);
    });

    it('should not detect anomalies before buffer is full', () => {
      for (let i = 0; i < 59; i++) {
        const result = detector.addEpoch(createMockEpoch(40.0));
        expect(result).toBeNull();
      }
    });
  });

  describe('jamming detection', () => {
    it('should detect jamming when both C/N0 and AGC drop significantly', () => {
      // Fill baseline with good signals (epochs 0-49)
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(42.0, -8.0));
      }

      // Add recent epochs with degraded signals (epochs 50-59)
      // For jamming: both C/N0 and AGC should drop (AGC becomes less negative/weaker)
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(35.0, -6.0)); // C/N0: ~16% drop, AGC: 25% drop (weaker)
      }

      const result = detector.addEpoch(createMockEpoch(35.0, -6.0));

      expect(result).not.toBeNull();
      expect(result?.isAnomaly).toBe(true);
      expect(result?.type).toBe('JAMMING');
      expect(result?.severity).toBe('High');
    });

    it('should calculate correct C/N0 drop percentage', () => {
      // Baseline: 40 dB-Hz
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }

      // Recent: 36 dB-Hz (10% drop)
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(36.0));
      }

      const result = detector.addEpoch(createMockEpoch(36.0));

      // The drop percentage should be (40 - 36.72727...) / 40 * 100 ≈ 8.18%
      // Because baseline window is 50 epochs (indices 1-50), but includes one 36.0
      expect(result?.metrics.cn0Drop).toBeGreaterThan(7.0);
      expect(result?.metrics.cn0Drop).toBeLessThan(11.0);
      expect(result?.metrics.avgCn0).toBeCloseTo(36.0, 0);
    });
  });

  describe('spoofing detection', () => {
    it('should detect spoofing when C/N0 drops but AGC increases', () => {
      // Baseline
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(42.0, -8.0));
      }

      // Recent: C/N0 down, AGC up (becomes more negative = stronger gain)
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(35.0, -12.0)); // AGC increased (more negative)
      }

      const result = detector.addEpoch(createMockEpoch(35.0, -12.0));

      expect(result).not.toBeNull();
      expect(result?.type).toBe('SPOOFING');
    });
  });

  describe('signal degradation detection', () => {
    it('should detect degradation when only C/N0 drops (no AGC data)', () => {
      // Baseline without AGC
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(42.0, undefined));
      }

      // Recent: C/N0 drops
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(36.0, undefined));
      }

      const result = detector.addEpoch(createMockEpoch(36.0, undefined));

      expect(result).not.toBeNull();
      expect(result?.type).toBe('SIGNAL_DEGRADATION');
    });

    it('should detect degradation when C/N0 drops but AGC stable', () => {
      // Baseline
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(42.0, -8.0));
      }

      // Recent: only C/N0 drops, AGC stable
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(36.0, -8.0));
      }

      const result = detector.addEpoch(createMockEpoch(36.0, -8.0));

      expect(result).not.toBeNull();
      expect(result?.type).toBe('SIGNAL_DEGRADATION');
    });
  });

  describe('severity classification', () => {
    beforeEach(() => {
      // Fill baseline
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }
    });

    it('should classify 7-9% drop as Low severity', () => {
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(37.0)); // 7.5% drop
      }
      const result = detector.addEpoch(createMockEpoch(37.0));
      expect(result?.severity).toBe('Low');
    });

    it('should classify 10-14% drop as Medium severity', () => {
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(35.6)); // ~11% drop
      }
      const result = detector.addEpoch(createMockEpoch(35.6));
      expect(result?.severity).toBe('Medium');
    });

    it('should classify 15%+ drop as High severity', () => {
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(33.0)); // 17.5% drop
      }
      const result = detector.addEpoch(createMockEpoch(33.0));
      expect(result?.severity).toBe('High');
    });
  });

  describe('no anomaly detection', () => {
    it('should return null when signals are stable', () => {
      for (let i = 0; i < 61; i++) {
        const result = detector.addEpoch(createMockEpoch(40.0));
        if (i === 60) {
          expect(result).toBeNull();
        }
      }
    });

    it('should return null when C/N0 drop is below threshold', () => {
      // Baseline
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }

      // Recent: only 5% drop (below 7% threshold)
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(38.0));
      }

      const result = detector.addEpoch(createMockEpoch(38.0));
      expect(result).toBeNull();
    });
  });

  describe('reset functionality', () => {
    it('should clear buffer on reset', () => {
      for (let i = 0; i < 30; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }

      detector.reset();

      expect(detector.getBufferSize()).toBe(0);
      expect(detector.isReady()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle epochs with zero satellites', () => {
      const epoch: GnssEpoch = {
        timestamp: Date.now(),
        avgCn0DbHz: 0,
        satelliteCount: 0,
        location: null,
      };

      const result = detector.addEpoch(epoch);
      expect(detector.getBufferSize()).toBe(1);
    });

    it('should handle missing AGC data gracefully', () => {
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(40.0, undefined));
      }

      const result = detector.addEpoch(createMockEpoch(40.0, undefined));
      expect(result?.metrics.agcDrop).toBeUndefined();
      expect(result?.metrics.avgAgc).toBeUndefined();
    });

    it('should handle partial AGC data (less than 50% coverage)', () => {
      // Baseline with AGC
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(40.0, -8.0));
      }

      // Recent: only 3 out of 10 have AGC (below 50% threshold)
      for (let i = 0; i < 7; i++) {
        detector.addEpoch(createMockEpoch(36.0, undefined));
      }
      for (let i = 0; i < 3; i++) {
        detector.addEpoch(createMockEpoch(36.0, -8.0));
      }

      const result = detector.addEpoch(createMockEpoch(36.0, undefined));

      // Should still detect based on C/N0, but no AGC classification
      expect(result?.type).toBe('SIGNAL_DEGRADATION');
      expect(result?.metrics.agcDrop).toBeUndefined();
    });
  });

  describe('calibration progress tracking', () => {
    it('should return 0% progress when no epochs collected', () => {
      expect(detector.getCalibrationProgress()).toBe(0);
    });

    it('should return 50% progress when 30 epochs collected', () => {
      for (let i = 0; i < 30; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }
      expect(detector.getCalibrationProgress()).toBe(50);
    });

    it('should return 100% progress when 60 epochs collected', () => {
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }
      expect(detector.getCalibrationProgress()).toBe(100);
    });

    it('should return 100% progress when more than 60 epochs collected', () => {
      for (let i = 0; i < 70; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }
      expect(detector.getCalibrationProgress()).toBe(100);
    });

    it('should return 60 remaining epochs initially', () => {
      expect(detector.getRemainingEpochs()).toBe(60);
    });

    it('should return 30 remaining epochs when 30 collected', () => {
      for (let i = 0; i < 30; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }
      expect(detector.getRemainingEpochs()).toBe(30);
    });

    it('should return 0 remaining epochs when ready', () => {
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }
      expect(detector.getRemainingEpochs()).toBe(0);
    });
  });

  describe('baseline statistics', () => {
    it('should return null when not calibrated', () => {
      expect(detector.getBaselineStats()).toBeNull();
    });

    it('should return baseline stats when calibrated', () => {
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(42.0, -8.0));
      }

      const stats = detector.getBaselineStats();
      expect(stats).not.toBeNull();
      expect(stats?.avgCn0).toBeCloseTo(42.0, 1);
      expect(stats?.avgAgc).toBeCloseTo(-8.0, 1);
      expect(stats?.satelliteCount).toBe(10);
      expect(stats?.epochCount).toBe(50); // Baseline window size
    });

    it('should handle missing AGC in baseline stats', () => {
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(42.0, undefined));
      }

      const stats = detector.getBaselineStats();
      expect(stats).not.toBeNull();
      expect(stats?.avgCn0).toBeCloseTo(42.0, 1);
      expect(stats?.avgAgc).toBeUndefined();
    });

    it('should return frozen baseline stats during anomaly', () => {
      // Fill baseline with good signal
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(42.0, -8.0));
      }

      // Trigger anomaly
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(35.0, -6.0));
      }

      const result = detector.addEpoch(createMockEpoch(35.0, -6.0));
      expect(result?.isAnomaly).toBe(true);

      // Baseline stats should still reflect original baseline (42.0), not degraded signal
      const stats = detector.getBaselineStats();
      expect(stats?.avgCn0).toBeCloseTo(42.0, 1);
      expect(stats?.avgAgc).toBeCloseTo(-8.0, 1);
    });
  });

  describe('baseline freeze mechanism', () => {
    it('should not be frozen initially', () => {
      expect(detector.isBaselineFrozen()).toBe(false);
    });

    it('should freeze baseline when anomaly detected', () => {
      // Fill baseline
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(42.0));
      }

      // Trigger anomaly
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(35.0));
      }

      const result = detector.addEpoch(createMockEpoch(35.0));
      expect(result?.isAnomaly).toBe(true);
      expect(detector.isBaselineFrozen()).toBe(true);
    });

    it('should unfreeze baseline when anomaly ends', () => {
      // Fill baseline
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(42.0));
      }

      // Trigger anomaly
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(35.0));
      }
      let result = detector.addEpoch(createMockEpoch(35.0));
      expect(result?.isAnomaly).toBe(true);
      expect(detector.isBaselineFrozen()).toBe(true);

      // Return to normal
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(42.0));
      }
      result = detector.addEpoch(createMockEpoch(42.0));
      expect(result).toBeNull(); // No anomaly
      expect(detector.isBaselineFrozen()).toBe(false);
    });

    it('should keep baseline frozen for long-duration anomalies', () => {
      // Fill baseline
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(42.0, -8.0));
      }

      // Trigger anomaly
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(35.0, -6.0));
      }

      let result = detector.addEpoch(createMockEpoch(35.0, -6.0));
      expect(result?.isAnomaly).toBe(true);

      // Anomaly continues for 100+ more epochs
      for (let i = 0; i < 100; i++) {
        result = detector.addEpoch(createMockEpoch(35.0, -6.0));
        expect(result?.isAnomaly).toBe(true);
        expect(detector.isBaselineFrozen()).toBe(true);
        // Baseline should still be 42.0, not contaminated by degraded signal
        expect(result?.metrics.baselineCn0).toBeCloseTo(42.0, 1);
      }
    });

    it('should reset frozen baseline on reset', () => {
      // Fill baseline and trigger anomaly
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(42.0));
      }
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(35.0));
      }
      detector.addEpoch(createMockEpoch(35.0));
      expect(detector.isBaselineFrozen()).toBe(true);

      // Reset
      detector.reset();
      expect(detector.isBaselineFrozen()).toBe(false);
      expect(detector.getBufferSize()).toBe(0);
    });
  });

  describe('recalibration', () => {
    it('should clear epoch buffer on recalibrate', () => {
      // Fill buffer
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }
      expect(detector.getBufferSize()).toBe(60);
      expect(detector.isReady()).toBe(true);

      // Recalibrate
      detector.recalibrate();
      expect(detector.getBufferSize()).toBe(0);
      expect(detector.isReady()).toBe(false);
    });

    it('should clear epoch buffer while keeping anomaly state on recalibrate', () => {
      // Fill baseline and trigger anomaly
      for (let i = 0; i < 50; i++) {
        detector.addEpoch(createMockEpoch(42.0));
      }
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(35.0));
      }
      detector.addEpoch(createMockEpoch(35.0));
      expect(detector.isBaselineFrozen()).toBe(true);

      // Recalibrate - clears buffer but keeps anomalyInProgress state
      // so the anomaly will end naturally with new baseline
      detector.recalibrate();
      expect(detector.getBufferSize()).toBe(0);
      // Baseline is still frozen because anomaly is in progress
      expect(detector.isBaselineFrozen()).toBe(true);
    });

    it('should reset calibration progress on recalibrate', () => {
      // Partially fill buffer
      for (let i = 0; i < 30; i++) {
        detector.addEpoch(createMockEpoch(40.0));
      }
      expect(detector.getCalibrationProgress()).toBe(50);
      expect(detector.getRemainingEpochs()).toBe(30);

      // Recalibrate
      detector.recalibrate();
      expect(detector.getCalibrationProgress()).toBe(0);
      expect(detector.getRemainingEpochs()).toBe(60);
    });

    it('should clear baseline stats on recalibrate', () => {
      // Fill baseline
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(42.0, -8.0));
      }
      expect(detector.getBaselineStats()).not.toBeNull();

      // Recalibrate
      detector.recalibrate();
      expect(detector.getBaselineStats()).toBeNull();
    });

    it('should allow establishing new baseline after recalibrate', () => {
      // Fill baseline with poor signal (simulating indoor start)
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(30.0));
      }
      const oldStats = detector.getBaselineStats();
      expect(oldStats?.avgCn0).toBeCloseTo(30.0, 1);

      // Recalibrate (user moved outdoors)
      detector.recalibrate();

      // Fill new baseline with good signal
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(42.0));
      }
      const newStats = detector.getBaselineStats();
      expect(newStats?.avgCn0).toBeCloseTo(42.0, 1);
    });

    it('should detect anomalies with new baseline after recalibrate', () => {
      // Poor baseline initially
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(30.0));
      }

      // Recalibrate
      detector.recalibrate();

      // New good baseline
      for (let i = 0; i < 60; i++) {
        detector.addEpoch(createMockEpoch(42.0, -8.0));
      }

      // Trigger anomaly with degraded signal
      for (let i = 0; i < 10; i++) {
        detector.addEpoch(createMockEpoch(35.0, -6.0));
      }

      const result = detector.addEpoch(createMockEpoch(35.0, -6.0));
      expect(result?.isAnomaly).toBe(true);
      expect(result?.metrics.baselineCn0).toBeCloseTo(42.0, 1);
    });
  });
});

// Helper function to create mock epochs
function createMockEpoch(cn0: number, agc?: number): GnssEpoch {
  return {
    timestamp: Date.now(),
    avgCn0DbHz: cn0,
    avgAgcLevelDb: agc,
    satelliteCount: 10,
    location: {
      provider: 'gps',
      latitude: 60.09726,
      longitude: 19.93481,
      time: Date.now(),
    },
  };
}
