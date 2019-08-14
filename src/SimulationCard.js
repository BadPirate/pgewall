import React from 'react';
import { Card, InputGroup, FormControl, Dropdown, DropdownButton } from 'react-bootstrap';
import RateCard from './RateCard';
import Form from 'react-bootstrap/FormControl';

export class SimulationCard extends React.Component {
  render() {
    return ([
      <Card>
        <Card.Header>
          Solar Simulator
        </Card.Header>
        <Card.Body>
          Because purchasing a Solar System is likely to be a better ROI than Powerwall (I mean, harvesting energy from the sun seems like a pretty good way to make free money),
          I've added a Solar System Simulator.  It can work on top of an existing solar system (as long as you have data for the actual production), or for no system at all.
          <InputGroup>
            <FormControl placeholder="Capacity"></FormControl>
            <InputGroup.Text>kW</InputGroup.Text>
            <DropdownButton title="Standard" variant="outline-secondary">
              <Dropdown.Item>Standard</Dropdown.Item>
              <Dropdown.Item>Premium</Dropdown.Item>
              <Dropdown.Item>Thin Film</Dropdown.Item>
            </DropdownButton>
            <FormControl placeholder="losses"/>
            <InputGroup.Text>%</InputGroup.Text>
            <FormControl placeholder="tilt"/>
            <InputGroup.Text>degs</InputGroup.Text>
            <FormControl placeholder="address"/>
          </InputGroup>
        </Card.Body>
      </Card>,
      <RateCard usage={this.props.usage} production={this.props.production}/>
    ]);
  }
}
