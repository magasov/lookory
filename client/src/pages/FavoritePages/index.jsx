import React, { useEffect, useState } from "react";
import "./index.scss";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "../../axios";

import search from "../../assets/icon/search.svg";
import { Helmet } from "react-helmet-async";

const FavoritePages = () => {
  const [products, setProducts] = useState([]);
  const [isHovered, setIsHovered] = useState({});
  const [isFavoriteHovered, setIsFavoriteHovered] = useState({});
  const [categoriesData, setCategoriesData] = useState([]);

  useEffect(() => {
    const storedFavorites = localStorage.getItem("favorites");
    if (storedFavorites) {
      try {
        const parsedFavorites = JSON.parse(storedFavorites);
        setProducts(parsedFavorites);
      } catch (error) {
        console.error("Ошибка парсинга localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    axios
      .get("/categories")
      .then((response) => {
        setCategoriesData(response.data);
      })
      .catch((error) => {
        console.error("Ошибка при загрузке категорий:", error);
      });

    localStorage.removeItem("activeItem");
    localStorage.removeItem("openCategory");
  }, []);

  const handleFavoritesAction = (e, product) => {
    e.preventDefault();
    const favoriteItem = {
      id: product.id,
      title: product.title,
      brand: product.brand,
      price: product.price,
      image: product.image,
    };

    const currentFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const isInFavorites = currentFavorites.some(
      (item) => item.id === product.id
    );

    if (isInFavorites) {
      const updatedFavorites = currentFavorites.filter(
        (item) => item.id !== product.id
      );
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
      setProducts(updatedFavorites);
      toast.success("Товар удален из избранного!");
    } else {
      currentFavorites.push(favoriteItem);
      localStorage.setItem("favorites", JSON.stringify(currentFavorites));
      setProducts(currentFavorites);
      toast.success("Товар добавлен в избранное!");
    }
  };

  const renderEmptyCart = () => (
    <div className="empty-cart">
      <img
        src="https://cdn-icons-png.flaticon.com/512/833/833472.png"
        alt="Пустая корзина"
        className="empty-cart__icon"
      />
      <h2>Список избранного пуст</h2>
      <p>Добавьте товары в избранное, чтобы быстро найти их позже.</p>
      <Link to="/men-home" className="empty-cart__btn">
        На главную
      </Link>
    </div>
  );

  const renderProducts = () => (
    <div className="favoritePages">
      {products.map((product) => {
        const image = product.image;

        return (
          <div className="cart-container" key={product.id}>
            <div className="cart">
              <Link
                to={`/men-home/product/${product.id}`}
                className="cart__one"
                onMouseEnter={() =>
                  setIsHovered((prev) => ({
                    ...prev,
                    [product.id]: true,
                  }))
                }
                onMouseLeave={() =>
                  setIsHovered((prev) => ({
                    ...prev,
                    [product.id]: false,
                  }))
                }
              >
                {image ? (
                  <img src={image} alt={product.title} />
                ) : (
                  <div className="no-image">Нет изображения</div>
                )}
                <div
                  className="favorite"
                  onMouseEnter={() =>
                    setIsFavoriteHovered((prev) => ({
                      ...prev,
                      [product.id]: true,
                    }))
                  }
                  onMouseLeave={() =>
                    setIsFavoriteHovered((prev) => ({
                      ...prev,
                      [product.id]: false,
                    }))
                  }
                  onClick={(e) => handleFavoritesAction(e, product)}
                >
                  <svg
                    width="21"
                    height="19"
                    viewBox="0 0 21 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10.25 4.68994H10.75C10.75 2.66394 12.944 0.689941 15.19 0.689941C18.214 0.689941 19.75 3.10194 19.75 5.95194C19.75 13.0839 10.25 17.6899 10.25 17.6899C10.25 17.6899 0.75 13.0839 0.75 5.95194C0.75 3.10194 2.286 0.689941 5.31 0.689941C7.556 0.689941 9.75 2.66394 9.75 4.68994H10.25Z"
                      fill={
                        products.some((item) => item.id === product.id)
                          ? "#FF0000"
                          : "white"
                      }
                      stroke={
                        products.some((item) => item.id === product.id)
                          ? "#FF0000"
                          : "black"
                      }
                    />
                  </svg>
                </div>
              </Link>
              <div className="cart__two">
                <div className="prices">
                  <span className="line-through">
                    {product.oldPrice ? `${product.oldPrice} ₽` : ""}
                  </span>
                  <p>{product.price} ₽</p>
                </div>
                <div className="brandandname">
                  <p className="brand">{product.brand}</p>
                  <p className="name">{product.title}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="container">
      <Helmet>
        <title>Избранное | Lookory</title>
        <meta
          name="description"
          content="Просматривайте и управляйте товарами, добавленными в избранное на Lookory"
        />
        <meta
          name="keywords"
          content="избранное, избранные товары, желания, магазин, lookory"
        />
      </Helmet>

      <div className="header__navlinks">
        <div className="container">
          <div className="header__navlinks-df">
            <div className="navlinks_left">
              {categoriesData.slice(0, 8).map((categ, index) => (
                <Link to={`?sort=${categ.name}`} key={index}>
                  {categ.name}
                </Link>
              ))}
            </div>
            <div className="navlinks_right">
              <input
                type="text"
                className="search__input"
                placeholder="Поиск"
              />
              <button className="search__btn">
                <img src={search} alt="search" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="header__breadcrumbs">
        <div className="container">
          <div className="header__breadcrumbs-df">
            <Link to="/">Главная</Link>
            <span>/</span>
            <Link>Избранное</Link>
          </div>
        </div>
      </div>

      {products.length > 0 ? renderProducts() : renderEmptyCart()}
    </div>
  );
};

export default FavoritePages;
