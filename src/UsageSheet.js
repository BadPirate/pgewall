import React from 'react';
import { Card, Button, Alert, InputGroup } from 'react-bootstrap';
import ReactFileReader from 'react-file-reader';
import RateCard from './RateCard';
import SolarCard from './SolarCard';

export default class UsageSheet extends React.Component {
  state = {
    progress: 'No Data Loaded',
    solar: false,
    usage: '',
    hasneg: false,
  }
  render() {
    return (
      <div>
        <Card>
          <Card.Header>
            Load PGE CSV Electric Usage Data
          </Card.Header>
          { this.state.progress ? <Alert variant="info">{this.state.progress}</Alert> : null }
          <Card.Body>
            <Card.Text>
              Connect to PGE website and download a CSV of your solar output.  Feel free to clear the headers that 
              include account information and address, so that just the dates, hours, and KW used are present 
              (but make sure to include the header row that labels colums).  Last I checked you can find this by:
            </Card.Text>
              <ul>
                <li>Logging into <a href="https://m.pge.com/#login">PGE Website</a></li>
                <li>Choosing "Energy Details" button</li>
                <li>Clicking the "Green Button" to Download my data</li>
                <li>Choosing "Export Usage for a Range"</li>
                <li>Setting range (A full year is needed for ROI prediction, but less will still provide data)</li>
                <li>Clicking Export</li>
              </ul>
            <ReactFileReader handleFiles={f => this.handleFiles(f) } fileTypes={'.csv'}>
              <Button className='btn' variation='primary'>Upload</Button>
            </ReactFileReader>
            <hr/>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Checkbox checked={this.state.solar} onChange={ e => {
                   this.setState({ solar: e.target.checked });
                   localStorage.setItem('solar',e.target.checked ? true : false);
                }}/>
              </InputGroup.Prepend>
              <InputGroup.Text>
                Net Energy Metering (Solar)
              </InputGroup.Text>
            </InputGroup>
          </Card.Body>
          {(this.state.hasneg && !this.state.solar) ? <Alert variant="danger">Warning! Negative electric usage in CSV, you should check Solar box below or results will be wrong</Alert> : null }
        </Card>
        { this.state.usage ? (this.state.solar ? <SolarCard usage={this.state.usage} enphaseUserID={this.props.enphaseUserID}/> : <RateCard usage={this.state.usage} solar={null}/>) : null }      
      </div>
    );
  }

  componentDidMount() {
    if (!this.state.usage && localStorage.getItem('usage')) {
      this.setState({
        usage: new Map(JSON.parse(localStorage.getItem('usage'))),
        solar: localStorage.getItem('solar') === 'true',
        hasneg: localStorage.getItem('hasneg') === 'true',
        progress: 'Restored.',
      });
    }
  }

  handleFiles(files) {
    this.setState({
      progress: 'Loading...'
    });
    var reader = new FileReader();
    reader.onload = e => {
      let usage = new Map();
      let hasneg = false;
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
            if(amount < 0) {
              hasneg = true;
            }
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
        hasneg: hasneg,
        solar: hasneg
      });
      localStorage.setItem('usage',JSON.stringify([...usage]));
      localStorage.setItem('solar',hasneg);
      localStorage.setItem('hasneg',hasneg);
    }
    reader.readAsText(files[0]);
  }
}