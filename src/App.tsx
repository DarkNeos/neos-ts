import React from "react";
import "./App.css";
import "./api/ocgcore";

function App() {
  // test
  const ws = new WebSocket("ws:/localhost:8000");
  
  console.log("websocket connected!");

  ws.onmessage = e => {
    console.log("websocket recv: " + e.data);
  };

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
