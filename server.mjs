import EnlightenAPI from 'enlighten-api'
import 'isomorphic-fetch'
import path, { dirname } from 'path'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { logError, logInfo } from './src/Logging.mjs'

const filename = fileURLToPath(import.meta.url)

const dotEnvPath = path.resolve('./.env')
dotenv.config({ path: dotEnvPath })

const app = express()

let lastApi = ''

function getSystem(api, system) {
  return api.getServers()
    .then((servers) => servers.get(system))
}

function reportError(res) {
  return (error) => {
    logError('Error - ', error)
    res.status(500).json(error)
  }
}

/**
 * Quick function to re-use Enlighten API caching if calls are all to the same userID
 * @param {string} userID
 * @returns {EnlightenAPI} an enlighten API instance
 */
function enlightenAPI(userID) {
  if (!lastApi || lastApi.userID !== userID) {
    lastApi = new EnlightenAPI(userID)
  }
  return lastApi
}

// Cors
app.use(cors())

// Serve static files from the React app
app.use(express.static(path.join(dirname(filename), 'build')))

app.get('/api/enlighten/:user_id/systems', (req, res) => {
  logInfo('Enlighten systems requrest - ', req.params)
  const userID = req.params.user_id
  const api = enlightenAPI(userID)
  api.getServers()
    .then((servers) => {
      const out = [...servers.values()]
      res.status(200).json(out)
    }, reportError(res))
})

// Put all API endpoints under '/api'
app.get('/api/enlighten/:user_id/:system/production/:start/:end', (req, res) => {
  logInfo('Enlighten Usage request - ', req.params.start, req.params.end)
  const userID = req.params.user_id
  const system = parseInt(req.params.system, 10)
  const api = enlightenAPI(userID)
  getSystem(api, system)
    .then((sys) => {
      const startAt = parseInt(req.params.start, 10)
      const endAt = parseInt(req.params.end, 10)
      logInfo(startAt, '-', endAt)
      return sys.getEnergyProduced(startAt, endAt)
    })
    .then((total) => {
      res.status(200).json(total)
    })
    .catch(reportError(res))
})

app.get('/api/nrel/pvwatts/hourly/:capacity/:type/:losses/:tilt/:address', (req, res) => {
  const apiKey = process.env.NREL_API_KEY
  if (!apiKey) {
    throw new Error('Must set API Key for NREL to use this - NREL_API_KEY env')
  }
  logInfo('nrel/pvwatts/hourly request', req.params)
  const url = new URL('https://developer.nrel.gov/api/pvwatts/v6.json')
  const params = {
    api_key: process.env.NREL_API_KEY,
    format: 'json',
    system_capacity: parseFloat(req.params.capacity),
    array_type: parseInt(req.params.type, 10),
    tilt: parseFloat(req.params.tilt),
    module_type: 0,
    azimuth: 180,
    address: req.params.address,
    timeframe: 'hourly',
    losses: parseFloat(req.params.losses),
  }
  Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]))
  fetch(url.toString())
    .then((response) => response.json())
    .then((obj) => {
      logInfo(obj)
      return obj.outputs.ac
    })
    .then((result) => {
      res.status(200).json(result)
    })
    .catch(reportError(res))
})

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  logInfo('Non-API Request - ', req.url)
  res.sendFile(path.join(`${dirname(filename)}/build/index.html`))
})

const port = process.env.PORT || 5000
app.listen(port)

logInfo(`PGE-Wall API Server listening on ${port}`)
