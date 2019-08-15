import React from 'react';
import { Card, InputGroup, FormControl, Dropdown, DropdownButton, Button, Alert } from 'react-bootstrap';
import RateCard from './RateCard';
import { PVWattsAPI } from './Api';
export class SimulationCard extends React.Component {
  state={
    capacity: '',
    type: 'Standard',
    losses: 25,
    tilt: 14,
    address: '',
    status: '',
    simulated: '',
  }

  render() {
    return ([
      <Card>
        <Card.Header>
          Solar Simulator
        </Card.Header>
        { this.state.status ? <Alert variant="info">{this.state.status}</Alert> : null }
        <Card.Body>
          Because purchasing a Solar System is likely to be a better ROI than Powerwall (I mean, harvesting energy from the sun seems like a pretty good way to make free money),
          I've added a Solar System Simulator.  It can work on top of an existing solar system (as long as you have data for the actual production), or for no system at all.
          <InputGroup>
            <FormControl placeholder="Capacity" onChange={ e => { this.setState({ capacity: e.target.value })}} value={this.state.capacity}/>
            <InputGroup.Text>kW</InputGroup.Text>
            <DropdownButton title={this.state.type} variant="outline-secondary">
              <Dropdown.Item onClick={ _ => { this.setState({ type: "Standard" })}}>Standard</Dropdown.Item>
              <Dropdown.Item onClick={ _ => { this.setState({ type: "Premium" })}}>Premium</Dropdown.Item>
              <Dropdown.Item onClick={ _ => { this.setState({ type: "Thin Film" })}}>Thin Film</Dropdown.Item>
            </DropdownButton>
            <FormControl placeholder="losses" onChange={ e => { this.setState({ losses: e.target.value })}} value={this.state.losses}/>
            <InputGroup.Text>%</InputGroup.Text>
            <FormControl placeholder="tilt" onChange={ e => { this.setState({ tilt: e.target.value })}} value={this.state.tilt}/>
            <InputGroup.Text>degs</InputGroup.Text>
            <FormControl placeholder="address" onChange={ e => { this.setState({ address: e.target.value })}} value={this.state.address}/>
            <InputGroup.Append>
              <Button variation="primary" onClick={ _ => {
                let api = new PVWattsAPI();
                let type = 0;
                switch(this.state.type) {
                  case 'Premium': type = 1; break;
                  case 'Thin Film': type = 2; break;
                  default: break;
                }
                api.hourlySimulation(parseFloat(this.state.capacity), type, parseFloat(this.state.losses), parseFloat(this.state.tilt), this.state.address)
                .then(result => {
                  console.log(result);
                  let day = 0;
                  let hour = 0;
                  let simulated = new Map(result.map(ac => {
                    let spread = [ `${day}-${hour}`, ac ];
                    if (hour===23) {
                      day++;
                      hour = 0;
                    } else {
                      hour++;
                    }
                    return spread;
                  }));
                  console.log(simulated);
                  this.setState({
                    simulated: simulated,
                    status: `Loaded ${day} days of simulated production`
                  });
                  localStorage.setItem('simulatedProduction',JSON.stringify([...simulated]))
                }, error => {
                  this.setState({
                    status: `Error - ${error.toString()}`
                  });
                })
                this.setState({
                  status: 'Retrieving Simulated Production',
                });
              }}>
                Calculate
              </Button>
            </InputGroup.Append>
          </InputGroup>
        </Card.Body>
      </Card>,
      <RateCard usage={this.props.usage} production={this.props.production} simulated={this.state.simulated}/>
    ]);
  }

  componentDidMount() {
    let stored = localStorage.getItem('simulatedProduction');
    if (!this.state.simulated && stored) {
      this.setState({
        simulated: new Map(JSON.parse(stored)),
        status: 'Retrieved previous simulation values',
      })
    }
  }
}
