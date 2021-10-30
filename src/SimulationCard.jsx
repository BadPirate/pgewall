import React from 'react'
import PropTypes from 'prop-types'
import {
  Card, InputGroup, FormControl, Dropdown, DropdownButton, Button, Alert,
} from 'react-bootstrap'
import { logInfo } from './Logging.mjs'
import PVWattsAPI from './PVWattsAPI'
import RateCard from './RateCard'

export default class SimulationCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      capacity: '',
      type: 'Standard',
      losses: 25,
      tilt: 14,
      address: '',
      status: '',
      simulated: null,
      disabled: false,
    }
  }

  componentDidMount() {
    const stored = localStorage.getItem('simulatedProduction')
    const { simulated, disabled } = this.state
    if (!simulated && stored) {
      this.setState({
        simulated: new Map(JSON.parse(stored)),
        status: 'Retrieved previous simulation values',
      })
    }
    if (!disabled && localStorage.getItem('simulationDisabled')) {
      this.setState({
        disabled: true,
      })
    }
  }

  render() {
    const {
      status, disabled, type, capacity, losses, tilt, address, simulated,
    } = this.state
    const { usage, production } = this.props
    return (
      <div>
        <Card>
          <Card.Header>
            Solar Simulator
          </Card.Header>
          { status ? <Alert variant="info">{status}</Alert> : null }
          <Card.Body>
            Because purchasing a Solar System is likely to be a better ROI than Powerwall
            (I mean, harvesting energy from the sun seems like a pretty good way to make free money)
            I&apos;ve added a Solar System Simulator.  It can work on top of an existing
            solar system (as long as you have data for the actual production),
            or for no system at all.
            {
              disabled
                ? (
                  <Button onClick={() => {
                    localStorage.removeItem('simulationDisabled')
                    this.setState({
                      disabled: false,
                    })
                  }}
                  >
                    Enable Simulation
                  </Button>
                )
                : (
                  <div>
                    <InputGroup>
                      <FormControl placeholder="Capacity" onChange={(e) => { this.setState({ capacity: e.target.value }) }} value={capacity} />
                      <InputGroup.Text>kW</InputGroup.Text>
                      <DropdownButton title={type} variant="outline-secondary">
                        <Dropdown.Item onClick={() => { this.setState({ type: 'Standard' }) }}>Standard</Dropdown.Item>
                        <Dropdown.Item onClick={() => { this.setState({ type: 'Premium' }) }}>Premium</Dropdown.Item>
                        <Dropdown.Item onClick={() => { this.setState({ type: 'Thin Film' }) }}>Thin Film</Dropdown.Item>
                      </DropdownButton>
                      <FormControl placeholder="losses" onChange={(e) => { this.setState({ losses: e.target.value }) }} value={losses} />
                      <InputGroup.Text>%</InputGroup.Text>
                      <FormControl placeholder="tilt" onChange={(e) => { this.setState({ tilt: e.target.value }) }} value={tilt} />
                      <InputGroup.Text>degs</InputGroup.Text>
                      <FormControl placeholder="address" onChange={(e) => { this.setState({ address: e.target.value }) }} value={address} />
                      <InputGroup.Append>
                        <Button
                          variation="primary"
                          onClick={() => {
                            const api = new PVWattsAPI()
                            let t = 0
                            switch (t) {
                              case 'Premium': t = 1; break
                              case 'Thin Film': t = 2; break
                              default: break
                            }
                            api.hourlySimulation(parseFloat(capacity), t,
                              parseFloat(losses), parseFloat(tilt), address)
                              .then((result) => {
                                logInfo(result)
                                let day = 0
                                let hour = 0
                                const s = new Map(result.map((ac) => {
                                  const spread = [`${day}-${hour}`, ac]
                                  if (hour === 23) {
                                    day += 1
                                    hour = 0
                                  } else {
                                    hour += 1
                                  }
                                  return spread
                                }))
                                logInfo(s)
                                this.setState({
                                  simulated,
                                  status: `Loaded ${day} days of simulated production`,
                                })
                                localStorage.setItem('simulatedProduction', JSON.stringify([...simulated]))
                              }, (error) => {
                                this.setState({
                                  status: `Error - ${error.toString()}`,
                                })
                              })
                            this.setState({
                              status: 'Retrieving Simulated Production',
                            })
                          }}
                        >
                          Calculate
                        </Button>
                      </InputGroup.Append>
                    </InputGroup>
                    <hr />
                    {
                    simulated
                      ? (
                        <Button onClick={() => {
                          localStorage.removeItem('simulatedProduction')
                          this.setState({
                            simulated: null,
                            status: 'Cleared simulation',
                          })
                        }}
                        >
                          Clear Simulated Values
                        </Button>
                      )
                      : (
                        <Button onClick={() => {
                          localStorage.setItem('simulationDisabled', 'true')
                          this.setState({
                            disabled: true,
                            status: 'Disabled.',
                            simulated: null,
                          })
                        }}
                        >
                          Don&apos;t use simulated values
                        </Button>
                      )
                  }
                  </div>
                )
            }

          </Card.Body>
        </Card>
        { simulated || disabled
          ? (
            <RateCard
              usage={usage}
              production={production}
              simulated={simulated}
            />
          ) : null }
      </div>
    )
  }
}

SimulationCard.propTypes = {
  usage: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  production: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
}
