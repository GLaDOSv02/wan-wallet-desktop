import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Radio, Checkbox, message, Spin } from 'antd';
import intl from 'react-intl-universal';

import style from '../index.less';
import { DEFAULT_GAS, TRANSTYPE } from 'utils/settings';
import { toWei, formatNumByDecimals } from 'utils/support';
import AdvancedOptionForm from 'components/AdvancedOptionForm';
import ConfirmForm from 'components/NormalTransForm/ConfirmForm';
import { checkETHAddr, getBalanceByAddr, checkAmountUnit, formatAmount, encodeTransferInput } from 'utils/helper';

const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);

@inject(stores => ({
  settings: stores.session.settings,
  tokensList: stores.tokens.tokensList,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  from: stores.sendTransParams.currentFrom,
  gasFeeArr: stores.sendTransParams.gasFeeArr,
  transParams: stores.sendTransParams.transParams,
  minGasPrice: stores.sendTransParams.minGasPrice,
  maxGasPrice: stores.sendTransParams.maxGasPrice,
  E20TokensBalance: stores.tokens.E20TokensBalance,
  averageGasPrice: stores.sendTransParams.averageGasPrice,
  updateGasLimit: gasLimit => stores.sendTransParams.updateGasLimit(gasLimit),
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
}))

@observer
class ETHNormalTransForm extends Component {
  state = {
    gasFee: 0,
    advanced: false,
    confirmVisible: false,
    disabledAmount: false,
    advancedVisible: false,
  }

  componentWillUnmount () {
    this.setState = (state, callback) => {
      return false;
    };
  }

  onAdvanced = () => {
    let { form, updateTransParams } = this.props;
    let from = form.getFieldValue('from');
    form.validateFields(['from', 'to'], err => {
      if (err) return;
      updateTransParams(from, { to: form.getFieldValue('to') });
      this.setState({
        advancedVisible: true,
      });
    });
  }

  handleAdvancedCancel = () => {
    this.setState({
      advancedVisible: false,
    });
  }

  handleConfirmCancel = () => {
    this.setState({
      confirmVisible: false,
    });
  }

  onCancel = () => {
    this.setState({
      advanced: false
    });
    this.props.onCancel();
  }

  handleSave = () => {
    let { form, addrInfo, transType } = this.props;
    let { from, fee: gasFee } = form.getFieldsValue(['from', 'fee']);

    this.setState({
      gasFee,
      advancedVisible: false,
      advanced: true,
    }, () => {
      if (!(transType === TRANSTYPE.tokenTransfer) && this.state.disabledAmount) {
        form.setFieldsValue({
          amount: getBalanceByAddr(from, addrInfo) - gasFee
        });
      }
    });
  }

