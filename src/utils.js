import { gtag } from 'ga-gtag';
/**
 * @param {string} event event tag
 * @param {?Object} details metadata (optional)
 */
export const logEvent = (event, details = null) => {
  if (process.env.GOOGLE_TRACKING_ID) {
    if (details) {
      gtag(event, details);
    }
    else {
      gtag(event);
    }
  }
  console.log(event, details);
};
