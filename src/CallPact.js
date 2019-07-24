import React from 'react';
import Pact from "pact-lang-api";
import Button from '@material-ui/core/Button';

const API_HOST = "http://localhost:9001";



class CallPact extends React.Component {

  state = {
    buttonDisabled: false,
    keyPair: {},
    balance: 0
  }

  fundAccount = () => {
    const keyPairObj = Pact.crypto.genKeyPair();
    this.setState({ keyPair: keyPairObj });
    const cmdObj = {
      pactCode: `(coin-faucet.request-coin ${JSON.stringify(keyPairObj.publicKey)} ${JSON.stringify(12)})`,
      keyPairs: {
        publicKey: keyPairObj.publicKey,
        secretKey: keyPairObj.secretKey
      },
      meta: Pact.lang.mkMeta(keyPairObj.publicKey, "", 0, 0),
      envData: { [keyPairObj.publicKey] : [keyPairObj.secretKey] }
    }
    console.log(cmdObj);
    Pact.fetch.send(cmdObj, API_HOST);
  }

  getBalance = () => {
    const cmdObj = {
      pactCode: `(coin.account-balance ${JSON.stringify(this.state.keyPair.publicKey)})`,
      keyPairs: {
        publicKey: this.state.keyPair.publicKey,
        secretKey: this.state.keyPair.secretKey
      }
    }
    console.log(cmdObj);
    Pact.fetch.local(cmdObj, API_HOST)
    .then(res => {
      console.log(res.data);
      this.setState({ balance: res.data })
    });
  }

  showAccountInfo = () => {
    if (this.state.buttonDisabled){
      return (
        <div>
          <p>Public Key:</p>
          <p>{this.state.keyPair.publicKey}</p>
          <Button variant="contained"
            color="purple"
            style={{ marginBottom: 10, marginTop: 10 }}
            onClick={() => {
              navigator.clipboard.writeText(this.state.keyPair.publicKey)
            }}
          >
            Copy Public Key
          </Button>
          <p>Private Key:</p>
          <p>********************************</p>
          <Button variant="contained"
            color="purple"
            style={{ marginBottom: 10, marginTop: 10 }}
            onClick={() => {
              navigator.clipboard.writeText(this.state.keyPair.secretKey)
            }}
          >
            Copy Private Key
          </Button>
          <p>Balance: {this.state.balance}</p>
          <p style={{color:"red", fontWeight: "bold"}}>MAKE SURE TO SAFELY STORE YOUR KEYS!!</p>
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        <Button variant="contained"
          color="purple"
          disabled={this.state.buttonDisabled}
          style={{ marginBottom: 10, marginTop: 10 }}
          onClick={() => {
            this.fundAccount()
            this.setState({ buttonDisabled: true }, () => this.getBalance())

          }}
        >
          Create and Fund Account
        </Button>
        {this.showAccountInfo()}
      </div>
    );
  }

}

export default CallPact;
