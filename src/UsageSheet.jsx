import React from 'react'
import {
  Card, Button, Alert, InputGroup,
} from 'react-bootstrap'
import ReactFileReader from 'react-file-reader'
import PropTypes from 'prop-types'
import SolarCard from './SolarCard'
import { logEvent } from './utils'
import { SimulationCard } from './SimulationCard'
import { logError } from './Logging.mjs'

export default class UsageSheet extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      progress: 'No Data Loaded',
      solar: false,
      usage: '',
      hasneg: false,
    }
  }

  componentDidMount() {
    let { usage } = this.state
    if (!usage && localStorage.getItem('usage')) {
      usage = JSON.parse(localStorage.getItem('usage'))
      const dates = new Set(usage.map((value) => value[0].substring(0, 10)))
      this.setState({
        usage: new Map(usage),
        solar: localStorage.getItem('solar') === 'true',
        hasneg: localStorage.getItem('hasneg') === 'true',
        progress: `Restored previous usage CSV. (${dates.size} days)`,
      })
    }
  }

  handleFiles(files) {
    this.setState({
      progress: 'Loading...',
    })
    const reader = new FileReader()
    reader.onload = () => {
      const usage = new Map()
      let hasneg = false
      reader.result.split('\n').forEach((line) => {
        if (line.startsWith('Electric usage')) {
          // 0             , 1        , 2   , 3   , 4  , 5 , 6
          // Electric usage,2019-06-30,19:00,19:59,0.13,kWh,
          const parts = line.split(',')
          if (parts.length !== 7) {
            logError('Invalid length - ', parts.length)
          } else {
            const start = `${parts[1]},${parts[2]}`
            const amount = parseFloat(parts[4])
            if (amount < 0) {
              hasneg = true
            }
            const unit = parts[5]
            if (unit !== 'kWh') {
              logError('Unknown unit - ', unit)
            } else if (usage.has(start)) {
              usage.set(start, usage.get(start) + amount)
            } else {
              usage.set(start, amount)
            }
          }
        }
      })
      this.setState({
        usage,
        progress: 'Loaded.',
        hasneg,
        solar: hasneg,
      })
      logEvent('UsageSheet', 'loaded-csv')
      localStorage.setItem('usage', JSON.stringify([...usage]))
      localStorage.setItem('solar', hasneg)
      localStorage.setItem('hasneg', hasneg)
    }
    reader.readAsText(files[0])
  }

  render() {
    const {
      progress, solar, hasneg, usage,
    } = this.state
    const {
      enphaseUserID,
    } = this.props

    let nextCard = null

    if (usage) {
      nextCard = solar
        ? <SolarCard usage={usage} enphaseUserID={enphaseUserID} />
        : <SimulationCard usage={usage} />
    }

    return (
      <div>
        <Card>
          <Card.Header>
            Load PGE CSV Electric Usage Data
          </Card.Header>
          { progress ? <Alert variant="info">{progress}</Alert> : null }
          <Card.Body>
            <Card.Text>
              Connect to PGE website and download a CSV of your solar output.
              Feel free to clear the headers that include account information and address,
              so that just the dates, hours, and KW used are present
              (but make sure to include the header row that labels colums).
              Last I checked you can find this by:
            </Card.Text>
            <ul>
              <li>
                Logging into
                {' '}
                <a href="https://m.pge.com/#login">PGE Website</a>
              </li>
              <li>Choosing &quot;Energy Details&quot; button</li>
              <li>Clicking the &quot;Green Button&quot; to Download my data</li>
              <li>Choosing &quot;Export Usage for a Range&quot;</li>
              <li>
                Setting range (A full year is needed for ROI prediction,
                but less will still provide data)
              </li>
              <li>Clicking Export</li>
            </ul>
            <ReactFileReader handleFiles={(f) => this.handleFiles(f)} fileTypes=".csv">
              <Button className="btn" variation="primary">Upload</Button>
            </ReactFileReader>
            <hr />
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Checkbox
                  checked={solar}
                  onChange={(e) => {
                    this.setState({ solar: e.target.checked })
                    localStorage.setItem('solar', !!e.target.checked)
                  }}
                />
              </InputGroup.Prepend>
              <InputGroup.Text>
                Net Energy Metering (Solar)
              </InputGroup.Text>
            </InputGroup>
          </Card.Body>
          {(hasneg && !solar) ? <Alert variant="danger">Warning! Negative electric usage in CSV, you should check Solar box below or results will be wrong</Alert> : null }
        </Card>
        { nextCard }
      </div>
    )
  }
}

UsageSheet.propTypes = {
  enphaseUserID: PropTypes.string.isRequired,
}
