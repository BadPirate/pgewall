import React from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import ReactFileReader from 'react-file-reader';
import RateCard from './RateCard';

export default class UsageSheet extends React.Component {
  state = {
    progress: 'No Data Loaded',
    usage: ''
  }
  render() {
    return (
      <div>
        <Card>
          <Card.Header>
            Load PGE CSV Electric Usage Data
          </Card.Header>
          <Card.Body>
            { this.state.progress ? <Alert variant="info">{this.state.progress}</Alert> : null }
            <Card.Text>
              Connect to PGE website and download a CSV of your solar output.  Feel free to clear the headers that 
              include account information and address, so that just the dates, hours, and KW used are present 
              (but make sure to include the header row that labels colums).  Last I checked you can find this by:
              <ul>
                <li>Logging into <a href="https://m.pge.com/#login">PGE Website</a></li>
                <li>Choosing "Solar and Energy Details" button</li>
                <li>Clicking the "Green Button" to Download my data</li>
                <li>Choosing "Export Usage for a Range"</li>
                <li>Setting range to be a calendar year (most recent year)</li>
                <li>Clicking Export</li>
              </ul>
            </Card.Text>
            <ReactFileReader handleFiles={f => this.handleFiles(f) } fileTypes={'.csv'}>
              <Button className='btn' variation='primary'>Upload</Button>
            </ReactFileReader>
          </Card.Body>
        </Card>
        { this.state.usage ? <RateCard usage={this.state.usage}/> : null }      
      </div>
    );
  }

  handleFiles(files) {
    this.setState({
      progress: 'Loading...'
    });
    var reader = new FileReader();
    reader.onload = e => {
      let usage = new Map();
      reader.result.split("\n").forEach(line => {
        if(line.startsWith('Electric usage')) {
          // 0             , 1        , 2   , 3   , 4  , 5 , 6
          // Electric usage,2019-06-30,19:00,19:59,0.13,kWh,
          let parts = line.split(',');
          if (parts.length !== 7) {
            console.log('Invalid length - ',parts.length);
          } else {
            let start = `${parts[1]},${parts[2]}`;
            let amount = parseFloat(parts[4]);
            let unit = parts[5];
            if (unit !== 'kWh') {
              console.log('Unknown unit - ',unit);
            } else {
              if (usage.has(start)) {
                usage.set(start,usage.get(start) + amount);
              } else {
                usage.set(start,amount);
              }
            }
          }
        }
      });
      this.setState({
        usage: usage,
        progress: 'Loaded.',
      });
    }
    reader.readAsText(files[0]);
  }
}