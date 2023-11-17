import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <main>
      <button onClick={() => navigate("/roulette")}>Go to Roulette</button>
    </main>
  );
};

export default Dashboard;
