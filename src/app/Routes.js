import React from 'react';
import { HashRouter, withRouter, Switch, Route } from 'react-router-dom';
import { Layout, Portfolio, WanAccount, Settings, Trezor, Ledger, Staking, Validator, Offline, TokenTrans, EthAccount, CrossETH, CrossE20 } from './containers';

const Main = withRouter(props => <Layout {...props} />);

export default () => {
  return (
      <HashRouter>
        <Main>
          <Switch>
            <Route exact path="/" component={Portfolio} />
            <Route path="/wanaccount" component={WanAccount} />
            <Route path="/ethaccount" component={EthAccount} />
            <Route path="/crossETH" component={CrossETH} />

            <Route path="/settings" component={Settings} />
            {/* TODO */}
            {/* <Route path="/trezor" component={Trezor} /> */}
            <Route path="/ledger" component={Ledger} />
            <Route path="/offline" component={Offline} />
            <Route path="/staking" component={Staking} />
            <Route path="/validator" component={Validator} />
            <Route path="/tokens/:tokenAddr/:symbol" component={TokenTrans} />
            <Route path="/crossChain/:tokenAddr/:symbol" component={CrossE20} />
          </Switch>
        </Main>
      </HashRouter>
  );
};
