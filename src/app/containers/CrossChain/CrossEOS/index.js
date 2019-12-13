import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col, message } from 'antd';

import totalImg from 'static/image/eos.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND } from 'utils/settings';
import EOSTrans from 'components/CrossChain/SendCrossChainTrans/EOSTrans';
import CrossBTCHistory from 'components/CrossChain/CrossChainTransHistory/CrossBTCHistory';

const CHAINTYPE = 'EOS';

@inject(stores => ({
  tokensList: stores.tokens.tokensList,
  language: stores.languageIntl.language,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  transParams: stores.sendCrossChainParams.transParams,
  getAccountListWithBalance: stores.eosAddress.getAccountListWithBalance,
  updateTransHistory: () => stores.eosAddress.updateTransHistory(),
  setCurrSymbol: symbol => stores.crossChain.setCurrSymbol(symbol),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  updateTokensBalance: tokenScAddr => stores.tokens.updateTokensBalance(tokenScAddr)
}))

@observer
class CrossEOS extends Component {
  constructor (props) {
    super(props);
    this.props.setCurrSymbol(CHAINTYPE);
    this.props.setCurrToken(null, CHAINTYPE);
    this.props.changeTitle('Common.crossChain');
  }

  componentDidMount() {
    let tokenAddr = Object.keys(this.props.tokensList).find(item => this.props.tokensList[item].symbol === CHAINTYPE);
    this.timer = setInterval(() => {
      this.props.updateTransHistory();
      this.props.updateTokensBalance(tokenAddr);
    }, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  inboundHandleSend = () => {
    let { transParams: { from, to, amount, storeman, txFeeRatio } } = this.props;
    let input = { from, to, amount, storeman, txFeeRatio };
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossEOS', { input, source: 'EOS', destination: 'WAN', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('crossChain_lockEOS:', err);
          message.warn(intl.get('common.sendFailed'));
          return reject(err);
        } else {
          console.log(JSON.stringify(ret, null, 4));
          return resolve(ret)
        }
      })
    })
  }

  outboundHandleSend = () => {
    let transParams = this.props.BTCCrossTransParams;
    let input = {
      from: transParams.from,
      amount: transParams.amount,
      crossAddr: transParams.crossAddr,
      gasPrice: transParams.gasPrice,
      gas: transParams.gas,
      txFeeRatio: transParams.txFeeRatio,
      storeman: transParams.storeman
    };
    return new Promise((resolve, reject) => {
      wand.request('crossChain_crossBTC', { input, source: 'WAN', destination: 'BTC', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('crossChain_lockWBTC:', err);
          message.warn(intl.get('common.sendFailed'));
          return reject(err);
        } else {
          console.log(JSON.stringify(ret, null, 4));
          return resolve(ret)
        }
      })
    })
  }

  inboundColumns = [
    {
      dataIndex: 'address',
      width: '70%'
    },
    {
      dataIndex: 'balance',
      width: '20%',
      ellipsis: true,
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      dataIndex: 'action',
      width: '10%',
      render: (text, record) => <div><EOSTrans record={record} from={record.address} decimals={4} handleSend={this.outboundHandleSend} direction={INBOUND}/></div>
    }
  ];

  outboundColumns = [
    {
      dataIndex: 'name',
      width: '20%',
      ellipsis: true
    },
    {
      dataIndex: 'address',
      width: '50%',
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    {
      dataIndex: 'balance',
      width: '20%',
      ellipsis: true,
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      dataIndex: 'action',
      width: '10%',
      render: (text, record) => <div><EOSTrans from={record.address} path={record.path} handleSend={this.outboundHandleSend} direction={OUTBOUND}/></div>
    }
  ];

  render () {
    const { getAccountListWithBalance, getTokensListInfo } = this.props;

    this.props.language && this.inboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    this.props.language && this.outboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">EOS </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} rowKey="account" columns={this.inboundColumns} dataSource={getAccountListWithBalance} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">WEOS </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.outboundColumns} dataSource={getTokensListInfo} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>

          </Col>
        </Row>
      </div>
    );
  }
}

export default CrossEOS;