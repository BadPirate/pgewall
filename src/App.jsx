import React from 'react'
import './App.css'
import {
  Tabs, Tab,
} from 'react-bootstrap'
import { installTrackingIfEnabled, logEvent } from './utils'
import PWCard from './PWCard'
import UsageCard from './UsageCard'

class App extends React.Component {
  componentDidMount() {
    installTrackingIfEnabled()
    logEvent('App', 'load')
  }

  render() {
    const body = (
      <Tabs defaultActiveKey="About">
        <Tab eventKey="About" title="About" key="About">
          This is a calculator for people who are PGE Customers and are
          interested in purchasing
          a powerwall and seeing if using it to power their home during &quot;Peak&quot;
          periods instead of the Grid can save them money in the long haul.
          For more details
          {' '}
          <a href="https://github.com/BadPirate/pgewall">Checkout the GitHub Repo</a>
          .
        </Tab>
        <Tab eventKey="Privacy" title="Privacy" key="Privacy">
          This site is Javascript (runs locally) so no data is sent to our servers
          or uploaded. I don&apos;t want it. But don&apos;t take my word for it,
          {' '}
          <a href="https://github.com/BadPirate/pgewall">download and checkout the code yourself</a>
          .
          {process.env.REACT_APP_GOOGLE_TRACKING_ID ? (
            <p>
              Google Tracking (page visits, and logging) has been enabled so that
              I can see a rough count of people using
              (or failing to use) the tool successfully.
            </p>
          ) : null}
        </Tab>
        {' '}
        <Tab eventKey="disclaimer" title="Disclaimer" key="disclaimer">
          Lots of things can change, and I&apos;m no expert just a hobbiest.
          Any information you get from this tool is used at your own risk.
          If you see something wrong
          {' '}
          <a href="https://github.com/BadPirate/pgewall/issues/new">file an issue</a>
        </Tab>
      </Tabs>
    )
    return <PWCard title="Welcome" body={body} next={<UsageCard key="usage" />} key="welcome" />
  }
}

export default App
