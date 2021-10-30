import { logInfo } from './Logging.mjs'

const serverBase = (process.env.NODE_ENV === 'development') ? `${window.location.protocol}//${window.location.hostname}:5000` : ''

export function API(cmd) {
  const call = `${serverBase}/api/${cmd}`
  return fetch(call)
    .then((response) => {
      logInfo(response)
      return response.json()
    })
}

export class EnphaseAPI {
  constructor(userID) {
    this.userID = userID
    this.system = ''
    this.systems = ''
  }

  getSystems() {
    if (this.systems) {
      return new Promise((resolve) => { resolve(this.systems) })
    }
    return this.api('systems')
  }

  getProduction(systemID, start, end) {
    return this.api(`${systemID}/production/${start}/${end}`)
  }

  api(cmd) {
    if (!this.userID) throw new Error('User ID not set before making Enphase API call')
    return API(`enlighten/${this.userID}/${cmd}`)
  }
}
