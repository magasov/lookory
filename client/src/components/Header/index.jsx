import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setSortOption, setFilterOption } from "../../slices/productsSlice";
import axios from "../../axios";

import "./style.scss";
import navigate from "../../assets/icon/navigate.svg";
import menu from "../../assets/icon/menu.svg";
import bottom from "../../assets/icon/bottom.svg";
import filter from "../../assets/icon/filter.svg";
import favorite from "../../assets/icon/favorite.svg";
import logo from "../../assets/icon/logo.svg";
import search from "../../assets/icon/search.svg";
import searchHeader from "../../assets/icon/searchHeader.svg";
import cart from "../../assets/icon/cart.svg";
import Auth from "../Auth";
import PopupData from "../PopupData";
import RegionPopup from "../RegionPopup";
import Search from "../Search";

const Header = ({ user }) => {
  const [isPopupAuth, setIsPopupAuth] = useState(false);
  const [isSearchMedia, setIsSearchMedia] = useState(false);
  const [categoriesData, setCategoriesData] = useState([]);
  const [popupActive, setPopupActive] = useState(false);
  const [isRegionPopupOpen, setIsRegionPopupOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem("selectedCity") || "Укажите регион доставки"
  );
  const [isSort, setIsSort] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Категории");
  const [activeCategory, setActiveCategory] = useState(null);

  const dispatch = useDispatch();
  const { sortOption, products } = useSelector((state) => state.products);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef(null);
  const searchResultsRef = useRef(null);
  const menuRef = useRef(null);

  const getGenderFromPath = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes("women")) return "women";
    if (path.includes("men")) return "men";
    return null;
  };

  const gender = getGenderFromPath();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/categories", {
          params: { gender },
        });
        setCategoriesData(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке категорий:", error);
      }
    };

    fetchCategories();

    localStorage.removeItem("activeItem");
    localStorage.removeItem("openCategory");
  }, [gender]);

  const currentGender = location.pathname === "/women-home" ? "women" : "men";

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const sortOptions = [
    "Сортировка",
    "Новинки",
    "Сначала дороже",
    "Сначала дешевле",
  ];

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter && sortOptions.includes(filter)) {
      dispatch(setSortOption(filter));
    } else if (!filter && sortOption !== "Сортировка") {
      dispatch(setSortOption("Сортировка"));
    }
  }, [searchParams, dispatch, sortOption]);

  useEffect(() => {
    setIsSearchMedia(false);
    setIsCategoriesOpen(false);
    setIsMenuActive(false);
    setActiveCategory(null);
    if (!["/men-home", "/women-home"].includes(location.pathname)) {
      setSelectedCategory("Категории");
      dispatch(setSortOption("Сортировка"));
      dispatch(setFilterOption(""));
    }
  }, [location.pathname, dispatch]);

  useEffect(() => {
    const city = localStorage.getItem("selectedCity");
    if (city) {
      setSelectedCity(city);
    }
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim() === "") {
        setSearchResults([]);
        return;
      }

      try {
        const response = await axios.get(
          `/products?search=${encodeURIComponent(searchQuery)}&gender=${gender}`
        );
        const filteredResults = response.data
          .filter(
            (product) =>
              product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.brand.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5);
        setSearchResults(filteredResults);
      } catch (err) {
        console.error("Ошибка при поиске товаров:", err);
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, gender]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target)
      ) {
        setIsSearchActive(false);
        setSearchResults([]);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutsideMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideMenu);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideMenu);
    };
  }, []);

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    setIsSearchActive(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchActive(true);
    }
  };

  const toggleCategories = () => {
    setIsCategoriesOpen((prev) => !prev);
    setIsSort(false);
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category); // Set the active category for subcategories
    setSelectedCategory(category.name); // Update the displayed category
    setIsCategoriesOpen(false); // Close the popup
    setIsSort(false);
    dispatch(setFilterOption(category.name)); // Apply category filter
    setSearchParams({
      ...Object.fromEntries(searchParams),
      sort: category.name,
    });
  };

  const handleSubcategorySelect = (subcategory) => {
    setSelectedCategory(subcategory);
    setIsCategoriesOpen(false);
    setIsSort(false);
    dispatch(setFilterOption(subcategory));
    setSearchParams({ ...Object.fromEntries(searchParams), sort: subcategory });
  };

  const handleSortSelect = (option) => {
    dispatch(setSortOption(option));
    setIsSort(false);
    if (option === "Сортировка") {
      const params = Object.fromEntries(searchParams);
      delete params.filter;
      setSearchParams(params);
    } else {
      setSearchParams({ ...Object.fromEntries(searchParams), filter: option });
    }
  };

  const selectNone = () => {
    setSelectedCategory("Категории");
    setIsCategoriesOpen(false);
    setActiveCategory(null);
    dispatch(setSortOption("Сортировка"));
    dispatch(setFilterOption(""));
    setSearchParams({});
  };

  const handleBackClick = () => {
    setActiveCategory(null);
  };

  const hiddenPaths = [
    "/profile",
    "/verification",
    "/checkout",
    "/favorite",
    "/orders",
    "/cart",
  ];
  const isProductPage =
    location.pathname.startsWith("/men-home/product/") ||
    location.pathname.startsWith("/women-home/product/");
  const shouldHide = hiddenPaths.includes(location.pathname) || isProductPage;

  return (
    <>
      <header>
        <div className="header__top">
          <div className="container">
            <div className="header__top-df">
              <div
                className="btn__navigate"
                onClick={() => setIsRegionPopupOpen(true)}
              >
                <img src={navigate} alt="navigate" />
                <p>{selectedCity}</p>
              </div>
              <div className="btn__navigate">
                <p>Сотрудничество с нами</p>
              </div>
            </div>
          </div>
        </div>
        <div className="header__bottom">
          <div className="container">
            <div className="header__bottom-df">
              <nav className="nav_one">
                <NavLink
                  to="/women-home"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Женщинам
                </NavLink>
                <NavLink
                  to="/men-home"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Мужчинам
                </NavLink>
              </nav>
              <Link to="/" className="logo">
                <img src={logo} alt="logo" />
              </Link>
              {user?.email ? (
                <nav className="nav__menu">
                  <Link
                    to="/profile"
                    onMouseEnter={() => setPopupActive(true)}
                    onMouseLeave={() => setPopupActive(false)}
                  >
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.5 11.831l-7 3.669S3 17 3.61 18.606C4.22 20.212 5 20.5 6.5 20.5h11c1.5 0 2.28-.29 2.89-1.895C21 17 21.5 15.5 21.5 15.5l-7-3.669m2.668 1.399C16 14.7 13.923 15.5 12.02 15.5a7.12 7.12 0 0 1-3.32-.8M17 7.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0z"
                        stroke="#000"
                      ></path>
                    </svg>
                    <p>Профиль</p>
                    {popupActive && <PopupData user={user} />}
                  </Link>
                  <Link to="/favorite">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        clipRule="evenodd"
                        d="M12 7.5h.5c0-2.026 2.194-4 4.44-4 3.024 0 4.56 2.412 4.56 5.262C21.5 15.894 12 20.5 12 20.5S2.5 15.894 2.5 8.762C2.5 5.912 4.036 3.5 7.06 3.5c2.246 0 4.44 1.974 4.44 4h.5z"
                        stroke="#000"
                      ></path>
                    </svg>
                    <p>Избранное</p>
                  </Link>
                  <Link to="/cart">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18.5 2.5h-13L3.747 18.28a2 2 0 0 0 1.988 2.22h12.53a2 2 0 0 0 1.988-2.22L18.5 2.5z"
                        stroke="#000"
                      ></path>
                      <path
                        d="M15.5 9a3.5 3.5 0 1 1-7 0m0-2V5m7 2V5"
                        stroke="#000"
                      ></path>
                    </svg>
                    <p>Корзина</p>
                  </Link>
                </nav>
              ) : (
                <nav className="nav__menu">
                  <Link>
                    <p
                      onClick={() => setIsPopupAuth(true)}
                      className="auth__popup_run"
                    >
                      Войти
                    </p>
                  </Link>
                  <Link to="/favorite">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        clipRule="evenodd"
                        d="M12 7.5h.5c0-2.026 2.194-4 4.44-4 3.024 0 4.56 2.412 4.56 5.262C21.5 15.894 12 20.5 12 20.5S2.5 15.894 2.5 8.762C2.5 5.912 4.036 3.5 7.06 3.5c2.246 0 4.44 1.974 4.44 4h.5z"
                        stroke="#000"
                      ></path>
                    </svg>
                    <p>Избранное</p>
                  </Link>
                </nav>
              )}
            </div>

            <div className="header__media-mobile">
              <div className="header__bottom-df_media">
                <nav className="nav_one">
                  <img
                    src={menu}
                    alt="menu"
                    onClick={() => setIsMenuActive(true)}
                  />
                  <img
                    src={searchHeader}
                    onClick={() => setIsSearchMedia(!isSearchMedia)}
                    alt="searchHeader"
                  />
                </nav>

                <Link to="/">
                  <img src={logo} alt="logo" className="logo" />
                </Link>

                <nav className="nav_two">
                  <Link to="/favorite">
                    <img src={favorite} alt="favorite" />
                  </Link>
                  <Link to="/cart">
                    <img src={cart} alt="cart" />
                  </Link>
                </nav>
              </div>

              {isMenuActive && (
                <div className="menu__left_media" ref={menuRef}>
                  <div className="content__menu_left">
                    <div className="content__menu_left__head">
                      <Link to="/">Главная</Link>
                      <Link to="/profile">Мои данные</Link>
                      <Link to="/orders">Мои Заказы</Link>
                      <Link
                        to="/men-home"
                        onClick={() => setIsMenuActive(false)}
                      >
                        Для мужчин
                      </Link>
                      <Link
                        to="/women-home"
                        onClick={() => setIsMenuActive(false)}
                      >
                        Для женщин
                      </Link>
                      <Link to="/">Сотрудничество с нами</Link>
                      <Link to="/profile">
                        Ваш регион доставки -{" "}
                        <span>{user?.address || "Не указан"}</span>
                      </Link>
                      {user?.city ? (
                        <Link to="/profile">{user?.city}</Link>
                      ) : null}
                    </div>

                    <div className="content__menu_left__foot">
                      {user?.email ? (
                        <div className="popupData__head">
                          <div className="avatar">
                            {user?.username
                              ? user.username.charAt(0).toUpperCase()
                              : ""}
                          </div>
                          <div className="infouser">
                            <p>{user?.username}</p>
                            <span>{user?.email}</span>
                          </div>
                        </div>
                      ) : null}
                      {user?.email ? (
                        <Link onClick={handleLogout}>Выйти</Link>
                      ) : (
                        <Link onClick={() => setIsPopupAuth(true)}>Войти</Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isSearchMedia && (
                <div className="header__categ_search">
                  <form
                    onSubmit={handleSearchSubmit}
                    className="header__categ_search-inp"
                  >
                    <input
                      type="text"
                      placeholder="Введите название товара или бренда"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                    />
                    <button>Найти</button>
                  </form>
                  {isSearchActive && searchResults.length > 0 && (
                    <div className="search__results" ref={searchResultsRef}>
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          to={`/${currentGender}-home/product/${product.id}`}
                          className="search__result-item"
                        >
                          <img
                            src={product.images?.[0]?.mainUrl}
                            alt={product.title}
                            className="search__result-image"
                          />
                          <div className="search__result-info">
                            <p>{product.brand}</p>
                            <p>{product.title}</p>
                            <p>{product.newPrice} ₽</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {["/favorite", "/cart", "/men-home", "/women-home"].includes(
                location.pathname
              ) && (
                <div className="header__text-df_media">
                  {location.pathname === "/favorite" ? (
                    <p>Избранное</p>
                  ) : location.pathname === "/cart" ? (
                    <p>Корзина</p>
                  ) : (
                    <>
                      <Link
                        to={`/${
                          currentGender === "men" ? "women" : "men"
                        }-home`}
                        className="gender-switch"
                      >
                        {currentGender === "men"
                          ? "Мужские товары"
                          : "Женские товары"}
                      </Link>
                    </>
                  )}
                </div>
              )}

              {["/men-home", "/women-home"].includes(location.pathname) && (
                <div className="categ__main_media">
                  <div className="header__categ_filter">
                    <p onClick={toggleCategories}>
                      <img
                        src={bottom}
                        style={{ height: "7px" }}
                        alt="bottom"
                      />
                      {selectedCategory}
                    </p>
                    <p onClick={() => setIsSort(!isSort)}>
                      <img src={filter} alt="filter" />
                      {sortOption}
                      {isSort && (
                        <div className="sort__media">
                          {sortOptions.map((option) => (
                            <p
                              key={option}
                              onClick={() => handleSortSelect(option)}
                              className={sortOption === option ? "active" : ""}
                            >
                              {option}
                            </p>
                          ))}
                        </div>
                      )}
                    </p>
                  </div>
                  {isCategoriesOpen && (
                    <div className="categories__list_media">
                      {activeCategory && activeCategory.subcategories ? (
                        <>
                          <div className="header__categ_filter">
                            <Link onClick={handleBackClick}>Назад</Link>
                          </div>
                          {activeCategory.subcategories.map(
                            (subcategory, index) => (
                              <div className="header__categ_filter" key={index}>
                                <Link
                                  to={`?sort=${subcategory}`}
                                  onClick={() =>
                                    handleSubcategorySelect(subcategory)
                                  }
                                >
                                  {subcategory}
                                </Link>
                              </div>
                            )
                          )}
                        </>
                      ) : (
                        <>
                          <div className="header__categ_filter">
                            <Link onClick={selectNone}>Все категории</Link>
                          </div>
                          {categoriesData.map((categ, index) => (
                            <div className="header__categ_filter" key={index}>
                              <Link
                                to={`?sort=${categ.name}`}
                                onClick={() => handleCategoryClick(categ)}
                                className="category-button"
                              >
                                {categ.name}
                              </Link>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {!shouldHide && (
          <>
            <div className="header__navlinks">
              <div className="container">
                <div className="header__navlinks-df">
                  <div className="navlinks_left">
                    {categoriesData.slice(0, 7).map((categ, index) => (
                      <Link
                        to={`?sort=${categ.name}`}
                        key={index}
                        onClick={() => handleCategoryClick(categ)}
                      >
                        {categ.name}
                      </Link>
                    ))}
                  </div>
                  <Search
                    searchRef={searchRef}
                    handleSearchSubmit={handleSearchSubmit}
                    searchQuery={searchQuery}
                    handleSearchInputChange={handleSearchInputChange}
                    search={search}
                    isSearchActive={isSearchActive}
                    searchResults={searchResults}
                    setSearchQuery={setSearchQuery}
                    setSearchResults={setSearchResults}
                    setIsSearchActive={setIsSearchActive}
                  />
                </div>
              </div>
            </div>

            <div className="header__breadcrumbs">
              <div className="container">
                <div className="header__breadcrumbs-df">
                  <Link to="/">Главная</Link>
                  <span>/</span>
                  <Link
                    to={`/${currentGender}-home`}
                    onClick={() => selectNone()}
                  >
                    {currentGender === "men" ? "Мужчинам" : "Женщинам"}
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {isPopupAuth && <Auth setIsPopupAuth={setIsPopupAuth} />}
      <RegionPopup
        isOpen={isRegionPopupOpen}
        onClose={() => setIsRegionPopupOpen(false)}
      />
    </>
  );
};

export default Header;
