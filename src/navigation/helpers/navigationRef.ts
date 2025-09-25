import { createNavigationContainerRef, StackActions } from '@react-navigation/native';
import { RootStackParamList } from '../types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate({
        name,
        params,
      } as any);
  } else {
    console.warn('Navigation attempted before navigator was ready');
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function replace<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name, params));
}
}

export function reset(state: any) {
  if (navigationRef.isReady()) {
    navigationRef.reset(state);
  }
}

export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute();
  }
  return null;
}

export function getCurrentOptions() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentOptions();
  }
  return null;
}
