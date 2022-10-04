import axios from "axios";
import React, { useState, useEffect } from "react";

export default function Card() {
  const [data, setData] = useState("");

  useEffect(() => {
    const fetchCards = async () => {
      const res = await axios.get("http://localhost:3030/hello/neos");

      setData(res.data);
    };

    fetchCards();
  }, []);

  return <div>{data}</div>;
}
