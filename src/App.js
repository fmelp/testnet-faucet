import React from 'react';
import logo from './logo.svg';
import './App.css';
import CallPact from "./CallPact";
import { Grid, Image } from "semantic-ui-react";

import backgroundImage from './assets/background_logo_square.jpg';

function App() {

  // return (
  //   <div className="App">
  //     <header className="App-header">
  //       <h1 style={{color:"purple"}}>Welcome to the Kadena Testnet Faucet!</h1>
  //       <CallPact/>
  //     </header>
  //     <div style={{position: "absolute", top: 10, left: 10}}>
  //         <img src={require('./kadena.png')} />
  //     </div>
  //   </div>
  // );
  return (
    <div className="App">
      <Grid columns={2} verticalAlign='middle'>
        <Grid.Column>
          <Image src={backgroundImage} fluid={true} />
        </Grid.Column>
        <Grid.Column>
          <CallPact />
        </Grid.Column>
      </Grid>

    </div>
  );
}

export default App;
