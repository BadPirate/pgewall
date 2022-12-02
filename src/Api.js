import { logError, logInfo } from './Logging.mjs'

const serverBase = (process.env.NODE_ENV === 'development') ? `${window.location.protocol}//${window.location.hostname}:3001` : ''

export default function API(cmd) {
  const call = `${serverBase}/api/${cmd}`
  return fetch(call, {
    headers: {
      'Content-Type': 'application/json',
      'Accept-Type': 'application/json',
    },
  })
    .then((response) => {
      const ct = response.headers.get('Content-Type')
      if (response.status > 299) {
        logError(`Invalid response status ${response.status}`, response)
        switch (ct.split(';')[0]) {
          case 'application/json':
            return response.text().then((t) => {
              let parsedError = null
              try {
                const j = JSON.parse(t)
                if (j.message) {
                  logError('Server reported error', j)
                  parsedError = Error(j.message)
                } else {
                  logError('Unable to find message value', j)
                  throw Error('Error json has no message field')
                }
              } catch (e) {
                logError('Error parsing error JSON', t, e, response)
                throw Error('Unable to parse error JSON')
              }
              throw parsedError
            })
          default:
            return response.text().then((t) => {
              logError(`Server sent non-json response: ${ct}`, response, t)
              throw Error(t)
            })
        }
      }
      switch (ct.split(';')[0]) {
        case 'application/json':
          return response.json().then((j) => {
            logInfo('API Response', j)
            return j
          })
        default:
          logError('Non JSON success response', response)
          throw Error(`Unexpected non-json response: ${ct}`)
      }
    })
}
