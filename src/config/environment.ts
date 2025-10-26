import { MAPTILER_API_KEY, API_URL, ENV, DEBUG, LOG_LEVEL, MAPLIBRE_STYLE_URL } from '@env';
import { logger } from '../utils/logger';

// Log environment configuration (only in development)
if (__DEV__) {
  logger.debug('Environment configuration loaded');
  logger.debug('API_URL:', API_URL || 'undefined');
  logger.debug('ENV:', ENV || 'undefined');
  logger.debug('DEBUG:', DEBUG || 'undefined');
  logger.debug('LOG_LEVEL:', LOG_LEVEL || 'undefined');
  logger.debug('MAPLIBRE_STYLE_URL:', MAPLIBRE_STYLE_URL || 'undefined');
  logger.debug('MAPTILER_API_KEY:', MAPTILER_API_KEY ? 'loaded' : 'missing');
}

// import { Alert } from 'react-native';
// // Alert for more visible testing
// setTimeout(() => {
//   Alert.alert(
//     'Environment Variables Test',
//     `API Key: ${MAPTILER_API_KEY ? `${MAPTILER_API_KEY.substring(0, 4)}...` : 'missing'}\nENV: ${ENV || 'undefined'}`
//   );
// }, 2000);

export const getMapTilerApiKey = (): string => {
  return MAPTILER_API_KEY || '';
};

export const getApiUrl = (): string => {
  return API_URL || '';
};

export const getMapLibreStyleUrl = (): string => {
  return MAPLIBRE_STYLE_URL || '';
};

export const getEnvironment = (): string => {
  return ENV || 'development';
};

export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};