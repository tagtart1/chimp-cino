import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./Components/App/App";
import { UserProvider } from "./Contexts/UserProvider";
import { AuthPopupProvider } from "./Contexts/AuthPopupProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <UserProvider>
    <AuthPopupProvider>
      <App />
    </AuthPopupProvider>
  </UserProvider>
);
