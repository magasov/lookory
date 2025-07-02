import React, { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import axios from "../../axios";
import "./style.scss";

const MyProfile = ({ user }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstname || "",
    lastName: user?.lastname || "",
    phone: user?.phone || "",
    deliveryService: user?.delivery || "",
    city: user?.city || "",
    pickupPoint: user?.address || "",
  });

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const cityInputRef = useRef(null);

  const fetchCitySuggestions = async (query) => {
    if (!query) {
      setCitySuggestions([]);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        "http://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Token 8423e98ac51c86fc93f6a98108f2ec571d7a6638",
          },
          body: JSON.stringify({
            query,
            count: 5,
            restrict_value: true,
            to_bound: { value: "city" },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка при запросе подсказок городов");
      }

      const data = await response.json();
      setCitySuggestions(
        data.suggestions.map((suggestion) => ({
          id: suggestion.data.city_kladr_id || suggestion.data.kladr_id,
          name: suggestion.value,
        }))
      );
    } catch (err) {
      toast.error(err.message);
      setCitySuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostalUnits = async (city) => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/postal_unit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Token ${process.env.REACT_APP_DADATA_TOKEN}`,
            "X-Secret": process.env.REACT_APP_DADATA_SECRET,
          },
          body: JSON.stringify({
            query: city,
            filters: [{ is_closed: false }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка при запросе к API Дадата");
      }

      const data = await response.json();
      return data.suggestions.map((suggestion) => ({
        id: suggestion.data.postal_code,
        address: suggestion.data.address_str,
        schedule: {
          mon: suggestion.data.schedule_mon,
          tue: suggestion.data.schedule_tue,
          wed: suggestion.data.schedule_wed,
          thu: suggestion.data.schedule_thu,
          fri: suggestion.data.schedule_fri,
          sat: suggestion.data.schedule_sat,
          sun: suggestion.data.schedule_sun,
        },
      }));
    } catch (err) {
      toast.error(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, city: value }));
    fetchCitySuggestions(value);
    setShowSuggestions(true);
  };

  const handleCitySelect = (city) => {
    setFormData((prev) => ({ ...prev, city: city.name }));
    setCitySuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityInputRef.current && !cityInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (formData.city && formData.deliveryService === "Почта России") {
      fetchPostalUnits(formData.city).then((points) => {
        setPickupPoints(points);
      });
    } else {
      setPickupPoints([]);
    }
  }, [formData.city, formData.deliveryService]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Обновление данных пользователя
      await axios.put("/users/me", {
        firstname: formData.firstName,
        lastname: formData.lastName,
        phone: formData.phone,
        delivery: formData.deliveryService,
        city: formData.city,
        address: formData.pickupPoint,
      });

      toast.success("Данные обновлены!");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Ошибка при сохранении данных"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="profile-container">
        <div className="profile-section">
          <h2 className="section-title">Личные данные</h2>
          <div className="user-info">
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email || "Не указан"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Имя:</span>
              <span className="info-value">
                {user?.firstname || "Не указано"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Фамилия:</span>
              <span className="info-value">
                {user?.lastname || "Не указана"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Телефон:</span>
              <span className="info-value">{user?.phone || "Не указан"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Служба доставки:</span>
              <span className="info-value">
                {user?.delivery || "Не указана"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Город:</span>
              <span className="info-value">{user?.city || "Не указан"}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Адрес доставки:</span>
              <span className="info-value">{user?.address || "Не указан"}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2 className="section-title">Оформление заказа</h2>
          <form onSubmit={handleSubmit} className="order-form">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                Имя
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Фамилия
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Телефон
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-input"
                required
                pattern="\+?[1-9]\d{1,14}"
                placeholder="+7XXXXXXXXXX"
              />
            </div>
            <div className="form-group">
              <label htmlFor="deliveryService" className="form-label">
                Служба доставки
              </label>
              <select
                id="deliveryService"
                name="deliveryService"
                value={formData.deliveryService}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Выберите службу</option>
                <option value="СДЭК">СДЭК</option>
                <option value="Почта России">Почта России</option>
              </select>
            </div>
            <div className="form-group" ref={cityInputRef}>
              <label htmlFor="city" className="form-label">
                Город
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleCityInputChange}
                className="form-input"
                required
                placeholder="Введите город"
                autoComplete="off"
              />
              {showSuggestions && citySuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {citySuggestions.map((city) => (
                    <li
                      key={city.id}
                      className="suggestion-item"
                      onClick={() => handleCitySelect(city)}
                    >
                      {city.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="pickupPoint" className="form-label">
                Пункт выдачи
              </label>
              {formData.deliveryService === "СДЭК" ? (
                <input
                  type="text"
                  id="pickupPoint"
                  name="pickupPoint"
                  value={formData.pickupPoint}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Введите адрес ПВЗ"
                  disabled={!formData.city || loading}
                />
              ) : (
                <select
                  id="pickupPoint"
                  name="pickupPoint"
                  value={formData.pickupPoint}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  disabled={
                    !formData.city ||
                    !formData.deliveryService ||
                    loading ||
                    formData.deliveryService !== "Почта России"
                  }
                >
                  <option value="">Выберите пункт выдачи</option>
                  {pickupPoints.map((point) => (
                    <option key={point.id} value={point.address}>
                      {point.address}
                      {point.schedule
                        ? ` (Пн: ${point.schedule.mon}, Вс: ${point.schedule.sun})`
                        : ""}
                    </option>
                  ))}
                </select>
              )}
              {loading && <p className="form-info">Загрузка...</p>}
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Сохранение..." : "Обновить данные"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default MyProfile;
