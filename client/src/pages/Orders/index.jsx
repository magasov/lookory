import React, { useEffect, useState } from "react";
import axios from "../../axios";
import { FaShoppingBag, FaArrowRight, FaTimes } from "react-icons/fa";
import "./style.scss";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("/orders");
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Ошибка при загрузке заказов");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Функция для получения деталей заказа
  const fetchOrderDetails = async (orderId) => {
    setModalLoading(true);
    setModalError(null);
    try {
      const response = await axios.get(`/orders/${orderId}`);
      setSelectedOrder(response.data);
      setModalLoading(false);
    } catch (err) {
      setModalError(
        err.response?.data?.message || "Ошибка при загрузке деталей заказа"
      );
      setModalLoading(false);
    }
  };

  // Закрытие модального окна
  const closeModal = () => {
    setSelectedOrder(null);
    setModalError(null);
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Маппинг статусов
  const mapStatus = (status) => {
    switch (status) {
      case "pending":
        return "В ожидании";
      case "paid":
        return "Оплачен";
      case "delivered":
        return "Доставлен";
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="orders-container">Загрузка...</div>;
  }

  if (error) {
    return <div className="orders-container">Ошибка: {error}</div>;
  }

  return (
    <div className="orders-container">
      <h1 className="orders-title">Мои заказы</h1>
      {orders.length > 0 ? (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-number">Заказ #{order.id}</span>
                <span className={`order-status ${order.status}`}>
                  {mapStatus(order.status)}
                </span>
              </div>
              <div className="order-details">
                <div className="order-info">
                  <span className="label">Дата:</span>
                  <span className="value">{formatDate(order.createdAt)}</span>
                </div>
                <div className="order-info">
                  <span className="label">Сумма:</span>
                  <span className="value">{order.total.toFixed(2)} ₽</span>
                </div>
              </div>
              <div className="order-items">
                <span className="label">Товары:</span>
                <ul>
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <li key={index}>
                        {item.title} ({item.size}, {item.color}) -{" "}
                        {item.quantity} шт. за {item.price} ₽
                      </li>
                    ))
                  ) : (
                    <li>Товары отсутствуют</li>
                  )}
                </ul>
              </div>
              <button
                className="order-action"
                onClick={() => fetchOrderDetails(order.id)}
              >
                Подробнее <FaArrowRight className="arrow-icon" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FaShoppingBag className="empty-icon" />
          <h2 className="empty-title">Пока нет заказов</h2>
          <p className="empty-text">
            Начните шопинг и ваши заказы появятся здесь!
          </p>
          <button className="shop-button">
            Начать покупки <FaArrowRight className="arrow-icon" />
          </button>
        </div>
      )}

      {/* Модальное окно для деталей заказа */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            {modalLoading ? (
              <div>Загрузка...</div>
            ) : modalError ? (
              <div>Ошибка: {modalError}</div>
            ) : (
              <>
                <h2 className="modal-title">Заказ #{selectedOrder.id}</h2>
                <div className="modal-details">
                  <div className="modal-info">
                    <span className="label">Статус:</span>
                    <span className="value">
                      {mapStatus(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="modal-info">
                    <span className="label">Дата создания:</span>
                    <span className="value">
                      {formatDate(selectedOrder.createdAt)}
                    </span>
                  </div>
                  <div className="modal-info">
                    <span className="label">Последнее обновление:</span>
                    <span className="value">
                      {formatDate(selectedOrder.updatedAt)}
                    </span>
                  </div>
                  <div className="modal-info">
                    <span className="label">Сумма:</span>
                    <span className="value">
                      {selectedOrder.total.toFixed(2)} ₽
                    </span>
                  </div>
                </div>
                <div className="modal-items">
                  <h3>Товары</h3>
                  {Array.isArray(selectedOrder.items) &&
                  selectedOrder.items.length > 0 ? (
                    <ul>
                      {selectedOrder.items.map((item, index) => (
                        <li key={index} className="modal-item">
                          <img
                            src={item.mainUrl}
                            alt={item.title}
                            className="item-image"
                            onError={(e) => (e.target.src = "/placeholder.jpg")} // Запасное изображение
                          />
                          <div className="item-details">
                            <h4>{item.title}</h4>
                            <p>Бренд: {item.brand}</p>
                            <p>Размер: {item.size}</p>
                            <p>Цвет: {item.color}</p>
                            <p>Цена: {item.price} ₽</p>
                            <p>Количество: {item.quantity}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Товары отсутствуют</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
