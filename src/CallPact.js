import React from 'react';
import Pact from "pact-lang-api";
import Button from '@material-ui/core/Button';
import { VpnKey, Lock } from '@material-ui/icons';
import  './main.css';

const API_HOST = "http://localhost:9001";



class CallPact extends React.Component {

  state = {
    publicKey: "",
    secretKey: ""
  }

  fundAccount = () => {
    let publicKey = this.state.publicKey.toString();
    let secretKey = this.state.secretKey.toString().replace(publicKey, "");
    console.log(publicKey);
    console.log(secretKey)
    const cmdObj = {
      pactCode: `(coin-faucet.request-coin ${JSON.stringify(publicKey)} ${JSON.stringify(12)})`,
      keyPairs: {
        publicKey: publicKey,
        secretKey: secretKey
      },
      meta: Pact.lang.mkMeta(publicKey, "", 0, 0),
      envData: { [publicKey] : [secretKey] }
    }
    console.log(cmdObj);
    Pact.fetch.send(cmdObj, API_HOST);
  }


  render() {
    return (
      <div>
      <p>Enter your keys and press Fund Account to receive 12 coins</p>
      <div className = "login-container">
        <div className="login-input-container">
          <div>
              <VpnKey/>
          </div>
          <input
            onChange={async (e) => {
              // await this.setState({ publicKey: e.target.value });
              // onKeysetChange(this.state.publicKey, this.state.secretKey)
              this.setState({ publicKey: e.target.value });
            }}
            value={this.state.publicKey}
            placeholder="public key"
          />
        </div>
        <div className="login-input-container">
          <div>
              <Lock/>
          </div>
          <input
            onChange={async (e) => {
              // await this.setState({ publicKey: e.target.value });
              // onKeysetChange(this.state.publicKey, this.state.secretKey)
              this.setState({ secretKey: e.target.value });
            }}
            value={this.state.secretKey}
            placeholder="private key"
            type="password"
          />
        </div>
        <Button variant="contained"
          disabled={this.state.loginButtonDisabled}
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
        </div>
        </div>
    );
  }


}
export default CallPact;
