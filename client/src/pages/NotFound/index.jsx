import React from "react";
import { Link } from "react-router-dom";
import nf from "../../assets/image/404.png";
import "./style.scss";

const NotFound = () => {
  return (
    <div className="notFound">
      <img src={nf} alt="404 Not Found" />
      <div className="notFound__text">
        <div className="notFound__text-span">
          <h1>Упс, что-то пошло не так</h1>
          <p>Мы не можем найти страницу, которую вы ищете</p>
        </div>
        <Link to="/">
          <button>Вернуться на главную</button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
