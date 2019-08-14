import ReactGA from 'react-ga';
let tracking = process.env.REACT_APP_GOOGLE_TRACKING_ID;

/**
 * @param {string} category
 * @param {string} event event tag
 * @param {?Object} details metadata (optional)
 */
export const logEvent = (category, event, details = {}) => {
  details.category = category;
  details.action = event;
  if (tracking) {
    ReactGA.event(details);
  }
  console.log(details);
};


export const installTrackingIfEnabled = _ => {
  if (!window.dataLayer) window.dataLayer = [];
  if (tracking) {
    ReactGA.initialize(tracking);
    ReactGA.ga('js', new Date());
    ReactGA.ga('config', tracking);
  }
}