import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./Components/App/App";
import { UserProvider } from "./Contexts/UserProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <UserProvider>
    <App />
  </UserProvider>
);
