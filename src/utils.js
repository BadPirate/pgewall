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

  /**
   * @param {string} date YYYY-MM-DD
   * @returns {number} date of the year 0-364
   */
  export function dayOfYear(date) 
  {
    date = new Date(date);
    var start = new Date(date.getFullYear(), 0, 0);
    var diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay);
    return day;
  }