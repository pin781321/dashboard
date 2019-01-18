import React from 'react';
import Panel from 'muicss/lib/react/panel';
import Button from 'muicss/lib/react/button';
import {EventEmitter} from 'fbemitter';
import axios from 'axios';
import {Server} from 'stellar-sdk';

import AppBar from './AppBar';
import Footer from './Footer';
import AccountBalance from './AccountBalance';
import DistributionProgress from './DistributionProgress';
import NetworkStatus from './NetworkStatus';
import Nodes from './Nodes';
import LedgerCloseChart from './LedgerCloseChart';
import ListAccounts from './ListAccounts';
import HCXAvailable from './HCXAvailable';
import HCXDistributed from './HCXDistributed';
import PublicNetworkLedgersHistoryChart from './PublicNetworkLedgersHistoryChart';
import RecentOperations from './RecentOperations';
import TotalCoins from './TotalCoins';
import TransactionsChart from './TransactionsChart';
import {LIVE_NEW_LEDGER, LIVE_NEW_OPERATION, TEST_NEW_LEDGER, TEST_NEW_OPERATION} from '../events';

const horizonLive = "https://bitpaymentz.com";

const horizonTest ="https://network.paybito.com";


export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.chrome57 = navigator.userAgent.toLowerCase().indexOf('chrome/57') > -1;
    this.emitter = new EventEmitter();
    this.sleepDetector();

    // forceTheme is our way to celebrate May, 4th.
    var forceTheme = false;
    var may4 = false;

    var now = new Date();
    var d = now.getDate();
    var m = now.getMonth()+1;
    var y = now.getFullYear();

    if (d == 4 && m == 5) {
      forceTheme = true;
      may4 = true;
    }

    // TLJ
    if (d == 9 && m == 12 && y == 2017) {
      forceTheme = true;
    }

    // For testing
    if (localStorage.getItem('forceTheme') != null) {
      forceTheme = true;
      may4 = true;
    }

    this.state = {forceTheme, may4};
  }

  componentDidMount() {
    this.streamLedgers(horizonLive, LIVE_NEW_LEDGER);
    this.streamOperations(horizonLive, LIVE_NEW_OPERATION);

    this.streamLedgers(horizonTest, TEST_NEW_LEDGER);
    this.streamOperations(horizonTest, TEST_NEW_OPERATION);
  }

  reloadOnConnection() {
    return axios.get('https://s3-us-west-1.amazonaws.com/stellar-heartbeat/index.html', {timeout: 5*1000})
      .then(() => location.reload())
      .catch(() => setTimeout(this.reloadOnConnection.bind(this), 1000));
  }

  sleepDetector() {
    if (!this.lastTime) {
      this.lastTime = new Date();
    }

    let currentTime = new Date();
    if (currentTime - this.lastTime > 10*60*1000) {
      this.setState({sleeping: true});
      this.reloadOnConnection();
      return;
    }

    this.lastTime = new Date();
    setTimeout(this.sleepDetector.bind(this), 5000);
  }

  streamLedgers(horizonURL, eventName) {
    // Get last ledger
    axios.get(`${horizonURL}/ledgers?order=desc&limit=1`)
      .then(response => {
        let lastLedger = response.data._embedded.records[0];
        new Server(horizonURL).ledgers().cursor(lastLedger.paging_token)
          .stream({
            onmessage: ledger => this.emitter.emit(eventName, ledger)
          });
      });
  }

  streamOperations(horizonURL, eventName) {
    // Get last operation
    axios.get(`${horizonURL}/operations?order=desc&limit=1`)
      .then(response => {
        let lastOperation = response.data._embedded.records[0];

        new Server(horizonURL).operations().cursor(lastOperation.paging_token)
          .stream({
            onmessage: operation => this.emitter.emit(eventName, operation)
          });
      });
  }

  turnOffForceTheme() {
    this.setState({forceTheme: false});
    return false;
  }

  render() {
    return (
      <div id="main" className={this.state.forceTheme ? "force" : null}>
        <AppBar forceTheme={this.state.forceTheme} turnOffForceTheme={this.turnOffForceTheme.bind(this)} />

        {this.chrome57 ? 
          <Panel>
            <div className="mui--text-subhead mui--text-dark-secondary">
              You are using Chrome 57. There is a <a href="https://bugs.chromium.org/p/chromium/issues/detail?id=707544" target="_blank">known bug</a> that
              makes the Dashboard app consume extensive amounts of memory. Please switch to any other browser or wait for a fix by a Chromium team.
            </div>
          </Panel>
          :
          null
        }

        {this.state.sleeping ?
          <Panel>
            <div className="mui--text-subhead mui--text-accent">System sleep detected. Waiting for internet connection...</div>
          </Panel>
          :
          null
        }

        {this.state.forceTheme && this.state.may4 ?
          <h1 className="may4">May the 4<sup>th</sup> be with you!</h1>
          :
          null
        }

        <div id="main" className="mui-container-fluid">
          <section>
            <h1>Live network status</h1>
            <div className="row">
              <div className="mui-col-md-4">
                <NetworkStatus
                  network="Live network"
                  horizonURL={horizonLive}
                  newLedgerEventName={LIVE_NEW_LEDGER}
                  emitter={this.emitter}
                  />
                <RecentOperations
                  limit="20"
                  label="Live network"
                  horizonURL={horizonLive}
                  newOperationEventName={LIVE_NEW_OPERATION}
                  emitter={this.emitter}
                  />
              </div>
              <div className="mui-col-md-8">
                <LedgerCloseChart
                  network="Live network"
                  horizonURL={horizonLive}
                  limit="200"
                  newLedgerEventName={LIVE_NEW_LEDGER}
                  emitter={this.emitter}
                  />
                <TransactionsChart
                  network="Live network"
                  horizonURL={horizonLive}
                  limit="200"
                  newLedgerEventName={LIVE_NEW_LEDGER}
                  emitter={this.emitter}
                  />
                <PublicNetworkLedgersHistoryChart />
              </div>
            </div>
          </section>

	    <section>
            <h1>HCX distribution</h1>
	     <div className="mui-col-md-4">

            </div>
  

            <div className="mui-col-md-4">
              <TotalCoins
                horizonURL={horizonLive}
                />
            </div>
{/*	  <div className="mui-col-md-4">
              <HCXDistributed />
            </div>*/}
        
          </section>

    

          <section>
            <h1>Test network status</h1>
            <div className="mui-col-md-4">
              <NetworkStatus
                network="Test network"
                horizonURL={horizonTest}
                newLedgerEventName={TEST_NEW_LEDGER}
                emitter={this.emitter}
                />
              <RecentOperations
                limit="20"
                label="Test network"
                horizonURL={horizonTest}
                newOperationEventName={TEST_NEW_OPERATION}
                emitter={this.emitter}
                />
            </div>
            <div className="mui-col-md-8">
              <LedgerCloseChart
                network="Test network"
                horizonURL={horizonTest}
                limit="200"
                newLedgerEventName={TEST_NEW_LEDGER}
                emitter={this.emitter}
                />
              <TransactionsChart
                network="Test network"
                horizonURL={horizonTest}
                limit="200"
                newLedgerEventName={TEST_NEW_LEDGER}
                emitter={this.emitter}
                />
            </div>
{/*            <div className="mui-col-md-4">
              <AccountBalance
                horizonURL={horizonTest}
                name="Friendbot"
                id="GBS43BF24ENNS3KPACUZVKK2VYPOZVBQO2CISGZ777RYGOPYC2FT6S3K"
                />
            </div>*/}
          </section>
        </div>
        <Footer />
      </div>
    );
  }
}