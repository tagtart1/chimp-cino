import React from "react";
import "./Header.scss";
import logo from "../../images/chimps-logo-small.png";

const Header = () => {
  return (
    <header>
      <div className="header-wrapper">
        <img src={logo} alt="logo" className="logo" />
        <div className="auth-actions-group">
          <button className="sign-in-button">Sign In</button>
          <button className="register-button">Register</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