  handleNext = () => {
    const { updateTransParams, addrInfo, settings } = this.props;
    let form = this.props.form;
    let from = this.props.from;
    form.validateFields(err => {
      if (err) {
        console.log('handleNext', err);
        return;
      };
      let pwd = form.getFieldValue('pwd');
      let addrAmount = getBalanceByAddr(from, addrInfo);
      let sendAmount = form.getFieldValue('amount');
      let curFee = this.state.advanced ? form.getFieldValue('fee') : form.getFieldValue('fixFee');
      if (new BigNumber(addrAmount).minus(new BigNumber(curFee)).lt(new BigNumber(sendAmount))) {
        message.warn(intl.get('NormalTransForm.overBalance'));
        return;
      }
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_reveal', { pwd: pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            updateTransParams(from, { to: form.getFieldValue('to'), amount: formatAmount(sendAmount) });
            this.setState({ advanced: false, confirmVisible: true });
          }
        })
      } else {
        updateTransParams(from, { to: form.getFieldValue('to'), amount: formatAmount(sendAmount) });
        this.setState({ advanced: false, confirmVisible: true });
      }
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
  }

  handleClick = (e, gasPrice, gasLimit, nonce, fee) => {
    let { form, addrInfo, transType } = this.props;
    let from = form.getFieldValue('from');
    this.props.updateTransParams(this.props.from, { gasLimit, gasPrice, nonce });
    this.setState({
      gasFee: fee
    })
    if (!(transType === TRANSTYPE.tokenTransfer) && this.state.disabledAmount) {
      form.setFieldsValue({
        amount: new BigNumber(getBalanceByAddr(from, addrInfo)).minus(new BigNumber(fee))
      });
    }
  }

  updateGasLimit = () => {
    let val;
    let { form, transType, tokensList, tokenAddr } = this.props;
    let from = form.getFieldValue('from');
    try {
      val = toWei((form.getFieldValue('amount') || 0).toString(10))
    } catch (err) {
      return;
    }
    if (transType === TRANSTYPE.tokenTransfer) {
      if (form.getFieldValue('to')) {
        let tokenAmount = form.getFieldValue('amount');
        let decimals = (Object.values(tokensList).find(item => item.tokenOrigAddr === tokenAddr)).decimals;
        this.props.updateTransParams(from, { data: encodeTransferInput(form.getFieldValue('to'), decimals, tokenAmount) });
      }
    }
    let tx = {
      from: from,
      to: form.getFieldValue('to'),
      value: val,
      data: this.props.transParams[from].data,
      gas: DEFAULT_GAS
    };
    let { chainType } = this.props.transParams[from];
    wand.request('transaction_estimateGas', { chainType, tx }, (err, gasLimit) => {
      if (err) {
        message.warn(intl.get('NormalTransForm.estimateGasFailed'));
      } else {
        console.log('Update gas limit:', gasLimit);
        this.props.updateTransParams(from, { gasLimit });
        this.props.updateGasLimit(gasLimit);
      }
    });
  }

  checkToWanAddr = (rule, value, callback) => {
    checkETHAddr(value).then(ret => {
      if (ret) {
        if (!this.state.advanced) {
          this.updateGasLimit();
        }
        callback();
      } else {
        callback(intl.get('NormalTransForm.invalidAddress'));
      }
    }).catch((err) => {
      callback(err);
    })
  }

  checkAmount = (rule, value, callback) => {
    if (value >= 0 && checkAmountUnit(18, value)) {
      if (!this.state.advanced) {
        this.updateGasLimit();
      }
      callback();
    } else {
      callback(intl.get('Common.invalidAmount'));
    }
  }

  sendAllAmount = e => {
    let { form, addrInfo } = this.props;
    let from = form.getFieldValue('from');
    if (e.target.checked) {
      if (this.state.advanced) {
        let fee = form.getFieldValue('fee');
        form.setFieldsValue({
          amount: new BigNumber(getBalanceByAddr(from, addrInfo)).minus(new BigNumber(fee))
        });
      } else {
        form.setFieldsValue({
          amount: new BigNumber(getBalanceByAddr(from, addrInfo)).minus(new BigNumber(this.state.gasFee)).toString(10)
        });
      }

      this.setState({
        disabledAmount: true,
      })
    } else {
      form.setFieldsValue({
        amount: 0
      });
      this.setState({
        gasFee: 0,
        disabledAmount: false,
      })
    }
  }

  sendAllE20TokenAmount = e => {
    let { form, E20TokensBalance, tokenAddr, tokensList } = this.props;
    let from = form.getFieldValue('from');

    if (e.target.checked) {
      form.setFieldsValue({
        amount: formatNumByDecimals(E20TokensBalance[tokenAddr][from], (Object.values(tokensList).find(item => item.tokenOrigAddr === tokenAddr)).decimals)
      });
      this.setState({
        disabledAmount: true,
      })
    } else {
      form.setFieldsValue({
        amount: 0
      });
      this.setState({
        disabledAmount: false,
      })
    }
  }

  render () {
    const { loading, form, from, minGasPrice, maxGasPrice, averageGasPrice, gasFeeArr, settings, balance, transType } = this.props;
    const { advancedVisible, confirmVisible, advanced, disabledAmount } = this.state;
    const { gasPrice, gasLimit, nonce } = this.props.transParams[from];
    const { minFee, averageFee, maxFee } = gasFeeArr;
    const { getFieldDecorator } = form;

    let savedFee = advanced ? new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9)) : '';

    return (
      <div>
        <Modal
          visible
          wrapClassName={style.ETHNormalTransFormModal}
          destroyOnClose={true}
          closable={false}
          title={intl.get('NormalTransForm.transaction')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleNext}>{intl.get('Common.next')}</Button>,
          ]}
        >
          <Spin spinning={this.props.spin} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} className="loadingData">
            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
              <Form.Item label={intl.get('Common.from')}>
                {getFieldDecorator('from', { initialValue: from })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('Common.balance')}>
                {getFieldDecorator('balance', { initialValue: balance })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('NormalTransForm.to')}>
                {getFieldDecorator('to', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkToWanAddr }] })
                  (<Input placeholder={intl.get('NormalTransForm.recipientAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('Common.amount')}>
                {getFieldDecorator('amount', { rules: [{ required: true, message: intl.get('NormalTransForm.amountIsIncorrect'), validator: this.checkAmount }] })
                  (<Input disabled={disabledAmount} min={0} placeholder='0' prefix={<Icon type="credit-card" className="colorInput" />} />)}
                {<Checkbox onChange={transType === TRANSTYPE.tokenTransfer ? this.sendAllE20TokenAmount : this.sendAllAmount}>{intl.get('NormalTransForm.sendAll')}</Checkbox>}
              </Form.Item>
              {
                settings.reinput_pwd &&
                <Form.Item label={intl.get('NormalTransForm.password')}>
                  {getFieldDecorator('pwd', { rules: [{ required: true, message: intl.get('NormalTransForm.pwdIsIncorrect') }] })
                  (<Input.Password placeholder={intl.get('Backup.enterPassword')} prefix={<Icon type="lock" className="colorInput" />} />)}
                </Form.Item>
              }
              {
              advanced
              ? <Form.Item label={intl.get('NormalTransForm.fee')}>
                  {getFieldDecorator('fee', { initialValue: savedFee.toString(10), rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                    <Input disabled={true} className="colorInput" />
                  )}
                </Form.Item>
              : <Form.Item label={intl.get('NormalTransForm.fee')}>
                  {getFieldDecorator('fixFee', { rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                    <Radio.Group>
                      <Radio.Button onClick={e => this.handleClick(e, minGasPrice, gasLimit, nonce, minFee)} value="minFee"><p>{intl.get('NormalTransForm.slow')}</p>{minFee} ETH</Radio.Button>
                      <Radio.Button onClick={e => this.handleClick(e, averageGasPrice, gasLimit, nonce, averageFee)} value="averageFee"><p>{intl.get('NormalTransForm.average')}</p>{averageFee} ETH</Radio.Button>
                      <Radio.Button onClick={e => this.handleClick(e, maxGasPrice, gasLimit, nonce, maxFee)} value="maxFee"><p>{intl.get('NormalTransForm.fast')}</p>{maxFee} ETH</Radio.Button>
                    </Radio.Group>
                  )}
                </Form.Item>
              }
              <p className="onAdvancedT" onClick={this.onAdvanced}>{intl.get('NormalTransForm.advancedOptions')}</p>
            </Form>
          </Spin>
        </Modal>
        <AdvancedOption visible={advancedVisible} onCancel={this.handleAdvancedCancel} onSave={this.handleSave} from={from} chain='ETH' />
        <Confirm chain='ETH' visible={confirmVisible} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading}/>
      </div>
    );
  }
}

export default ETHNormalTransForm;