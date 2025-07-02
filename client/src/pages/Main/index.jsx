import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import Aside from "../../components/Aside";
import Products from "../../components/Products";
import { setSortOption, setFilterOption } from "../../slices/productsSlice";
import bottom from "../../assets/icon/bottom.svg";
import ogImage from "../../assets/favicon/logo192.png";
import "./style.scss";

const Main = ({ gender }) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sortOption } = useSelector((state) => state.products);
  const [isOpen, setIsOpen] = useState(false);

  const [activeCategory, setActiveCategory] = useState(() => {
    return gender === "men"
      ? "Мужская одежда, обувь и аксессуары"
      : "Женская одежда, обувь и аксессуары";
  });

  // Синхронизация sortOption с searchParams
  useEffect(() => {
    const filter = searchParams.get("filter") || "Сортировка";
    if (sortOption !== filter) {
      dispatch(setSortOption(filter));
    }
  }, [searchParams, dispatch, sortOption]);

  // Обновление категории на основе gender
  useEffect(() => {
    const newCategory =
      gender === "men"
        ? "Мужская одежда, обувь и аксессуары"
        : "Женская одежда, обувь и аксессуары";
    setActiveCategory(newCategory);
    localStorage.setItem("activeItem", newCategory);
    dispatch(setFilterOption(newCategory)); // Устанавливаем фильтр по категории
  }, [gender, dispatch]);

  // Закрытие меню сортировки при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".sort")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleSortMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = (option) => {
    dispatch(setSortOption(option));
    setSearchParams({ ...Object.fromEntries(searchParams), filter: option });
    setIsOpen(false);
  };

  // SEO-данные
  const pageTitle = `${activeCategory} - Купить в интернет-магазине`;
  const pageDescription = `Огромный выбор товаров в категории "${activeCategory}". Купите ${
    gender === "men" ? "мужскую" : "женскую"
  } одежду, обувь и аксессуары по выгодным ценам с доставкой по России.`;
  const canonicalUrl = `${window.location.origin}/${gender}-home`;
  const ogImageUrl = ogImage;

  return (
    <div className="container">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content={`${activeCategory}, ${
            gender === "men" ? "мужская" : "женская"
          } одежда, обувь, аксессуары, купить, интернет-магазин`}
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Helmet>
      <div className="main">
        <div className="h3">
          <h3>{activeCategory}</h3>
          <div className="sort" onClick={toggleSortMenu}>
            {sortOption} <img src={bottom} alt="bottomIcon" />
            {isOpen && (
              <div className="sort__options">
                <p onClick={() => handleOptionSelect("Сортировка")}>
                  Сортировка
                </p>
                <p onClick={() => handleOptionSelect("Новинки")}>Новинки</p>
                <p onClick={() => handleOptionSelect("Сначала дороже")}>
                  Сначала дороже
                </p>
                <p onClick={() => handleOptionSelect("Сначала дешевле")}>
                  Сначала дешевле
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="slidebarAndProducts">
          <Aside gender={gender} />
          <Products gender={gender} />
        </div>
      </div>
    </div>
  );
};

export default Main;
