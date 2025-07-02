import React, { useState, useEffect } from "react";
import "./RegionPopup.scss";

const RegionPopup = ({ isOpen, onClose }) => {
  const [cities, setCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Популярные города России
  const popularCities = [
    { id: 1, name: "Москва" },
    { id: 2, name: "Санкт-Петербург" },
    { id: 3, name: "Новосибирск" },
    { id: 4, name: "Екатеринбург" },
    { id: 5, name: "Казань" },
    { id: 6, name: "Нижний Новгород" },
    { id: 7, name: "Челябинск" },
    { id: 8, name: "Самара" },
    { id: 9, name: "Омск" },
    { id: 10, name: "Ростов-на-Дону" },
  ];

  useEffect(() => {
    if (isOpen) {
      setCities(popularCities);
    }
  }, [isOpen]);

  const handleSearch = async (value) => {
    setSearchTerm(value);
    if (value.length > 2) {
      setIsLoading(true);
      try {
        const response = await fetch(
          "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Token ${process.env.REACT_APP_DADATA_TOKEN}`,
              "X-Secret": process.env.REACT_APP_DADATA_SECRET,
            },
            body: JSON.stringify({
              query: value,
              count: 5,
              locations: [{ country: "Россия" }],
              from_bound: { value: "city" },
              to_bound: { value: "city" },
            }),
          }
        );
        const data = await response.json();
        setSuggestions(
          data.suggestions.map((item, index) => ({
            id: index,
            name: item.data.city || item.data.settlement || item.value,
          }))
        );
      } catch (error) {
        console.error("Ошибка при получении подсказок:", error);
      }
      setIsLoading(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSearchTerm(city.name);
    setSuggestions([]);
    localStorage.setItem("selectedCity", city.name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm) {
      setSelectedCity({ name: searchTerm });
      localStorage.setItem("selectedCity", searchTerm);
      onClose();
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="region-popup__overlay">
      <div className="region-popup">
        <button className="region-popup__close" onClick={onClose}>
          ×
        </button>
        <h2>Выберите регион доставки</h2>
        <form onSubmit={handleSubmit} className="region-popup__search">
          <input
            type="text"
            placeholder="Введите город"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="region-popup__input"
          />
          <button type="submit" className="region-popup__submit">
            Подтвердить
          </button>
        </form>

        {isLoading && <p className="region-popup__loading">Загрузка...</p>}
        {suggestions.length > 0 && (
          <ul className="region-popup__suggestions">
            {suggestions.map((city) => (
              <li
                key={city.id}
                onClick={() => handleCitySelect(city)}
                className="region-popup__suggestion"
              >
                {city.name}
              </li>
            ))}
          </ul>
        )}

        <div className="region-popup__popular">
          <h3>Популярные города</h3>
          <div className="region-popup__cities">
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city)}
                className="region-popup__city"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionPopup;
