import React from 'react';
import { Button, Grid, Dropdown, Input, Icon, Modal, Header, Message } from 'semantic-ui-react';
import axios from "axios"
import Pact from "pact-lang-api";
import Fingerprint2 from "fingerprintjs2"

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
    reqKey: "",
    modalOpen: false,
    modalMsg: "",
    modalHeader: "",
    modalError: "",
    lastVisit: null,
    fingerprint: null
  }

  onChangeAccountName = e => this.setState({accountName: e.target.value})

  onChangePublicKey = e => this.setState({publicKey: e.target.value})

  onChangeChainId = (e, v) => this.setState({chainId: v.value})

  handleOpen = () => this.setState({ modalOpen: true })

  handleClose = () => this.setState({ modalOpen: false, modalError: "" })

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

  fetchAccountBalance = (acctName, apiHost) => {
    return Pact.fetch.local({
      pactCode: `(coin.account-balance ${JSON.stringify(acctName)})`,
      keyPairs: dumKeyPair,
    }, apiHost)
  }

  fundCreateAccount = async () => {
    const accountCheck = await this.fetchAccountBalance(this.state.accountName, createAPIHost(hosts[this.state.host], this.state.chainId))
    // if (this.state.lastRequest !== undefined) {
    //   const timePassed = (new Date() - this.state.lastRequest)/360000;
    //   if (timePassed < 30) {
    //       this.setState({ modalMsg: `You've received coin ${Math.round(timePassed)} minutes ago. Try again in ${Math.round(30-timePassed)} minutes`, modalHeader: 'WAIT'})
    //       this.handleOpen();
    //   }
    // }
     if (accountCheck.status==="success") {
      this.setState({ modalMsg: `Account ${this.state.accountName} already exists on chain ${this.state.chainId}`, modalHeader: 'EXISTING ACCOUNT'})
      this.handleOpen();
    }
    else {
      this.setState({status: "started"});
      const reqKey = await Pact.fetch.send({
        pactCode:`(prodnet-faucet.create-and-request-coin ${JSON.stringify(this.state.accountName)} (read-keyset 'fund-keyset) 5.0)`,
        keyPairs: dumKeyPair,
        envData: {"fund-keyset": [this.state.publicKey]},
        meta: Pact.lang.mkMeta("prodnet-faucet",this.state.chainId,0.0000001,50, 0, 28800)}, createAPIHost(hosts[this.state.host], this.state.chainId))
      if (reqKey) {
        this.saveFingerprint();
        this.setState({status: "waiting"})
        this.setState({reqKey: reqKey.requestKeys[0]})
      }
    }
  }

  fundAccount = async () => {
      const accountCheck = await this.fetchAccountBalance(this.state.accountName, createAPIHost(hosts[this.state.host], this.state.chainId));
      if (this.state.lastRequest !== undefined) {
        const timePassed = (new Date() - this.state.lastRequest)/360000;
        if (timePassed < 30) {
            this.setState({ modalMsg: `You've received coin ${Math.round(timePassed)} minutes ago. Try again in ${Math.round(30-timePassed)} minutes`, modalHeader: 'WAIT'})
            this.handleOpen();
        }
      }
      else if (accountCheck.status==="failure") {
        this.setState({ modalMsg: `Account ${this.state.accountName} does not exist on chain ${this.state.chainId}`, modalHeader: 'NO ACCOUNT'})
        this.handleOpen();
      }
      else {
        this.setState({status: "started"})
        const reqKey = await Pact.fetch.send({
          pactCode:`(prodnet-faucet.request-coin ${JSON.stringify(this.state.accountName)} 10.0)`,
          keyPairs: dumKeyPair,
          meta: Pact.lang.mkMeta("prodnet-faucet",this.state.chainId, 0.0000001,50,0,28800)
        }, createAPIHost(hosts[this.state.host], this.state.chainId))
        if (reqKey) {
          this.saveFingerprint();
          this.setState({status: "waiting"})
          this.setState({reqKey: reqKey.requestKeys[0]})
        }
      }
    }

  checkSuccess = reqKey => {
    Pact.fetch.poll({requestKeys: [reqKey]}, createAPIHost(hosts[this.state.host], this.state.chainId))
    .then(res => {
      if (!res[0]) {
        this.setState({ modalMsg: "We're preparing the coin...", modalHeader: 'TX PENDING'})
        this.handleOpen();
      }
      else if (res[0].result.status==="success") {
        this.setState({ modalMsg: `10 coins are funded to ${this.state.accountName}!`, modalHeader: 'TX SUCCESS'})
        this.handleOpen();
        this.setState({status: ""})}
      else if (res[0].result.status==="failure") {
        this.setState({ modalMsg: `Sorry, we couldn't fund your account`, modalHeader: 'TX FAILURE', modalError: `ERROR: ${res[0].result.error.message}` })
        this.handleOpen();
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
      if (res.status==="failure") {
        this.setState({ modalMsg: `Account ${this.state.accountName} does not exist on chain ${this.state.chainId}`, modalHeader: 'NO ACCOUNT'})
        this.handleOpen();
      }
      else{
        this.setState({ modalMsg: `${this.state.accountName} has ${res.data} Faucet Coins on chain ${this.state.chainId}`, modalHeader: 'USER EXISTS'})
        this.handleOpen();
      }
    })
  }

  saveFingerprint = () => {
    const options = {canvas: true}
    Fingerprint2.get( options, function (components) {
        var values = components.map(function (component) { return component.value })
        const murmur = Fingerprint2.x64hash128(values.join(''), 31)
        axios.post('/api/fingerprint', {fingerprint: murmur, date: new Date().toISOString()})
    })
  }

  componentDidMount(){
    const options = {canvas: true}
    const self=this;
    //Get Fingerprint
    Fingerprint2.get( options, function (components) {
      var values = components.map(function (component) { return component.value })
      const murmur = Fingerprint2.x64hash128(values.join(''), 31)
      self.setState({fingerprint: murmur});
      //Get last Request Date
      axios.get(`/api/fingerprint/${murmur}`)
        .then(res => {
          return res.data
        })
        .then(data => {
          if (data.date) self.setState({lastRequest: new Date(data.date)})
          else self.setState({lastRequest: null})
      })
    })
  }

  render() {
   return (
    <div style={{ marginTop: 20 }}>
      <Grid textAlign='center'>
        <Grid.Row textAlign='justified' style={{ marginTop: 20 }}>
          <text
            style={{ color: "#373A3C",
                    fontSize: 50,
                    fontWeight: "bold",
                    fontFamily: 'Roboto',
                    marginBottom: 10
            }}
          >
            Welcome to the
          </text>
        </Grid.Row>
        <Grid.Row textAlign='justified'>
          <text
            style={{ color: "#373A3C",
                    fontSize: 50,
                    fontWeight: "bold",
                    fontFamily: 'Roboto',
                    marginBottom: 10
            }}
          >
            Kadena Testnet Faucet
          </text>
        </Grid.Row>
        <Grid.Row textAlign='justified' style={{marginBottom: 0}}>
          <text
            style={{ color: "#373A3C",
                    fontSize: 26,
                    fontFamily: 'Roboto'
            }}
          >
            Enter Your Account Name and Receive 10 coins!
          </text>
        </Grid.Row>
      {this.state.haveAccount===undefined
       ?
        <div  className = "login-container">
          <Button
            className="custom-button"
            // color={"#B54FA3"}
            variant="contained"
            style={{ marginBottom: 20, marginTop: 20 }}
            onClick={() => this.changeStatus(true)}
          >
            <text style={{ fontSize: 20, fontWeight: "bold", fontFamily: 'Roboto', color: "white"}}>Have an Account?</text>
          </Button>

          <Button
            // color={"#B54FA3"}
            className="custom-button"
            variant="contained"
            style={{ marginTop: 20 }}
            onClick={() => this.changeStatus(false)}
          >
           <text style={{ fontSize: 20, fontWeight: "bold", fontFamily: 'Roboto', color: "white"}}>Don't Have an Account?</text>
          </Button>
          </div>
       :
        <div className = "login-container">
          <div>
            <Grid.Row>
              <Grid columns={3}>
                <Grid.Column>
                    <a onClick = {() => this.changeStatus(undefined)}>
                      <Icon name='arrow left' style={{ color: "#B54FA3" }}/>
                      <text style={{ fontSize: 20, fontWeight: "bold", fontFamily: 'Roboto', color: "#B54FA3"}}>back</text>
                    </a>
                </Grid.Column>
              </Grid>
            </Grid.Row>
            <Grid.Row style={{marginBottom: 5}}>
              <text
                style={{ fontSize: 14, fontWeight: "bold", fontFamily: 'Roboto', color: "black"}}
              >
                Chain ID
              </text>
            </Grid.Row>
            <Grid.Row style={{ marginBottom: 0 }}>
              <Dropdown
                placeholder={'Select Chain ID'}
                search
                selection
                onChange={this.onChangeChainId}
                options={chainIds.map(id => ({ key: id, text: id, value: id }))}
              >
              </Dropdown>
            </Grid.Row>
          {this.state.haveAccount===true
          ?
          <div>


              <Grid.Row style={{marginBottom: 5}}>
                <text
                  style={{ fontSize: 14, fontWeight: "bold", fontFamily: 'Roboto', color: "black"}}
                >
                  Account Name
                </text>
              </Grid.Row>
              <Grid textAlign='center'>
                <Grid.Row>
                  <Input icon='user' iconPosition='left' placeholder='Account Name' onChange={this.onChangeAccountName} />
                </Grid.Row>
              </Grid>


              <Button
                disabled={this.state.chainId==="" || this.state.status !== "notStarted"}
                className="custom-button"
                style={{ marginBottom: 10, marginTop: 30 }}
                onClick={() => {
                  this.fundAccount();
                }}
              >
                <text style={{ fontSize: 20, fontWeight: "bold", fontFamily: 'Roboto', color: "white"}}>Fund Account</text>
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
                <text style={{ fontSize: 20, fontWeight: "bold", fontFamily: 'Roboto', color: "white"}}>Check Your Balance</text>
              </Button>
            </div>
          :
            <div>
                <Grid.Row style={{marginBottom: 5, marginTop: 10}}>
                  <text
                    style={{ fontSize: 14, fontWeight: "bold", fontFamily: 'Roboto', color: "black"}}
                  >
                    Account Name
                  </text>
                </Grid.Row>
                <Grid.Row>
                  <Input icon='user' iconPosition='left' placeholder='Account Name' onChange={this.onChangeAccountName} />
                </Grid.Row>
                <Grid.Row style={{marginBottom: 5, marginTop: 10}}>
                  <text
                    style={{ fontSize: 14, fontWeight: "bold", fontFamily: 'Roboto', color: "black"}}
                  >
                    Public Key
                  </text>
                </Grid.Row>
                <Grid.Row>
                  <Input icon='key' iconPosition='left' placeholder='Public Key' onChange={this.onChangePublicKey} />
                </Grid.Row>
              <Button
                variant="contained"
                disabled={this.state.chainId==="" || this.state.publicKey.length !== 64 || this.state.status !== "notStarted"}
                className="custom-button"
                style={{ marginBottom: 10, marginTop: 30 }}
                onClick={() => {
                  this.fundCreateAccount();
                }}
              >
                <text style={{ fontSize: 20, fontWeight: "bold", fontFamily: 'Roboto', color: "white"}}>Create and Fund Account</text>
              </Button>

          </div>
         }
         {this.state.status==="notStarted"
           ? ""
           : this.state.status==="started"
             ?
             <Message style={{overflow: "auto", width: "300px"}}>
               <Message.Header>Waiting for Request Key</Message.Header>
             </Message>
             : <div style={{ marginTop: 10}}>


                  <Message style={{overflow: "auto", width: "300px"}}>
                    <Message.Header>Your Request Key</Message.Header>
                    <p style={{fontSize: "13px"}}>
                      {this.state.reqKey}
                    </p>
                  </Message>
                  <Button
                    className="status-button"
                    onClick={() => this.checkSuccess(this.state.reqKey)}>
                   <text style={{ fontSize: 20, fontWeight: "bold", fontFamily: 'Roboto', color: "white"}}>Check Request Status</text>
                  </Button>
               </div>
           }
        </div>
        </div>
      }
      </Grid>
      {this.state.modalOpen === false
      ? <div></div>
      :
      <div>
      <Modal
        // trigger={<Button onClick={this.handleOpen}>Show Modal</Button>}
        open={this.state.modalOpen}
        onClose={this.handleClose}
        basic
        size='small'
      >
        <Header icon="exchange" content={this.state.modalHeader} />
        <Modal.Content>
          <h3>{this.state.modalMsg}</h3>
          <h3>{this.state.modalError}</h3>
        </Modal.Content>
        <Modal.Actions>
          <Button
            color="green"
            onClick={this.handleClose}
            inverted
          >
            <Icon name="checkmark" /> Got it
          </Button>
        </Modal.Actions>
      </Modal>
      </div>
      }
    </div>
  )
 }

}
export default CallPact;
