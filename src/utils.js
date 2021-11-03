import ReactGA from 'react-ga'
import { logInfo } from './Logging.mjs'

const tracking = process.env.REACT_APP_GOOGLE_TRACKING_ID

/**
 * @param {string} category
 * @param {string} event event tag
 * @param {?Object} details metadata (optional)
 */
export const logEvent = (category, event, providedDetails = {}) => {
  const details = providedDetails
  details.category = category
  details.action = event
  if (tracking) {
    ReactGA.event(details)
  }
  logInfo(details)
}

export const installTrackingIfEnabled = () => {
  if (!window.dataLayer) window.dataLayer = []
  if (tracking) {
    ReactGA.initialize(tracking)
    ReactGA.ga('js', new Date())
    ReactGA.ga('config', tracking)
  }
}

/**
   * @param {string} date YYYY-MM-DD
   * @returns {number} date of the year 0-364
   */
export function dayOfYear(givenDate) {
  const date = new Date(givenDate)
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000)
  const oneDay = 1000 * 60 * 60 * 24
  const day = Math.floor(diff / oneDay)
  return day
}

export function pad(num, size) {
  let ns = num.toString()
  while (ns.length < size) ns = `0${ns}`
  return ns
}
