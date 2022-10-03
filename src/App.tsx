import React from "react";
import "./App.css";
import JoinRoom from "./JoinRoom";
import WaitRoom from "./WaitRoom";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinRoom />} />
      <Route path="/:player/:passWd/:ip" element={<WaitRoom />} />
    </Routes>
  );
}

export default App;
