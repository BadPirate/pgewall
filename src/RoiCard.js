import React from 'react';
import { Card, FormControl, InputGroup, Table, Alert } from 'react-bootstrap';

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
    let days = 0;
    for (let index = 0; index < 10; index++) {
      let decay = ((1-dc)/10)*index;
      let {results, calc} = this.props.results(decay,rate);
      days = calc.days;
      let mod = 365/days;
      rate *= 1+rh;
      let total = results[results.length - 1];
      unpaid -= total.savings * mod;
      breakdown.push({
        year: index + 1,
        storage: this.props.storage/(1+decay),
        charged: total.charged * mod,
        discharged: total.discharged * mod,
        grid: total.grid * mod,
        cost: total.cost * mod,
        savings: total.savings * mod,
        unpaid: unpaid,
      });
    }
    return (
      <Card>                      
        <Card.Header>
          Return on Investment
        </Card.Header>
        <Card.Body>
          {
            days !== 365
            ? <Alert variant="danger">
                Upload 1 year of data to make an ROI estimate ({days} uploaded) - because of this, data will be simulated (poorly) as if the period
                you did provide was representative of solar production / usage for the calendar year (not really representative, so huge grains of salt)
              </Alert>
            : null
          }
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
                  Battery Charge
                </th>
                <th>
                  Battery Discharge
                </th>
                <th>
                  Grid Use
                </th>
                <th>
                  Bill
                </th>
                <th>
                  Savings
                </th>
                <th>
                  Lifetime Net
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
                      {y.storage.toFixed(0)} kWH
                    </td>
                    <td>
                      {y.charged.toFixed(0)} kWH
                    </td>
                    <td>
                      {y.discharged.toFixed(0)} kWH
                    </td>
                    <td>
                      ${y.grid.toFixed(0)} kWH
                    </td>
                    <td>
                      ${y.cost.toFixed(2)}
                    </td>
                    <td>
                      ${y.savings.toFixed(2)}
                    </td>
                    <td>${y.unpaid.toFixed(2)}</td>
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