import axios from "axios";
import React, { useState, useEffect } from "react";

export default function Card() {
  const [data, setData] = useState<IDeck>({});

  useEffect(() => {
    const fetchCards = async () => {
      const res = await axios.get<IDeck>("http://localhost:3030/deck/hero.ydk");

      setData(res.data);

      console.log(res.data);
    };

    fetchCards();
  }, []);

  const mainCards = (data.main || []).map((item, index) => (
    <li key={index}>{item}</li>
  ));
  const extraCards = (data.extra || []).map((item, index) => (
    <li key={index}>{item}</li>
  ));
  const sideCards = (data.side || []).map((item, index) => (
    <li key={index}>{item}</li>
  ));

  return (
    <ul>
      <li>
        main
        <ul>{mainCards}</ul>
      </li>
      <li>
        extra
        <ul>{extraCards}</ul>
      </li>
      <li>
        side
        <ul>{sideCards}</ul>
      </li>
    </ul>
  );
}

interface IDeck {
  main?: number[];
  extra?: number[];
  side?: number[];
}
