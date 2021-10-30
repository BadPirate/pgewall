import React from 'react'
import PropTypes from 'prop-types'
import {
  Button, DropdownButton, Dropdown, InputGroup,
} from 'react-bootstrap'
import { EnphaseAPI } from './Api'
import { logError, logInfo } from './Logging.mjs'

export default class EnphaseComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      retrieving: false,
    }
  }

  render() {
    const enphaseAppID = process.env.REACT_APP_ENPHASE_APP_ID
    const {
      enphaseSystems: systems, selected, usage,
      production, enphaseUserID, setProduction, logout, select,
    } = this.props
    const { retrieving } = this.state

    const system = systems ? systems[selected] : ''
    let sysCount = 0
    if (retrieving) {
      // Retrieve a package
      let missing = false
      usage.forEach((value, key) => {
        if (missing) { return }
        if (!production || !production.has(key)) {
          missing = true
          let parts = key.split(',')
          const date = parts[0]
          const time = parts[1]
          parts = date.split('-')
          const y = parts[0]
          const m = parts[1]
          const d = parts[2]
          parts = time.split(':')
          const h = parts[0]
          const start = (new Date(y, m, d, h).getTime()) / 1000
          const end = start + 3600
          const api = new EnphaseAPI(enphaseUserID)
          api.getProduction(system.system_id, start, end)
            .then((power) => {
              logInfo('Power result', key, '=', power)
              setProduction(key, parseInt(power, 10) / 1000)
            }, (error) => {
              logError('Power Error', key, error)
              setProduction(key, 0)
            })
          logInfo(y, m, d, h, start)
        }
      })
    }
    return (
      <div>
        {enphaseUserID
          ? (
            <div>
              <Button onClick={() => { this.setState({ retrieving: false }); logout() }}>
                Logout Enphase Enlighten
              </Button>
            </div>
          )
          : <Button href={`https://enlighten.enphaseenergy.com/app_user_auth/new?app_id=${enphaseAppID}&redirect=${window.location.href}`}>Retrieve using Enphase Enlighten</Button>}
        {system
          ? (
            <div>
              <hr />
              <InputGroup>
                <InputGroup.Prepend>
                  <DropdownButton variant="secondary" title={system.system_name}>
                    {systems.map((s) => {
                      const sys = sysCount
                      sysCount += 1
                      return (
                        <Dropdown.Item
                          key={sys}
                          onClick={() => {
                            select(sys)
                          }}
                        >
                          {s.system_name}
                        </Dropdown.Item>
                      )
                    })}
                  </DropdownButton>
                </InputGroup.Prepend>
                <InputGroup.Text>
                  Select System
                </InputGroup.Text>
                <InputGroup.Append>
                  {retrieving
                    ? <Button variant="warning" onClick={() => { this.setState({ retrieving: false }) }}>Stop Retrieving</Button>
                    : (
                      <Button variant="primary" onClick={() => { this.setState({ retrieving: true }) }}>
                        Retrieve Solar Production
                      </Button>
                    )}
                </InputGroup.Append>
              </InputGroup>
            </div>
          )
          : null}
      </div>
    )
  }
}

EnphaseComponent.propTypes = {
  enphaseSystems: PropTypes.arrayOf(PropTypes.string),
  selected: PropTypes.number,
  usage: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  production: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  enphaseUserID: PropTypes.string.isRequired,
  setProduction: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  select: PropTypes.func.isRequired,
}

EnphaseComponent.defaultProps = {
  usage: null,
  production: null,
  enphaseSystems: null,
  selected: 0,
}
