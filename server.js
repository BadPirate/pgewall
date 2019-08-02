const express = require('express');
const path = require('path');
var cors = require('cors');
const app = express();

// Cors
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Put all API endpoints under '/api'
app.get('/api/enphase/*', (req, res) => {
  console.log("Enphase API request");
  res.status(200).json(['success?']);
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/build/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`PGE-Wall API Server listening on ${port}`);