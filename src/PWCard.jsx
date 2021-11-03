import PropTypes from 'prop-types'
import React from 'react'
import {
  Card, Accordion, useAccordionButton, Alert, Button,
} from 'react-bootstrap'
import { logInfo } from './Logging.mjs'

export function ContinueButton({ variant, title }) {
  const toggle = useAccordionButton('0')
  return (
    <Button
      variant={variant}
      onClick={toggle}
    >
      {title}
    </Button>
  )
}

ContinueButton.propTypes = {
  title: PropTypes.string,
  variant: PropTypes.string,
}

ContinueButton.defaultProps = {
  title: 'Continue',
  variant: 'success',
}

function ToggleHeader(props) {
  const { title, progress } = props
  const toggle = useAccordionButton('0', () => {
    logInfo(`Toggled ${title}`)
  })
  return (
    <Card.Header onClick={toggle}>
      {`${title}${progress ? `: ${progress}` : ''}`}
    </Card.Header>
  )
}
ToggleHeader.propTypes = {
  progress: PropTypes.string,
  title: PropTypes.string.isRequired,
}
ToggleHeader.defaultProps = {
  progress: null,
}

export default function PWCard(props) {
  const {
    progress, title, body, next, error,
  } = props
  return [(
    <Accordion defaultActiveKey="0" key={title}>
      <Card>
        <ToggleHeader progress={progress} title={title} />
        <Accordion.Collapse
          eventKey="0"
          style={{
            marginTop: '1em',
          }}
        >
          <div>
            {body}
            { error ? (
              <Alert
                variant="danger"
                style={{
                  marginTop: '1em',
                }}
              >
                {error.message}
              </Alert>
            ) : null }
          </div>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  ), next]
}

PWCard.propTypes = {
  next: PropTypes.element,
  body: PropTypes.element.isRequired,
  progress: PropTypes.string,
  error: PropTypes.objectOf(Error),
  title: PropTypes.string.isRequired,
}

PWCard.defaultProps = {
  progress: null,
  next: null,
  error: null,
}
