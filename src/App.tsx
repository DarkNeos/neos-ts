import React from "react";
import "./App.css";
import "./api/ocgcore";
import JoinHome from "./JoinHome";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <JoinHome addr="ws://localhost:8000" />
      </header>
    </div>
  );
}

export default App;
