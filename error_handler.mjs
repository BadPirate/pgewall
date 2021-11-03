import { logError, logInfo } from './src/Logging.mjs'

const NODE_ENVIRONMENT = process.env.NODE_ENV || 'development'

// src/middleware/error-handler.js

/**
 * Extract an error stack or error message from an Error object.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 *
 * @param {Error} error
 * @return {string} - String representation of the error object.
 */
function getErrorMessage(error) {
  if (error.stack) {
    return error.stack
  }

  if (typeof error.toString === 'function') {
    return error.toString()
  }

  return ''
}

/**
 * Determines if an HTTP status code falls in the 4xx or 5xx error ranges.
 *
 * @param {number} statusCode - HTTP status code
 * @return {boolean}
 */
function isErrorStatusCode(statusCode) {
  return statusCode >= 400 && statusCode < 600
}

/**
 * Look for an error HTTP status code (in order of preference):
 *
 * - Error object (`status` or `statusCode`)
 * - Express response object (`statusCode`)
 *
 * Falls back to a 500 (Internal Server Error) HTTP status code.
 *
 * @param {Object} options
 * @param {Error} options.error
 * @param {Object} options.response - Express response object
 * @return {number} - HTTP status code
 */
function getHttpStatusCode({ error, response }) {
  const statusCodeFromError = error.status || error.statusCode
  if (isErrorStatusCode(statusCodeFromError)) {
    return statusCodeFromError
  }
  const statusCodeFromResponse = response.statusCode
  if (isErrorStatusCode(statusCodeFromResponse)) {
    return statusCodeFromResponse
  }

  return 500
}

/**
 * Generic Express error handler middleware.
 *
 * @param {Error} error - An Error object.
 * @param {Object} request - Express request object
 * @param {Object} response - Express response object
 * @param {Function} next - Express `next()` function
 */
export default function errorHandlerMiddleware(error, request, response, next) {
  const errorMessage = getErrorMessage(error)

  logError(errorMessage)

  if (response.headersSent) {
    return next(error)
  }

  const errorResponse = {
    statusCode: getHttpStatusCode({ error, response }),
    body: undefined,
  }

  if (NODE_ENVIRONMENT !== 'production') {
    errorResponse.body = errorMessage
  }

  response.status(errorResponse.statusCode)

  response.format({
    'application/json': () => {
      response.json({ message: error.message, body: errorResponse.body })
    },
    default: () => {
      logInfo('Sent text/plain error response')
      response.type('text/plain').send(errorResponse.body)
    },
  })

  return next()
}
