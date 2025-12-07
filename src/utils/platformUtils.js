// Platform detection utilities for ParaDash
// Determines whether we're running on web or native (Android/iOS)

import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running on a native platform (Android or iOS)
 * This is called at runtime, not at module load time, to ensure Capacitor is ready
 * @returns {boolean} True if running on native platform
 */
export function isNativePlatform() {
  const platform = Capacitor.getPlatform();
  return platform === 'android' || platform === 'ios';
}

/**
 * Check if the app is running on web
 * @returns {boolean} True if running on web platform
 */
export function isWebPlatform() {
  return Capacitor.getPlatform() === 'web';
}

/**
 * Get the current platform name
 * @returns {string} Platform name: 'android', 'ios', or 'web'
 */
export function getPlatform() {
  return Capacitor.getPlatform();
}

/**
 * Check if the app is running on Android
 * @returns {boolean} True if running on Android
 */
export function isAndroid() {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Check if the app is running on iOS
 * @returns {boolean} True if running on iOS
 */
export function isIOS() {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Check if native features are available
 * This is useful for conditional feature rendering
 * @param {string} pluginName - Name of the Capacitor plugin to check
 * @returns {boolean} True if the plugin is available
 */
export function isPluginAvailable(pluginName) {
  return Capacitor.isPluginAvailable(pluginName);
}

export default {
  isNativePlatform,
  isWebPlatform,
  getPlatform,
  isAndroid,
  isIOS,
  isPluginAvailable,
};
