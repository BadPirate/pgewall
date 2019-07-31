import React from 'react';
import './App.css';
import { Card, Alert } from 'react-bootstrap';
import UsageSheet from './UsageSheet';

function App() {
  return (
    <div className="App">
      <Card>
        <Card.Header>Welcome</Card.Header>
        <Card.Body>
          <Card.Text>
            This is a calculator for people who:
          </Card.Text>
          <ul>
              <li>Are PGE Customers</li>
              <li>Have Solar, and are on NEM (Net Metering)</li>
              <li>Are interested in buying a Tesla Powerall</li>
          </ul>
          <p>For more details <a href="https://github.com/BadPirate/pgewall">Checkout the GitHub Repo</a>.</p>
          <Alert variant="info">
            <h5>
              Privacy
            </h5>
            <p>This site is Javascript (runs locally) so no data is sent to our servers or uploaded.  I don't want it.
            But don't take my word for it,
            <a href="https://github.com/BadPirate/pgewall">download and checkout the code yourself</a></p>.
          </Alert>
          <Alert variant="warning">
            <h5>
              Disclaimer
            </h5>
            <p>Lots of things can change, and I'm no expert just a hobbiest.  Any information you get from this tool is used at your own
            risk.  If you see something wrong <a href="https://github.com/BadPirate/pgewall/issues/new">file an issue</a></p>
          </Alert>
        </Card.Body>
      </Card>
      <UsageSheet/>
    </div>
  );
}

export default App;
