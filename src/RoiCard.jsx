import React from 'react'
import PropTypes from 'prop-types'
import {
  Card, FormControl, InputGroup, Table, Alert,
} from 'react-bootstrap'

export default class RoiCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      batteryCost: 6700,
      gatewayCost: 1100,
      installation: 1000,
      decayCap: 0.7,
      ratehike: 0.06,
      solarcost: 0,
    }
  }

  render() {
    const {
      simulated, results: getResults, storage,
    } = this.props
    const {
      solarcost, batteryCost, gatewayCost, installation, decayCap, ratehike,
    } = this.state
    let { batteries } = this.props
    const breakdown = []
    batteries = parseInt(batteries, 10)
    const bc = parseFloat(batteryCost)
    const gc = parseFloat(gatewayCost)
    const ic = parseFloat(installation)
    const dc = parseFloat(decayCap)
    const rh = parseFloat(ratehike)
    let unpaid = (bc * batteries) + (batteries ? (gc + ic) : 0)
    + (simulated ? parseFloat(solarcost) : 0)
    let rate = 1
    let days = 0
    for (let index = 0; index < 10; index += 1) {
      const decay = ((1 - dc) / 10) * index
      const { results, calc } = getResults(decay, rate, (simulated))
      days = calc.days
      const mod = 365 / days
      rate *= 1 + rh
      const total = results[results.length - 1]
      const savings = simulated ? total.solarSavings : total.savings
      unpaid -= savings * mod
      breakdown.push({
        year: index + 1,
        storage: storage / (1 + decay),
        charged: total.charged * mod,
        discharged: total.discharged * mod,
        grid: total.grid * mod,
        cost: total.cost * mod,
        savings: savings * mod,
        unpaid,
      })
    }
    return (
      <Card>
        <Card.Header>
          Return on Investment
        </Card.Header>
        <Card.Body>
          {
            days !== 365
              ? (
                <Alert variant="danger">
                  Upload 1 year of data to make an ROI estimate (
                  {days}
                  {' '}
                  uploaded) - because of this, data will be simulated (poorly) as if the period
                  you did provide was representative of solar production/usage for the calendar year
                  (not really representative, so huge grains of salt)
                </Alert>
              )
              : null
          }
          <Card.Text>
            For this you should put in the cost per battery, installation costs, and the expected
            % capacity after 10 years. I&apos;ve prefilled with the numbers for Powerwall 2 and the
            current Tesla 10 year warranty expectation.  The simulation table below shows year over
            year how much would be saved if your usage patterns and the rate of decay in efficacy.
            Rate increase is the expected increase in electric utility price year over year,
            PGE has typically been 6% (0.06).
          </Card.Text>
          {
            batteries === 0 ? null : [
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>
                    Cost per Battery
                  </InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl type="input" value={batteryCost} onChange={(e) => { this.setState({ batteryCost: e.target.value }) }} />
                <InputGroup.Text>
                  Cost of Gateway
                </InputGroup.Text>
                <FormControl type="input" value={gatewayCost} onChange={(e) => { this.setState({ gatewayCost: e.target.value }) }} />
              </InputGroup>,
              <InputGroup>
                <InputGroup.Text>
                  Cost of Installation
                </InputGroup.Text>
                <FormControl type="input" value={installation} onChange={(e) => { this.setState({ installation: e.target.value }) }} />
                <InputGroup.Text>
                  10 year capacity
                </InputGroup.Text>
                <FormControl type="input" value={decayCap} onChange={(e) => { this.setState({ decayCap: e.target.value }) }} />
                <InputGroup.Text>
                  Rate Increase
                </InputGroup.Text>
                <FormControl type="input" value={ratehike} onChange={(e) => { this.setState({ ratehike: e.target.value }) }} />
              </InputGroup>]
          }
          {
            simulated
              ? (
                <InputGroup>
                  <InputGroup.Prepend>
                    <InputGroup.Text>Cost of Solar Improvements</InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl type="input" value={solarcost} onChange={(e) => { this.setState({ solarcost: e.target.value }) }} />
                </InputGroup>
              ) : null
          }
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>
                  Year
                </th>
                {
                  batteries ? [
                    <th>
                      Storage
                    </th>,
                    <th>
                      Battery Charge
                    </th>,
                    <th>
                      Battery Discharge
                    </th>,
                  ] : null
                }
                <th>
                  Grid Use
                </th>
                <th>
                  Bill
                </th>
                {
                  batteries || simulated
                    ? (
                      <th>
                        Savings
                      </th>
                    ) : null
                }
                <th>
                  Lifetime Net
                </th>
              </tr>
            </thead>
            <tbody>
              {
              breakdown.map((y) => (
                <tr key={y.year}>
                  <td>
                    {y.year}
                  </td>
                  {
                      batteries ? [
                        <td>
                          {y.storage.toFixed(1)}
                          {' '}
                          kWH
                        </td>,
                        <td>
                          {y.charged.toFixed(0)}
                          {' '}
                          kWH
                        </td>,
                        <td>
                          {y.discharged.toFixed(0)}
                          {' '}
                          kWH
                        </td>,
                      ] : null
                    }
                  <td>
                    {y.grid.toFixed(0)}
                    {' '}
                    kWH
                  </td>
                  <td>
                    $
                    {y.cost.toFixed(2)}
                  </td>
                  {
                      batteries || simulated
                        ? (
                          <td>
                            $
                            {y.savings.toFixed(2)}
                          </td>
                        ) : null
                    }
                  <td>
                    $
                    {y.unpaid.toFixed(2)}
                  </td>
                </tr>
              ))
            }
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    )
  }
}

RoiCard.propTypes = {
  simulated: PropTypes.bool.isRequired,
  batteries: PropTypes.string.isRequired,
  results: PropTypes.func.isRequired,
  storage: PropTypes.number.isRequired,
}
