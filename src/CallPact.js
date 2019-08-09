import React from 'react';
import Button from '@material-ui/core/Button';
import FilledInput from '@material-ui/core/FilledInput';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import { VpnKey, AccountBox, ArrowLeft } from '@material-ui/icons';
import Select from '@material-ui/core/Select';

import Pact from "pact-lang-api";
import  './main.css';

const hosts = ["us1","us2","eu1","eu2","ap1","ap2"]
const chainIds = ["0","1",'2',"3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19"]
const createAPIHost = (network, chainId) => `https://${network}.testnet.chainweb.com/chainweb/0.0/testnet02/chain/${chainId}/pact`
const dumKeyPair = Pact.crypto.genKeyPair();

class CallPact extends React.Component {

  state = {
    publicKey: "",
    accountName: "",
    chainId: "",
    host: 0,
    haveAccount: undefined,
    status: "notStarted",
    reqKey: ""
  }

  onChangeAccountName = e => this.setState({accountName: e.target.value})

  onChangePublicKey = e => this.setState({publicKey: e.target.value})

  onChangeChainId = e => this.setState({chainId: e.target.value})

  changeStatus = status => {
    this.setState({
      publicKey: "",
      accountName: "",
      chainId: "",
      host: 0,
      haveAccount: status,
      status: "notStarted",
      reqKey: ""
    })
  }

  fundCreateAccount = async () => {
    const accountCheck = await Pact.fetch.local({
      pactCode: `(coin.account-balance ${JSON.stringify(this.state.accountName)})`,
      keyPairs: dumKeyPair,
    }, createAPIHost(hosts[this.state.host], this.state.chainId))
    if (accountCheck.status==="success") alert(`${this.state.accountName} ALREADY EXISTS ON CHAIN ${this.state.chainId}`)
    else {
      this.setState({status: "started"})
      const reqKey = await Pact.fetch.send({
        pactCode:`(heekyun-faucet1.create-and-request-coin ${JSON.stringify(this.state.accountName)} (read-keyset 'fund-keyset) 10.0)`,
        keyPairs: dumKeyPair,
        envData: {"fund-keyset": [this.state.publicKey]},
        meta: Pact.lang.mkMeta("heekyun-faucet1",this.state.chainId,10,50)}, createAPIHost(hosts[this.state.host], this.state.chainId))
      if (reqKey) {
        this.setState({status: "waiting"})
        this.setState({reqKey: reqKey.requestKeys[0]})
      }
    }
  }

  fundAccount = async () => {
      const accountCheck = await Pact.fetch.local({
        pactCode: `(coin.account-balance ${JSON.stringify(this.state.accountName)})`,
        keyPairs: dumKeyPair,
      }, createAPIHost(hosts[this.state.host], this.state.chainId))
      if (accountCheck.status==="failure") alert(`ACCOUNT DOES NOT EXIST ON CHAIN ${this.state.chainId}`)
      else {
        this.setState({status: "started"})
        const reqKey = await Pact.fetch.send({
          pactCode:`(heekyun-faucet1.request-coin ${JSON.stringify(this.state.accountName)} 10.0)`,
          keyPairs: dumKeyPair,
          meta: Pact.lang.mkMeta("heekyun-faucet1",this.state.chainId, 10,50)
        }, createAPIHost(hosts[this.state.host], this.state.chainId))

        if (reqKey) {
          this.setState({status: "waiting"})
          this.setState({reqKey: reqKey.requestKeys[0]})
        }

      }
    }

  checkSuccess = reqKey => {
    Pact.fetch.poll({requestKeys: [reqKey]}, createAPIHost(hosts[this.state.host], this.state.chainId))
    .then(res => {
      if (!res[0]) {
        alert("We're preparing the coin...")
      }
      else if (res[0].result.status==="success") {
        alert(`10 coins are funded to ${this.state.accountName}!`)
        this.setState({status: ""})}
      else if (res[0].result.status==="failure") {
        alert("Sorry, we couln't fund your account")
        this.setState({status: ""})
      }
    })
  }

