import React from 'react'
import { Card } from 'react-bootstrap'

// eslint-disable-next-line react/prefer-stateless-function
export default class TotalCard extends React.Component {
  render() {
    return (
      <Card>
        <Card.Header>
          Savings
        </Card.Header>
        <Card.Body />
      </Card>
    )
  }
}
