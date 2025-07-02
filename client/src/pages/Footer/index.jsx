import React from "react";

import logo from "../../assets/icon/logo.svg";
import "./style.scss";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer">
          <Link>
            <img src={logo} alt="logo" />
          </Link>
          © {new Date().getFullYear()} Все права защищены.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
