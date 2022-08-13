import React from "react";
import "./App.css";
import "./api/ygopro.ts";
import { io, Socket } from "socket.io-client";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>Welcome to neos-ts!</p>
        <a
          className="App-link"
          href="https://github.com/DarkNeos"
          target="_blank"
          rel="noopener noreferrer"
        >
          DarkNeos
        </a>
      </header>
    </div>
  );
}

export default App;
