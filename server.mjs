import 'isomorphic-fetch'
import path, { dirname } from 'path'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { logInfo } from './src/Logging.mjs'
import errorHandlerMiddleware from './error_handler.mjs'

const filename = fileURLToPath(import.meta.url)

const dotEnvPath = path.resolve('./.env')
dotenv.config({ path: dotEnvPath })

const app = express()

// Cors
app.use(cors())

// Serve static files from the React app
app.use(express.static(path.join(dirname(filename), 'build')))

app.get('/api/nrel/pvwatts/hourly/:capacity/:type/:losses/:tilt/:address', (req, res, next) => {
  const apiKey = process.env.NREL_API_KEY
  if (!apiKey) {
    throw Error('NREL_API_KEY not set')
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
    .catch(next)
})

app.get('/api/*', () => {
  throw Error('Unknown API Request')
})

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  logInfo('Non-API Request - ', req.url)
  res.sendFile(path.join(`${dirname(filename)}/build/index.html`))
})

const port = process.env.PORT || 5000

app.use(errorHandlerMiddleware)
app.listen(port)

logInfo(`PGE-Wall API Server listening on ${port}`)
