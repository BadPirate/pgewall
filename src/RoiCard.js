import React from 'react';
import { Card, FormControl, InputGroup, Table } from 'react-bootstrap';

export default class RoiCard extends React.Component {
  state = {
    batteryCost: 6700,
    gatewayCost: 1100,
    installation: 1000,
    decayCap: 0.7,
    ratehike: 0.06,
  }

  render() {
    let breakdown = [];
    let bc = parseFloat(this.state.batteryCost);
    let gc = parseFloat(this.state.gatewayCost);
    let ic = parseFloat(this.state.installation);
    let dc = parseFloat(this.state.decayCap);
    let rh = parseFloat(this.state.ratehike);
    let unpaid = bc * this.props.batteries + gc + ic;
    let rate = 1;
    for (let index = 0; index < 10; index++) {
      let decay = 1 - ((1-dc) * .1 * index);
      let storage = this.props.storage * decay * this.props.batteries;
      let calc = this.props.calc(storage/this.props.batteries, rate, 365);
      rate = rate * (1 + rh);
      unpaid -= calc.saved;
      breakdown.push({
        storage: storage,
        year: index + 1,
        sa: calc.sa,
        pa: calc.pa,
        saved: calc.saved,
        net: -unpaid,
      });
    }
    return (
      <Card>
        <Card.Header>
          Return on Investment
        </Card.Header>
        <Card.Body>
          <Card.Text>
            For this you should put in the cost per battery, installation costs, and the expected % capacity after 10 years.
            I've prefilled with the numbers for Powerwall 2 and the current Tesla 10 year warranty expectation.  The simulation
            table below shows year over year how much would be saved if your usage patterns and the rate of decay in efficacy.
            Rate increase is the expected increase in electric utility price year over year, PGE has typically been 6% (0.06).
          </Card.Text>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>         
                Cost per Battery
              </InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl type="input" value={this.state.batteryCost} onChange={ e => { this.setState({ batteryCost: e.target.value })}}/>
            <InputGroup.Text>
              Cost of Gateway
            </InputGroup.Text>
            <FormControl type="input" value={this.state.gatewayCost} onChange={ e => { this.setState({ gatewayCost: e.target.value })}}/>
          </InputGroup>
          <InputGroup>
            <InputGroup.Text>
                Cost of Installation
            </InputGroup.Text>
            <FormControl type="input" value={this.state.installation} onChange={ e => { this.setState({ installation: e.target.value })}}/>
            <InputGroup.Text>         
              10 year capacity
            </InputGroup.Text>
            <FormControl type="input" value={this.state.decayCap} onChange={ e => { this.setState({ decayCap: e.target.value })}}/>
            <InputGroup.Text>         
              Rate Increase
            </InputGroup.Text>
            <FormControl type="input" value={this.state.ratehike} onChange={ e => { this.setState({ ratehike: e.target.value })}}/>
          </InputGroup>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>
                  Year
                </th>
                <th>
                  Storage
                </th>
                <th>
                  Peak Arbitrage
                </th>
                <th>
                  Shoulder Arbitrage
                </th>
                <th>
                  Saved
                </th>
                <th>
                  Total Net
                </th>
              </tr>
            </thead>
            <tbody>
            {
              breakdown.map(y => {
                return (
                  <tr key={y.year}>
                    <td>
                      {y.year}
                    </td>
                    <td>
                      {y.storage.toFixed(1)} kWH
                    </td>
                    <td>
                      {y.pa.toFixed(1)} kWH
                    </td>
                    <td>
                      {y.sa.toFixed(1)} kWH
                    </td>
                    <td>
                      ${y.saved.toFixed(2)}
                    </td>
                    <td>
                      ${y.net.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            }
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  }
}