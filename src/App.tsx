import React from "react";
import "./App.css";
import JoinRoom from "./JoinRoom";
import WaitRoom from "./WaitRoom";
import ThreeJs from "./ThreeJs";
import { Routes, Route } from "react-router-dom";
import Card from "./Card";

function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinRoom />} />
      <Route path="/:player/:passWd/:ip" element={<WaitRoom />} />
      <Route path="/three.js" element={<ThreeJs />} />
      <Route path="/card" element={<Card />} />
    </Routes>
  );
}

export default App;
