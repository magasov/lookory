import React from "react";
import { Link, useNavigate } from "react-router-dom";

import "./style.scss";

const PopupData = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/");
    window.location.reload();
  };

  return (
    <div className="padding__data">
      <div className="popupData">
        <div className="popupData__head">
          <div className="avatar">
            {user?.username ? user.username.charAt(0).toUpperCase() : ""}
          </div>
          <div className="infouser">
            <p>{user?.username}</p>
            <span>{user?.email}</span>
          </div>
        </div>
        <hr />
        <div className="popupData__main">
          <Link to="/profile">Профиль</Link>

          <Link to="/orders">Мои заказы</Link>
          <Link to="/profile">Мои данные</Link>
        </div>
        <hr />
        <p className="logout" onClick={handleLogout}>
          Выйти
        </p>
      </div>
    </div>
  );
};

export default PopupData;
