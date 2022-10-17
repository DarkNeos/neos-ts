import React from "react";
import JoinRoom from "./ui/JoinRoom";
import WaitRoom from "./ui//WaitRoom";
import ThreeJs from "./ThreeJs";
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
