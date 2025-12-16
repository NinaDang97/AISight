import notifee, { AndroidImportance } from '@notifee/react-native';
import { GnssAnomalyEvent } from '../../native/GnssModule';

/**
 * Service for managing GNSS anomaly notifications
 * Handles initialization and display of local push notifications
 */
export class AnomalyNotificationService {
  private channelId: string | null = null;
  private initialized = false;

  /**
   * Initialize the notification channel for Android
   * Must be called before sending notifications
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.channelId = await notifee.createChannel({
        id: 'gnss-anomaly',
        name: 'GNSS Anomaly Alerts',
        importance: AndroidImportance.HIGH,
        description: 'Notifications for detected GNSS signal anomalies',
        sound: 'default',
      });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize notification channel:', error);
    }
  }

  /**
   * Send a notification for a detected anomaly
   * @param anomaly - The anomaly event to notify about
   */
  async sendAnomalyNotification(anomaly: GnssAnomalyEvent): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.channelId) {
      console.error('Notification channel not initialized');
      return;
    }

    try {
      await notifee.displayNotification({
        title: 'GNSS Anomaly Detected',
        body: `${anomaly.severity} Severity: ${anomaly.reason}`,
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          smallIcon: 'ic_launcher',
          color: this.getSeverityColor(anomaly.severity),
        },
      });
    } catch (error) {
      console.error('Failed to send anomaly notification:', error);
    }
  }

  /**
   * Get color for notification based on severity
   */
  private getSeverityColor(severity: 'High' | 'Medium' | 'Low'): string {
    switch (severity) {
      case 'High':
        return '#DC2626'; // red
      case 'Medium':
        return '#F59E0B'; // amber
      case 'Low':
        return '#3B82F6'; // blue
    }
  }

  /**
   * Cancel all anomaly notifications
   */
  async cancelAll(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  /**
   * Check if notifications are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const anomalyNotificationService = new AnomalyNotificationService();
