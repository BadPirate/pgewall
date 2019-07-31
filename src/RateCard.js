import React from 'react';
import { Card, Table, InputGroup, FormControl } from 'react-bootstrap';
import PowerwallCard from './PowerwallCard';

export default class RateCard extends React.Component 
{
  state = {
    peakStart: '14:00',
    peakEnd: '21:00',
    peakRate: '.51832',
    offStart: '23:00',
    offEnd: '07:00',
    offRate: '.13452',
    shoulderRate: '.28096',
  }

  update(name, value)
  {
    let map = new Map([[name, value]]);
    this.setState(map);
  }

  render() {
    let periods = new Map(
      [[ 'peak', 0 ],
      [ 'offpeak', 0 ],
      [ 'shoulder', 0]]
    );
    let ps = parseInt(this.state.peakStart.split(':')[0]);
    let pe = parseInt(this.state.peakEnd.split(':')[0]);
    let os = parseInt(this.state.offStart.split(':')[0]);
    let oe = parseInt(this.state.offEnd.split(':')[0]);
    let pr = parseFloat(this.state.peakRate);
    let or = parseFloat(this.state.offRate);
    let sr = parseFloat(this.state.shoulderRate);
    let total = parseFloat(0);
    let totalCost = parseFloat(0);
    this.props.usage.forEach((value, key) => {
      let parts = key.split(',')[1].split(':');
      let time = parseInt(parts[0]);
      if (time >= ps && time < pe) {
        periods.set('peak',periods.get('peak') + value);
        totalCost += value * pr;
      } else if (   (os > pe && time >= os && time < 24)
                 || (time < oe) ) 
      {
        periods.set('offpeak',periods.get('offpeak') + value);
        totalCost += value * or;
      } else {
        periods.set('shoulder',periods.get('shoulder') + value);
        totalCost += value * sr;
      }
      total += value;
    });
    return (
      <div>
        <Card>
          <Card.Header>
            Update Rate Periods
          </Card.Header>
          <Card.Body>
            <Card.Text>
              Now you'll need to lookup the hours of your various rate periods and their rates, 
              and adjust these fields below as needed.  I've filled out 2019 rate for the EV-A plan.
              Note, that some Time of Use plans have different rates during winter and summer months,
              currently I don't support this, because the arbitrage is less valuable in those cases
              so likely it's a worse plan for this strategy in general.
            </Card.Text>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>
                  Peak
                </InputGroup.Text>
              </InputGroup.Prepend>
              <InputGroup.Text>
                From
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ peakStart: e.target.value })}} value={this.state.peakStart}/>
              <InputGroup.Text>
                To
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ peakEnd: e.target.value })}} value={this.state.peakEnd}/>
              <InputGroup.Text>
                Rate
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ peakRate: e.target.value })}} value={this.state.peakRate}/>
            </InputGroup>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>
                  Off-Peak
                </InputGroup.Text>
              </InputGroup.Prepend>
              <InputGroup.Text>
                From
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ offStart: e.target.value })}} value={this.state.offStart}/>
              <InputGroup.Text>
                To
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ offEnd: e.target.value })}} value={this.state.offEnd}/>
              <InputGroup.Text>
                Rate
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ offRate: e.target.value })}} value={this.state.offRate}/>
            </InputGroup>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>
                  Shoulder
                </InputGroup.Text>
              </InputGroup.Prepend>
              <InputGroup.Text>
                Rate
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ shoulderRate: e.target.value })}} value={this.state.shoulderRate}/>
            </InputGroup>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Total Usage</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {
                  Array.from(periods, ([key, value]) => {
                    var r = sr;
                    if (key === 'peak') {
                      r = pr;
                    } else if (key === 'offpeak') {
                      r = or;
                    }                
                    let cost = (value * r).toFixed(2);
                    return (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>{value.toFixed(2)} kWH</td>
                        <td>${cost}</td>
                      </tr>
                    );
                  })
                }
                <tr>
                  <td>Total</td>
                  <td>{total.toFixed(2)} kWH</td>
                  <td>${totalCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        <PowerwallCard usage={this.props.usage} peakStart={ps} peakEnd={pe} peakRate={pr}
                       offStart={os} offEnd={oe} offRate={or} shoulderRate={sr} />
      </div>
    );
  }
}