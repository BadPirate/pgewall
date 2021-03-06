import EnlightenAPI from "enlighten-api";
import "isomorphic-fetch";
const path = require('path');
var dotEnvPath = path.resolve('./.env');
require('dotenv').config({ path: dotEnvPath});
const express = require('express');
var cors = require('cors');
const app = express();

let lastApi = '';

// Cors
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

app.get('/api/enlighten/:user_id/systems', (req, res) => {
  console.log("Enlighten systems requrest - ",req.params);
  let userID = req.params.user_id;
  let api = enlightenAPI(userID);
  api.getServers()
  .then( servers => {
    let out = [...servers.values()];
    res.status(200).json(out);
  }, reportError(res));
});

// Put all API endpoints under '/api'
app.get('/api/enlighten/:user_id/:system/production/:start/:end', (req, res) => {
  console.log("Enlighten Usage request - ",req.params.start,req.params.end);
  let userID = req.params.user_id;
  let system = parseInt(req.params.system);
  let api = enlightenAPI(userID);
  getSystem(api, system)
  .then(system => {
    let startAt = parseInt(req.params.start);
    let endAt = parseInt(req.params.end);
    console.log(startAt,"-",endAt);
    return system.getEnergyProduced(startAt,endAt);
  })
  .then(total => {
    res.status(200).json(total);
  })
  .catch(reportError(res));
});

app.get('/api/nrel/pvwatts/hourly/:capacity/:type/:losses/:tilt/:address', (req, res) => {
  let apiKey = process.env.NREL_API_KEY;
  if (!apiKey) {
    throw new Error('Must set API Key for NREL to use this - NREL_API_KEY env');
  }
  console.log("nrel/pvwatts/hourly request",req.params);
  let url = new URL("https://developer.nrel.gov/api/pvwatts/v6.json");
  let params = {
    api_key: process.env.NREL_API_KEY,
    format: 'json',
    system_capacity: parseFloat(req.params.capacity),
    array_type: parseInt(req.params.type),
    tilt: parseFloat(req.params.tilt),
    module_type: 0,
    azimuth: 180,
    address: req.params.address,
    timeframe: 'hourly',
    losses: parseFloat(req.params.losses),
  }
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  fetch(url.toString())
  .then(response => {
    return response.json();
  })
  .then(obj => {
    console.log(obj);
    return obj.outputs.ac;
  })
  .then(result => {
    res.status(200).json(result);
  })
  .catch(reportError(res));
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  console.log('Non-API Request - ',req.url);
  res.sendFile(path.join(__dirname+'/build/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`PGE-Wall API Server listening on ${port}`);

function getSystem(api, system) {
  return api.getServers()
    .then(servers => {
      return servers.get(system);
    });
}

function reportError(res) {
  return error => {
    console.log("Error - ", error);
    res.status(500).json(error);
  };
}

/**
 * Quick function to re-use Enlighten API caching if calls are all to the same userID
 * @param {string} userID
 * @returns {EnlightenAPI} an enlighten API instance 
 */
function enlightenAPI(userID) {
  if (!lastApi || lastApi.userID !== userID) {
    console.log('New API - ',userID);
    lastApi = new EnlightenAPI(userID);
  }
  return lastApi;
}
