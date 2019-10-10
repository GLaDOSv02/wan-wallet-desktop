import { observable, action, computed, toJS } from 'mobx';
import BigNumber from 'bignumber.js';
import { roundFun } from 'utils/support'

const GASLIMIT = 21000;

class SendCrossChainParams {
    @observable currentFrom = '';

    @observable transParams = {};

    @observable gasLimit = GASLIMIT;

    @observable defaultGasPrice = 200;

    @observable minGasPrice = 180;

    @observable currentGasPrice = 200;

    @observable lockAccounts = '';

    @action updateLockAccounts (data) {
      self.lockAccounts = data;
    }

    @action addCrossTransTemplate (addr, params = {}) {
      let gasPrice = params.chainType === 'ETH' ? 1 : self.minGasPrice;
      self.currentFrom = addr;
      self.transParams[addr] = {
        gasPrice,
        from: {
          walletID: 1,
          path: params.path
        },
        to: {
          walletID: 1,
          path: params.path
        },
        amount: 0,
        smgList: [],
        storeman: '',
        txFeeRatio: '',
        gasLimit: GASLIMIT,
      };
    }

    @action updateGasPrice (gasPrice, chainType = 'ETH') {
        self.currentGasPrice = gasPrice;
        self.minGasPrice = chainType === 'ETH' ? 1 : 180;
    }

    @action updateGasLimit (gasLimit) {
      self.gasLimit = gasLimit;
    }

    @action updateTransParams (addr, paramsObj) {
      Object.keys(paramsObj).forEach(item => {
        self.transParams[addr][item] = paramsObj[item];
      });
    }

    @computed get maxGasPrice () {
      return self.currentGasPrice * 2;
    }

    @computed get averageGasPrice () {
      return Math.max(self.minGasPrice, self.currentGasPrice);
    }

    @computed get gasFeeArr () {
      let minFee = new BigNumber(self.minGasPrice).times(self.gasLimit).div(BigNumber(10).pow(9));
      let averageFee = new BigNumber(self.averageGasPrice).times(self.gasLimit).div(BigNumber(10).pow(9));
      return {
        minFee: roundFun(Number(minFee.toString(10)), 8),
        averageFee: roundFun(Number(averageFee.toString(10)), 8),
        maxFee: roundFun(Number(averageFee.times(2).toString(10)), 8)
      }
    }
}

const self = new SendCrossChainParams();
export default self;