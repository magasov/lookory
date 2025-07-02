import React, { useEffect, useState } from "react";
import "./index.scss";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "../../axios";
import { Helmet } from "react-helmet-async";
import search from "../../assets/icon/search.svg";
import close from "../../assets/icon/close.svg";

const CartPages = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [isUserDataValid, setIsUserDataValid] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error(
          "Пожалуйста, войдите в аккаунт, чтобы добавить товар в корзину"
        );
        setProducts([]);
        setTotalPrice(0);
        return;
      }

      try {
        const response = await axios.get("/api/cart");
        setProducts(response.data.items || []);
        setTotalPrice(response.data.total || 0);
      } catch (error) {
        console.error("Ошибка при загрузке корзины:", error);
        toast.error("Не удалось загрузить корзину");
        setProducts([]);
        setTotalPrice(0);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get("/categories");
        setCategoriesData(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке категорий:", error);
      }
    };

    fetchCart();
    fetchCategories();

    localStorage.removeItem("activeItem");
    localStorage.removeItem("openCategory");
  }, []);

  useEffect(() => {
    // Проверка данных пользователя для доставки
    const requiredFields = [
      user?.address,
      user?.city,
      user?.delivery,
      user?.email,
      user?.firstname,
      user?.lastname,
      user?.phone,
    ];
    const isValid = requiredFields.every(
      (field) => field && field.trim() !== ""
    );
    setIsUserDataValid(isValid);
  }, [user]);

  const removeFromCart = async (itemId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Пожалуйста, войдите в аккаунт");
      return;
    }

    try {
      await axios.delete(`/api/cart/${itemId}`);
      const updatedCart = products.filter((item) => item.id !== itemId);
      setProducts(updatedCart);
      setTotalPrice(
        updatedCart.reduce(
          (sum, item) => sum + parseFloat(item.price) * item.quantity,
          0
        )
      );
      toast.success("Товар удален из корзины");
    } catch (error) {
      console.error("Ошибка при удалении товара:", error);
      toast.error(error.response?.data?.message || "Не удалось удалить товар");
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Пожалуйста, войдите в аккаунт");
      return;
    }

    try {
      await axios.put(`/api/cart/${itemId}`, { quantity: newQuantity });
      const updatedCart = products.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      setProducts(updatedCart);
      setTotalPrice(
        updatedCart.reduce(
          (sum, item) => sum + parseFloat(item.price) * item.quantity,
          0
        )
      );
      toast.success("Количество обновлено");
    } catch (error) {
      console.error("Ошибка при обновлении количества:", error);
      toast.error(
        error.response?.data?.message || "Не удалось обновить количество"
      );
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Пожалуйста, войдите в аккаунт");
      return;
    }

    try {
      await axios.delete("/api/cart");
      setProducts([]);
      setTotalPrice(0);
      toast.success("Корзина очищена");
    } catch (error) {
      console.error("Ошибка при очистке корзины:", error);
      toast.error(
        error.response?.data?.message || "Не удалось очистить корзину"
      );
    }
  };

  const handleCheckout = () => {
    setShowPopup(true);
  };

  const closePopup = async () => {
    if (!isUserDataValid) {
      setShowPopup(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Пожалуйста, войдите в аккаунт");
      setShowPopup(false);
      return;
    }

    if (!user.email) {
      toast.error("Укажите email в профиле для оформления заказа");
      setShowPopup(false);
      return;
    }

    try {
      const response = await axios.post(
        "/api/yookassa/create",
        { email: user.email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      window.location.href = response.data.paymentUrl;
    } catch (error) {
      console.error(
        "Ошибка при создании оплаты:",
        error.response?.data || error
      );
      toast.error(error.response?.data?.message || "Не удалось создать платеж");
    } finally {
      setShowPopup(false);
    }
  };

  return (
    <div className="container">
      <Helmet>
        <title>Корзина | Lookory</title>
        <meta
          name="description"
          content="Просмотрите и управляйте товарами в вашей корзине покупок"
        />
        <meta name="keywords" content="корзина, покупки, магазин, товары" />
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
            <Link>Корзина</Link>
          </div>
        </div>
      </div>

      <div className="cartPages">
        <div className="cartPages__left">
          {products.length > 0 && (
            <div className="cartPages__controls">
              <button onClick={clearCart}>Очистить корзину</button>
            </div>
          )}
          {products.length === 0 ? (
            <div className="empty-cart">
              <img
                src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
                alt="Пустая корзина"
                className="empty-cart__icon"
              />
              <h2>Ваша корзина пуста</h2>
              <p>Добавьте товары, чтобы оформить заказ.</p>
              <Link to="/men-home" className="empty-cart__btn">
                Перейти к покупкам
              </Link>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="cartPages__item">
                <img
                  src={product.variant.mainUrl}
                  alt={product.title}
                  className="cartPages__item-image"
                />
                <div className="cartPages__item-details">
                  <h3>{product.title}</h3>
                  <p>Бренд: {product.brand}</p>
                  <p>Цвет: {product.color}</p>
                  <p>Размер: {product.size}</p>
                  <div className="cartPages__item-quantity">
                    <button
                      onClick={() =>
                        updateQuantity(product.id, product.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <span>{product.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(product.id, product.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cartPages__item-price">
                  <p>{(product.price * product.quantity).toFixed(2)} ₽</p>
                  {product.oldPrice && (
                    <p className="old-price">{product.oldPrice} ₽</p>
                  )}
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="cartPages__item-remove"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {products.length > 0 && (
          <div className="cartPages__right">
            <h3>Сумма заказа</h3>
            <p>
              {products.length} товар(а) на {totalPrice.toFixed(2)} ₽
            </p>
            <p>Итого: {totalPrice.toFixed(2)} ₽</p>
            <button className="cartPages__checkout" onClick={handleCheckout}>
              К оформлению
            </button>
          </div>
        )}
      </div>

      {showPopup && (
        <div className="cartPages__popup">
          <div className="cartPages__popup-content">
            {isUserDataValid ? (
              <>
                <img
                  src={close}
                  alt="close"
                  onClick={() => setShowPopup(false)}
                  className="close__cartPopup"
                />
                <h2>Данные для доставки</h2>
                <div className="cartPages__popup-content-details">
                  <div className="detail-row">
                    <span className="detail-row__label">Получатель:</span>
                    <span className="detail-row__value">
                      {user.firstname} {user.lastname}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row__label">Email:</span>
                    <span className="detail-row__value">{user.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row__label">Телефон:</span>
                    <span className="detail-row__value">{user.phone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row__label">Адрес:</span>
                    <span className="detail-row__value">
                      {user.city}, {user.address}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row__label">Способ доставки:</span>
                    <span className="detail-row__value">{user.delivery}</span>
                  </div>
                </div>
                <div className="cartPages__popup-content-buttons">
                  <Link to="/profile" className="btn btn--secondary">
                    Изменить данные
                  </Link>
                  <button onClick={closePopup} className="btn btn--primary">
                    Подтвердить заказ
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Неполные данные</h2>
                <p>
                  Для оформления заказа необходимо заполнить все данные доставки
                  в профиле.
                </p>
                <div className="cartPages__popup-content-buttons">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="btn btn--secondary"
                  >
                    Закрыть
                  </button>
                  <Link to="/profile" className="btn btn--primary">
                    Заполнить данные
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPages;
