import React from "react";
import JoinRoom from "./JoinRoom";
import WaitRoom from "./WaitRoom";
import ThreeJs from "../ThreeJs";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinRoom />} />
      <Route path="/:player/:passWd/:ip" element={<WaitRoom />} />
      <Route path="/three.js" element={<ThreeJs />} />
    </Routes>
  );
}

export default App;