  accountBalance = () => {
    Pact.fetch.local({
      pactCode: `(coin.account-balance ${JSON.stringify(this.state.accountName)})`,
      keyPairs: dumKeyPair,
    }, createAPIHost(hosts[this.state.host], this.state.chainId))
    .then(res => {
      if (res.status==="failure") alert(`ACCOUNT DOES NOT EXIST ON CHAIN ${this.state.chainId}`)
      else alert (`${this.state.accountName} has ${res.data} Faucet Coins On  chain ${this.state.chainId}`)
    })
  }

  render() {
    return (
    <div>
      <h3>Enter Your Account Name and Receive 10 coins!</h3>
      {this.state.haveAccount===undefined
       ?
        <div  className = "login-container">
          <Button variant="contained"
          className="custom-button"
          variant="contained"
          style={{ marginBottom: 10, marginTop: 10 }}
          onClick={() => this.changeStatus(true)}
          >
          Have an Account?
          </Button>

          <Button variant="contained"
            className="custom-button"
            variant="contained"
            style={{ marginBottom: 10, marginTop: 10 }}
            onClick={() => this.changeStatus(false)}
          >
          Don't Have an Account?
          </Button>
          </div>
       :
        <div className = "login-container">
          <div>
            <a onClick = {() => this.changeStatus(undefined)}>
              <ArrowLeft style={{ fontSize: 50 }}/>
            </a>
            <FormControl
              variant="filled"
              style={{ minWidth: 200,
                       maxWidth: 300}}>
              <InputLabel htmlFor="select-multiple">CHAIN ID</InputLabel>
              <Select
                onChange={this.onChangeChainId}
                value={this.state.chainId}
                input={<FilledInput name="ChainID" id="chainId" />}
              >
              {chainIds.map(id => <MenuItem key={id} value={id}>{id}</MenuItem>)}
              </Select>
            </FormControl>
          {this.state.haveAccount===true
          ?
          <div>
            <div className="login-input-container">
              <div>
                  <AccountBox/>
              </div>
              <input
                onChange={this.onChangeAccountName}
                value={this.state.accountName}
                placeholder="Account Name"
              />
            </div>
              <Button variant="contained"
                disabled={this.state.chainId==="" || this.state.status !== "notStarted"}
                color="primary"
                className="custom-button"
                variant="contained"
                style={{ marginBottom: 10, marginTop: 10 }}
                onClick={() => {
                  this.fundAccount();
                }}
              >
                Fund Account
              </Button>
              <Button variant="contained"
                disabled={this.state.chainId===""}
                className="custom-button"
                variant="contained"
                style={{ marginBottom: 10, marginTop: 10 }}
                onClick={() => {
                  this.accountBalance();
                }}
              >
              Check Your Balance
              </Button>
            </div>
          :
            <div>
              <div className="login-input-container">
                <div>
                    <AccountBox/>
                </div>
                <input
                  onChange={this.onChangeAccountName}
                  value={this.state.accountName}
                  placeholder="Account Name"
                />
              </div>
              <div className="login-input-container">
                <div>
                    <VpnKey/>
                </div>
                <input
                  onChange={this.onChangePublicKey}
                  value={this.state.publicKey}
                  placeholder="Public Key"
                />
              </div>
              <Button
                variant="contained"
                disabled={this.state.chainId==="" || this.state.publicKey.length !== 64 || this.state.status !== "notStarted"}
                className="custom-button"
                style={{ marginBottom: 10, marginTop: 10 }}
                onClick={() => {
                  this.fundCreateAccount();
                }}
              >
                Create and Fund Account
              </Button>

          </div>
         }
         {this.state.status==="notStarted"
           ? ""
           : this.state.status==="started"
             ? <p>Waiting for your request key</p>
             : <div>
                 <p style={{fontSize: 20}}>Your Request Key is:</p>
                 <p style={{fontSize: 15}}>{this.state.reqKey}</p>
                 <Button
                   className="status-button"
                   onClick={() => this.checkSuccess(this.state.reqKey)}>
                 Check Request Status
                 </Button>
               </div>
           }
        </div>
        </div>
      }
    </div>
  )
 }

}
export default CallPact;
