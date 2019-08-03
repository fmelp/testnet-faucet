import React from 'react';
import logo from './logo.svg';
import './App.css';
import CallPact from "./CallPact";



function App() {

  return (
    <div className="App">
      <header className="App-header">
        <p style={{fontSize: 45, color:"purple", fontWeight: "bold"}}>
          Welcome to the Kadena Testnet Faucet!
        </p>
        <CallPact/>
      </header>
      <div style={{position: "absolute", top: 10, left: 10}}>
            <img src={require('./kadena.png')} />
          </div>
    </div>
  );
}

export default App;
