import React from 'react';
import './App.css';
import { Card } from 'react-bootstrap';
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
        </Card.Body>
      </Card>
      <UsageSheet/>
    </div>
  );
}

export default App;
