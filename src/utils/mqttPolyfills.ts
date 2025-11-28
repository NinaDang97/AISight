import { Buffer } from 'buffer';

// Minimal Node globals needed by MQTT.js when running under React Native.

const globalObject = globalThis as Record<string, any>;

if (typeof globalObject.Buffer === 'undefined') {
  globalObject.Buffer = Buffer;
}

if (typeof globalObject.process === 'undefined') {
  globalObject.process = {};
}

if (typeof globalObject.process.env === 'undefined') {
  globalObject.process.env = {};
}

if (typeof globalObject.process.nextTick !== 'function') {
  globalObject.process.nextTick = (callback: (...args: any[]) => void, ...args: any[]) => {
    return setTimeout(callback, 0, ...args);
  };
}

if (typeof globalObject.process.browser === 'undefined') {
  globalObject.process.browser = true;
}

if (typeof globalObject.navigator === 'undefined') {
  globalObject.navigator = {};
}

if (typeof globalObject.navigator.product === 'undefined') {
  globalObject.navigator.product = 'ReactNative';
}

if (typeof globalObject.navigator.userAgent === 'undefined') {
  globalObject.navigator.userAgent = 'ReactNative';
}

if (typeof globalObject.navigator.platform === 'undefined') {
  globalObject.navigator.platform = 'ReactNative';
}

if (typeof globalObject.navigator.language === 'undefined') {
  globalObject.navigator.language = 'en';
}
