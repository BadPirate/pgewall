import React from 'react'
import PropTypes from 'prop-types'
import {
  Dropdown, DropdownButton, FormControl, InputGroup, Button, Alert, Row, Col, Card,
} from 'react-bootstrap'
import moment from 'moment'
import PWCard, { ContinueButton } from './PWCard'
import PVWattsAPI from './PVWattsAPI'
import prodCalculation from './prodCalculation'
import { logInfo, logError } from './Logging.mjs'
import { pad } from './utils'
import RateCard from './RateCard'

function dayTotal(v) {
  let total = 0
  v.forEach((kw) => { total += kw })
  return total
}

export default class SimulationCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      capacity: '',
      type: 'Standard',
      losses: 25,
      tilt: 14,
      address: '',
      estimatedProduction: null,
      simulated: null,
      currentSize: 0,
      newSize: 0,
    }
  }

  componentDidMount() {
    let stored = localStorage.getItem('estimatedProduction')
    const { estimatedProduction } = this.state
    if (!estimatedProduction && stored) {
      this.setState({
        estimatedProduction: new Map(JSON.parse(stored)),
      })
    }
    stored = localStorage.getItem('simulated')
    const { simulated } = this.state
    try {
      if (!simulated && stored) {
        const o = JSON.parse(stored)
        this.setState({
          simulated: new Map(o),
        })
      }
    } catch (e) {
      this.setState({
        error: Error('Error parsing stored simulation data, cleared'),
      })
      localStorage.removeItem('simulated')
    }
  }

  simulate(startingMoment) {
    this.setState({
      error: null,
    })
    const {
      type, capacity, losses, tilt, address,
    } = this.state
    let t = 0
    switch (type) {
      case 'Premium': t = 1; break
      case 'Thin Film': t = 2; break
      default: break
    }
    return PVWattsAPI.hourlySimulation(parseFloat(capacity), t,
      parseFloat(losses), parseFloat(tilt), address)
      .then((r) => {
        if (r.length !== 8760) {
          logError('Unexpected response to PVWatts', r)
          throw Error(`Unexpected response length ${r.length}`)
        }
        const onMoment = moment(startingMoment)
        onMoment.hours(0)
        const initialRecord = (onMoment.dayOfYear() * 24) - 24
        let onRecord = initialRecord
        const simMap = new Map()
        while (simMap.size < 365) {
          const dayMap = new Map()
          simMap.set(onMoment.format('YYYY-MM-DD'), dayMap)
          for (let h = 0; h < 24; h += 1) {
            dayMap.set(`${onMoment.format('YYYY-MM-DD')} ${pad(h)}:00`, r[onRecord])
            onRecord += 1
          }
          if (onRecord >= r.length) {
            onRecord = 0 // Back to the front, Jan 1
          }
          onMoment.day(onMoment.day() + 1)
        }
        return simMap
      })
      .catch((e) => {
        this.setState({
          error: e,
        })
      })
  }

  render() {
    const {
      capacity, losses, tilt, address, type, error, estimatedProduction, simulated,
      currentSize, newSize,
    } = this.state
    const { usage, production } = this.props
    const {
      complete, partial, earliest, average,
    } = prodCalculation(usage, production)

    let progress = null
    let next = null
    let body = null

    const completeCount = complete ? complete.size : 0
    const partialCount = partial ? partial.size : 0
    const missingDays = Math.max(365 - completeCount - partialCount, 0)
    if (simulated) {
      const { average: simAverage } = prodCalculation(usage, simulated)
      if (production) {
        progress = `Simulating solar upgrade ${Math.round(average)} kW / day -> ${Math.round(average + simAverage)} kW / day`
      } else {
        progress = `Simulating solar ${Math.round(simAverage)} kW / day}`
      }
      body = (
        <div>
          <Alert variant="info">
            {progress}
          </Alert>
          <Button
            variant="danger"
            onClick={() => {
              this.setState({
                simulated: null,
              })
              localStorage.removeItem('simulated')
            }}
          >
            Clear simulated data
          </Button>
        </div>
      )
      next = (
        <RateCard
          production={estimatedProduction || production}
          usage={usage}
          simulated={simulated}
          key="rate"
          start={earliest}
        />
      )
    } else if (estimatedProduction) {
      const {
        average: estimatedAverage,
        earliest: estimatedEarliest, latest: estimatedLatest,
      } = prodCalculation(usage, production)
      progress = `Estimated production, ${Math.round(estimatedAverage)} kw / day, ${estimatedEarliest.format('YYYY-MM-DD')} - ${estimatedLatest.format('YYYY-MM-DD')}`
      body = (
        <div>
          <div>
            <Card.Text>
              Existing solar production has been calculated, you can either use this,
              or simulate adding more capacity to existing system.
            </Card.Text>
            <InputGroup>
              <InputGroup.Text>Current System Size</InputGroup.Text>
              <FormControl
                placeholder="Current System Size"
                onChange={(e) => {
                  this.setState({
                    currentSize: parseFloat(e.target.value) || 0,
                  })
                }}
                value={currentSize}
                required
              />
            </InputGroup>
            <InputGroup>
              <InputGroup.Text>New System Size</InputGroup.Text>
              <FormControl
                placeholder="New System Size"
                onChange={(e) => {
                  this.setState({
                    newSize: parseFloat(e.target.value) || 0,
                  })
                }}
                value={newSize}
                required
              />
            </InputGroup>
          </div>
          <div style={{ marginTop: '1em' }} />
          <Row>
            <Col xs="auto">
              <Button
                variant="info"
                onClick={() => {
                  if (error) {
                    this.setState({
                      error: null,
                    })
                  }
                  if (newSize <= currentSize) {
                    logError(`${newSize} <= ${currentSize}`)
                    this.setState({
                      error: Error('New system must be larger than existing'),
                    })
                    return
                  }
                  const ratio = newSize / currentSize
                  const sp = new Map()
                  estimatedProduction.forEach((v, k) => {
                    sp.set(k, v * ratio)
                  })
                  this.setState({
                    simulated: sp,
                  })
                  localStorage.setItem('simulated', JSON.stringify([...sp]))
                }}
              >
                Simulate adding solar
              </Button>
            </Col>
            <Col xs="auto">
              <ContinueButton title="Use existing solar" />
            </Col>
            <Col fluid={1} />
            <Col xs="auto">
              <Button
                variant="danger"
                onClick={() => {
                  this.setState({
                    estimatedProduction: null,
                  })
                  localStorage.removeItem('estimatedStorage')
                }}
              >
                Clear Estimate
              </Button>
            </Col>
          </Row>
        </div>
      )

      next = <RateCard production={estimatedProduction} usage={usage} key="rate" start={earliest} />
    } else if (completeCount < 365) {
      progress = 'Estimate incomplete solar production'
      body = (
        <div>
          <SimulatorComponent
            capacity={capacity}
            losses={losses}
            tilt={tilt}
            address={address}
            type={type}
          />
          <Alert variant="warning" style={{ marginTop: '1em' }}>
            {missingDays > 0 ? `You have are missing solar data for ${365 - completeCount - partialCount} days.  ` : null}
            {partialCount > 0 ? `You are missing hourly information for ${partialCount} days.  ` : null}
            Simulator can be used to estimate this information.
            Output will be scaled based on the average known
            / daily output of your current system, to create a ratio based result.
          </Alert>
          <Button
            variant="info"
            onClick={() => {
              this.simulate(earliest).then((s) => {
                partial.forEach((v, k) => {
                  if (!s.has(k)) {
                    logError(`Unable to find simulated values for ${k}`)
                    return
                  }
                  const actualTotal = dayTotal(v)
                  if (actualTotal === 0) {
                    logInfo(`Skipping partial ${k} as no reported data`)
                    return
                  }
                  const sim = s.get(k)
                  const simTotal = dayTotal(sim)
                  const estimatedDay = new Map()
                  const ratio = actualTotal / simTotal
                  sim.forEach((sv, sk) => {
                    estimatedDay.set(sk, sv * (ratio))
                  })
                  complete.set(k, estimatedDay)
                })
                if (complete.size < 365) {
                  let totalActual = 0
                  let totalSim = 0
                  complete.forEach((v, k) => {
                    if (!s.has(k)) {
                      logError(`Unable to find simulated values for ${k}`)
                      return
                    }
                    totalSim += dayTotal(s.get(k))
                    totalActual += dayTotal(v)
                  })
                  const ratio = totalActual / totalSim
                  logInfo('Simulation Ratio', ratio)
                  s.forEach((sv, sk) => {
                    if (complete.has(sk)) return
                    const estimatedDay = new Map()
                    sv.forEach((dv, dk) => {
                      estimatedDay.set(dk, dv * ratio)
                    })
                    complete.set(sk, estimatedDay)
                  })
                }
                const ep = new Map()
                complete.forEach((v) => {
                  v.forEach((dv, dk) => {
                    ep.set(dk, dv)
                  })
                })
                this.setState({
                  estimatedProduction: ep,
                })
                localStorage.setItem('estimatedProduction', JSON.stringify([...ep]))
              })
            }}
          >
            Estimate production using simulated production and known production values
          </Button>
        </div>
      )
    }

    function SimulatorComponent() {
      return (
        <div>
          <InputGroup>
            <FormControl
              placeholder="Capacity"
              onChange={(e) => {
                this.setState({
                  capacity: e.target.value,
                })
              }}
              value={capacity}
              required
            />
            <InputGroup.Text>kW</InputGroup.Text>
            <DropdownButton title={type || 'Panel Type'} variant="outline-secondary">
              <Dropdown.Item onClick={() => {
                this.setState({
                  type: 'Standard',
                })
              }}
              >
                Standard
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                this.setState({
                  type: 'Premium',
                })
              }}
              >
                Premium
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                this.setState({
                  type: 'Thin Film',
                })
              }}
              >
                Thin Film
              </Dropdown.Item>
            </DropdownButton>
          </InputGroup>
          <InputGroup>
            <InputGroup.Text>Losses</InputGroup.Text>
            <FormControl
              placeholder="losses"
              onChange={(e) => {
                this.setState({
                  losses: e.target.value,
                })
              }}
              value={losses}
            />
            <InputGroup.Text>%</InputGroup.Text>
          </InputGroup>
          <InputGroup>
            <InputGroup.Text>Tilt</InputGroup.Text>
            <FormControl
              placeholder="tilt"
              onChange={(e) => {
                this.setState({
                  tilt: e.target.value,
                })
              }}
              value={tilt}
            />
            <InputGroup.Text>degs</InputGroup.Text>
          </InputGroup>
          <InputGroup>
            <FormControl
              placeholder="address"
              onChange={(e) => {
                this.setState({
                  address: e.target.value,
                })
              }}
              value={address}
            />
          </InputGroup>
        </div>
      )
    }

    return (
      <PWCard
        title="Solar Simulation"
        key="solar"
        body={body}
        error={error}
        progress={progress}
        next={next}
        simulated={simulated}
      />
    )
  }
}

SimulationCard.propTypes = {
  usage: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  production: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
}

SimulationCard.defaultProps = {
  production: null,
}
