import React from 'react'
import PropTypes from 'prop-types'
import {
  Card, InputGroup, FormControl,
} from 'react-bootstrap'
import moment from 'moment'
import PowerwallCard from './PowerwallCard'
import PWCard, { ContinueButton } from './PWCard'

export default class RateCard extends React.Component {
  constructor(props) {
    super(props)
    const rates = {
      peakStart: 16,
      peakEnd: 21,
      peakRate: 0.5,
      offStart: 0,
      offEnd: 12,
      offRate: 0.19,
      shoulderRate: 0.39,
    }
    this.state = {
      rates,
    }
  }

  update(name, value) {
    const map = new Map([[name, value]])
    this.setState(map)
  }

  render() {
    const {
      production, usage, simulated, start,
    } = this.props
    const { rates } = this.state

    const body = (
      <div>
        <Card.Text>
          The rate plan you are on with your electric company can cause your savings to vary
          quite a bit.  Pre-filled in is the 2021 EV-A plan with PG&amp;E, a net energy metering
          plan that has a good time of use distribution for powerwall savings, feel free to try
          other plan rates in here to better understand savings.  Note times are all
          in military (00 - 23), and minutes are assumed to be :00.
        </Card.Text>
        <InputGroup>
          <InputGroup.Text>
            Peak
          </InputGroup.Text>
          <InputGroup.Text>
            From
          </InputGroup.Text>
          <FormControl
            as="input"
            onChange={(e) => {
              const u = { ...rates }
              u.peakStart = parseInt(e.target.value, 10)
              this.setState({
                rates: u,
              })
            }}
            value={rates.peakStart}
          />
          <InputGroup.Text>
            To
          </InputGroup.Text>
          <FormControl
            as="input"
            onChange={(e) => {
              const u = { ...rates }
              u.peakEnd = e.target.value.parseInt()
              this.setState({
                rates: u,
              })
            }}
            value={rates.peakEnd}
          />
          <InputGroup.Text>
            Rate
          </InputGroup.Text>
          <FormControl
            as="input"
            onChange={(e) => {
              const u = { ...rates }
              u.peakRate = parseFloat(e.target.value) || 0
              this.setState({
                rates: u,
              })
            }}
            value={rates.peakRate}
          />
        </InputGroup>
        <InputGroup>
          <InputGroup.Text>
            Off-Peak
          </InputGroup.Text>
          <InputGroup.Text>
            From
          </InputGroup.Text>
          <FormControl
            as="input"
            onChange={(e) => {
              const u = { ...rates }
              u.offStart = e.target.value.parseInt()
              this.setState({
                rates: u,
              })
            }}
            value={rates.offStart}
          />
          <InputGroup.Text>
            To
          </InputGroup.Text>
          <FormControl
            as="input"
            onChange={(e) => {
              const u = { ...rates }
              u.offEnd = e.target.value.parseInt()
              this.setState({
                rates: u,
              })
            }}
            value={rates.offEnd}
          />
          <InputGroup.Text>
            Rate
          </InputGroup.Text>
          <FormControl
            as="input"
            onChange={(e) => {
              const u = { ...rates }
              u.offRate = parseFloat(e.target.value) || 0
              this.setState({
                rates: u,
              })
            }}
            value={rates.offRate}
          />
        </InputGroup>
        <InputGroup>
          <InputGroup.Text>
            Shoulder
          </InputGroup.Text>
          <InputGroup.Text>
            Rate
          </InputGroup.Text>
          <FormControl
            as="input"
            onChange={(e) => {
              const u = { ...rates }
              u.shoulderRate = parseFloat(e.target.value) || 0
              this.setState({
                rates: u,
              })
            }}
            value={rates.shoulderRate}
          />
        </InputGroup>
        <div style={{ marginTop: '1em' }} />
        <ContinueButton title="Enter powerwall details" />
      </div>
    )

    const next = (
      <PowerwallCard
        usage={usage}
        production={production}
        simulated={simulated}
        rates={rates}
        key="powerwall"
        start={start}
      />
    )
    const { offRate, shoulderRate, peakRate } = rates
    return (
      <PWCard
        title="Electric Rate"
        body={body}
        key="rate"
        next={next}
        simulated={simulated}
        progress={`${offRate} / ${shoulderRate} / ${peakRate}`}
      />
    )
  }
}

RateCard.propTypes = {
  simulated: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  production: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  usage: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  start: PropTypes.instanceOf(moment).isRequired,
}

RateCard.defaultProps = {
  simulated: null,
  production: null,
}
