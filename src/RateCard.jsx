import React from 'react'
import PropTypes from 'prop-types'
import {
  Card, InputGroup, FormControl, Row, Col, Button,
} from 'react-bootstrap'
import moment from 'moment'
import PowerwallCard from './PowerwallCard'
import PWCard, { ContinueButton } from './PWCard'
import { logError } from './Logging.mjs'

export default class RateCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    const { rates } = this.state
    if (!rates) {
      const cached = localStorage.getItem('rates')
      if (cached) {
        try {
          const j = JSON.parse(cached)
          this.setState({ rates: j })
        } catch (e) {
          logError('Error loading cached rates', e)
        }
      }
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
    let { rates } = this.state
    const { changed } = this.state
    if (!rates) {
      rates = {
        peakStart: 16,
        peakEnd: 21,
        peakRate: 0.56,
        offRate: 0.25,
        shoulderStart: 15,
        shoulderEnd: 24,
        shoulderRate: 0.45,
      }
    }

    const body = (
      <div>
        <Card.Text>
          The rate plan you are on with your electric company can cause your savings to vary
          quite a bit.  Pre-filled in is the 2021 EV-A plan with PG&amp;E, a net energy metering
          plan that has a good time of use distribution for powerwall savings, feel free to try
          other plan rates in here to better understand savings.  Note times are all
          in military (00 - 23), and minutes are assumed to be :00.  If your provider does not
          have a shoulder rate, put in the same times as peak.
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
              u.peakStart = parseInt(e.target.value, 10) || 0
              this.setState({
                rates: u,
                changed: true,
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
              u.peakEnd = parseInt(e.target.value, 10) || 0
              this.setState({
                rates: u,
                changed: true,
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
                changed: true,
              })
            }}
            value={rates.peakRate}
          />
        </InputGroup>
        <InputGroup>
          <InputGroup.Text>
            Shoulder
          </InputGroup.Text>
          <InputGroup.Text>
            From
          </InputGroup.Text>
          <FormControl
            as="input"
            onChange={(e) => {
              const u = { ...rates }
              u.shoulderStart = parseInt(e.target.value, 10) || 0
              this.setState({
                rates: u,
                changed: true,
              })
            }}
            value={rates.shoulderStart}
          />
          <InputGroup.Text>
            To
          </InputGroup.Text>
          <FormControl
            as="input"
            onChange={(e) => {
              const u = { ...rates }
              u.shoulderEnd = parseInt(e.target.value, 10) || 0
              this.setState({
                rates: u,
                changed: true,
              })
            }}
            value={rates.shoulderEnd}
          />
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
                changed: true,
              })
            }}
            value={rates.shoulderRate}
          />
        </InputGroup>
        <InputGroup>
          <InputGroup.Text>
            Off-Peak
          </InputGroup.Text>
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
                changed: true,
              })
            }}
            value={rates.offRate}
          />
        </InputGroup>
        <div style={{ marginTop: '1em' }} />
        <Row>
          { changed ? (
            <Col xs="auto">
              <Button
                variant="info"
                onClick={() => {
                  localStorage.setItem('rates', JSON.stringify(rates))
                  this.setState({ changed: false })
                }}
              >
                Locally save rates
              </Button>
            </Col>
          ) : null }
          <Col xs="auto">
            <ContinueButton title="Enter powerwall details" />
          </Col>
        </Row>
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
