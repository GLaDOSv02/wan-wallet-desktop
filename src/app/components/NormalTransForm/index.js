import React, { Component } from 'react';
import { Button, Modal, Form, Input, Icon, Radio, InputNumber } from 'antd';
import AdvancedOptionForm from 'components/AdvancedOptionForm';
import { BigNumber } from 'bignumber.js';

import './index.less';

class NormalTransForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: this.props.visible,
      advancedVisible: false,
      gasPrice: 200,
      gasLimit: 21000,
      advanced: false
    };
    this.advancedOptionForm = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);
  }

  onAdvanced = () => {
    this.setState({
      advancedVisible: true,
    });
  }

  handleCancel = () => {
    this.setState({
      advancedVisible: false,
    });
  }

  handleSave = (gasPrice, gasLimit) => {
    console.log(gasLimit, gasPrice);
    this.setState({
      advancedVisible: false,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      advanced: true
    });
  }

  render() {
    const { loading, onCancel, onSend, form, visible, gasPrice, gasLimit, minGasPrice, from } = this.props;
    const { getFieldDecorator } = form;
    const AdvancedOptionForm = this.advancedOptionForm;
    let averageFee = new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9));
    let minFee = new BigNumber(minGasPrice).times(gasLimit).div(BigNumber(10).pow(9));
    let maxFee = averageFee.times(2);
    let savedFee;

    if (this.state.advanced) {
      savedFee = new BigNumber(Math.max(minGasPrice, this.state.gasPrice)).times(this.state.gasLimit).div(BigNumber(10).pow(9));
    }

    return (
      <div>
        <Modal
          destroyOnClose={true}
          closable={false}
          visible={visible}
          title="Transaction"
          onCancel={onCancel}
          onOk={onSend}
          footer={[
            <Button key="submit" type="primary" loading={loading} onClick={onSend}>Send</Button>,
            <Button key="back" className="cancel" onClick={onCancel}>Cancel</Button>,
          ]}
        >
          <Form labelCol={{ span: 5 }} wrapperCol={{ span: 12 }} className="transForm">
            <Form.Item label="From">
              {getFieldDecorator('from', { initialValue: from }, { rules: [{ required: true, message: 'Address is incorrect' }] })
                (<Input disabled={true} placeholder="Recipient Address" prefix={<Icon type="wallet" style={{ color: 'rgba(0,0,0,.25)' }} />} />)}
            </Form.Item>
            <Form.Item label="To">
              {getFieldDecorator('to', { rules: [{ required: true, message: 'Address is incorrect' }] })(<Input placeholder="Recipient Address" prefix={<Icon type="wallet" style={{ color: 'rgba(0,0,0,.25)' }} />} />)}
            </Form.Item>
            <Form.Item label="Amount">
              {getFieldDecorator('amount', { rules: [{ required: true, message: 'Amount is incorrect' }] })(<InputNumber placeholder="0" prefix={<Icon type="money-collect" style={{ color: 'rgba(0,0,0,.25)' }} />} />)}
            </Form.Item>
            <Form.Item label="Fee">
              {getFieldDecorator('fee', { initialValue: this.state.advanced ? savedFee.toString(10) : '', rules: [{ required: true, message: "Please select transaction fee" }] })(
                this.state.advanced ?
                  <Input disabled={true} style={{ color: 'rgba(0,0,0,.25)' }} /> :
                  <Radio.Group>
                    <Radio.Button value="slow">Slow <br /> {minFee.toString(10)} WAN</Radio.Button>
                    <Radio.Button value="average">Average <br /> {averageFee.toString(10)} WAN</Radio.Button>
                    <Radio.Button value="fast">Fast <br /> {maxFee.toString(10)} WAN</Radio.Button>
                  </Radio.Group>
              )}
            </Form.Item>
            <p onClick={this.onAdvanced}>Advanced Options</p>
          </Form>
        </Modal>
        <AdvancedOptionForm
          visible={this.state.advancedVisible}
          minGasPrice={minGasPrice}
          gasPrice={gasPrice}
          gasLimit={gasLimit}
          onCancel={this.handleCancel}
          onSave={this.handleSave}
        />
      </div>
    );
  }
}

export default NormalTransForm;



