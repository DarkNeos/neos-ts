import React from "react";
import { useParams } from "react-router-dom";

export default function WaitRoom() {
  const params = useParams<{
    player: string;
    passWd: string;
    ip: string;
  }>();

  return (
    <div>
      <p>player: {params.player}</p>
      <p>passwd: {params.passWd}</p>
      <p>ip: {params.ip}</p>
    </div>
  );
}
