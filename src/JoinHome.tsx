import React, { useState, useEffect } from "react";

export default function JoinHome(props: { addr: string }) {
  const [isConnected, setConnected] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const ws = new WebSocket(props.addr);

    ws.onopen = () => {
      console.log("websocket open");
      setConnected(true);
    };

    ws.onclose = () => {
      console.log("websocket closed");
      setConnected(false);
    };

    ws.onmessage = (e) => {
      const msg = e.data;
      setMessage(msg);
    };

    return () => ws.close();
  }, []);

  return (
    <div>
      <p>{"isConnected: " + isConnected}</p>
      <p>{"message: " + message}</p>
    </div>
  );
}
