import React from "react";
import JoinRoom from "./JoinRoom";
import WaitRoom from "./WaitRoom";
import ThreeJs from "./ThreeJs";
import BabylonJs from "./BabylonJs";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinRoom />} />
      <Route path="/:player/:passWd/:ip" element={<WaitRoom />} />
      <Route path="/three" element={<ThreeJs />} />
      <Route path="/babylon" element={<BabylonJs />} />
    </Routes>
  );
}

export default App;
