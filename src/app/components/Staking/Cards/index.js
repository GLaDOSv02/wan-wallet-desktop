import React, { Component } from 'react';
import { Row, Col } from 'antd';
import Card from './Card'
import './index.less';

class Cards extends Component {
  render() {
    return (
      <div className="cards">
        <Row gutter={16}>
          <Col span={6}>
            <Card
              title="My Stake"
              value="150,000"
              tail="WAN"
              bottom="In 4 validators"
            />
          </Col>
          <Col span={6}>
            <Card
              title="Pending Withdrawal"
              value="2,000"
              tail="WAN"
              bottom="Epoch 1000"
            />
          </Col>
          <Col span={6}>
            <Card
              title="Current Return Rate"
              value="15% ↑"
              tail="WAN"
              bottom="Epoch 1000"
            />
          </Col>
          <Col span={6}>
            <Card
              title="Total distributed rewards"
              value="15,000"
              tail="WAN"
              bottom="From 1th Jan"
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default Cards