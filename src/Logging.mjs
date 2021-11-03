const env = 'dev'
const devEnv = env === 'dev'

export function logError(...args) {
  if (devEnv) {
    // eslint-disable-next-line no-console
    console.error(...args)
  }
}
export function logInfo(...args) {
  if (devEnv) {
    // eslint-disable-next-line no-console
    console.info(...args)
  }
}
