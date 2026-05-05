import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard iPhone 11 screen
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Converts provided width percentage to independent pixel (dp).
 * @param {string} widthPercent The percentage of screen's width that UI element should cover.
 * @return {number} The calculated dp depending on current device's width.
 */
export const wp = (widthPercent: number | string): number => {
  const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel(SCREEN_WIDTH * elemWidth / 100);
};

/**
 * Converts provided height percentage to independent pixel (dp).
 * @param {string} heightPercent The percentage of screen's height that UI element should cover.
 * @return {number} The calculated dp depending on current device's height.
 */
export const hp = (heightPercent: number | string): number => {
  const elemHeight = typeof heightPercent === "number" ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel(SCREEN_HEIGHT * elemHeight / 100);
};

/**
 * Scale value based on screen width.
 * @param {number} size Size in dp.
 * @return {number} Scaled size.
 */
export const scale = (size: number): number => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Vertical scale value based on screen height.
 * @param {number} size Size in dp.
 * @return {number} Scaled size.
 */
export const verticalScale = (size: number): number => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate scale value based on screen width with factor.
 * @param {number} size Size in dp.
 * @param {number} factor Factor to control scaling intensity (default 0.5).
 * @return {number} Scaled size.
 */
export const moderateScale = (size: number, factor = 0.5): number => size + (scale(size) - size) * factor;

/**
 * Responsive Font Size.
 * @param {number} size Size in dp.
 * @return {number} Scaled font size.
 */
export const rf = (size: number): number => moderateScale(size, 0.3);

export const IS_SMALL_DEVICE = SCREEN_WIDTH < 375;
export const IS_TABLET = SCREEN_WIDTH > 600;

export default {
  wp,
  hp,
  scale,
  verticalScale,
  moderateScale,
  rf,
  IS_SMALL_DEVICE,
  IS_TABLET,
};
