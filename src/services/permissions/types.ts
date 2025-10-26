import {RESULTS} from 'react-native-permissions';

export enum PermissionType {
  NOTIFICATION = 'NOTIFICATION',
  LOCATION = 'LOCATION',
}

export type PermissionStatus =
  | typeof RESULTS.GRANTED
  | typeof RESULTS.DENIED
  | typeof RESULTS.BLOCKED
  | typeof RESULTS.UNAVAILABLE
  | typeof RESULTS.LIMITED;

export interface PermissionState {
  notification: PermissionStatus | null;
  location: PermissionStatus | null;
  notificationAsked: boolean;
  locationAsked: boolean;
}

export interface PermissionServiceInterface {
  checkNotificationPermission: () => Promise<PermissionStatus>;
  checkLocationPermission: () => Promise<PermissionStatus>;
  requestNotificationPermission: () => Promise<PermissionStatus>;
  requestLocationPermission: () => Promise<PermissionStatus>;
  openSettings: () => Promise<void>;
  hasNotificationPermission: () => Promise<boolean>;
  hasLocationPermission: () => Promise<boolean>;
}
