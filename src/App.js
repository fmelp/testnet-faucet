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
        <p>Follow the instructions below to create an account and fund it with 12 coins</p>
        <CallPact/>
      </header>

    </div>
  );
}

export default App;
