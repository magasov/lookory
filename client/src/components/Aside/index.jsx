import React, { useState, useEffect } from "react";
import axios from "../../axios";
import arrowIcon from "../../assets/icon/bottom.svg";
import { useSearchParams, useLocation } from "react-router-dom";
import "./style.scss";

const Aside = () => {
  const [categoriesData, setCategoriesData] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);
  const [activeItem, setActiveItem] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

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

  useEffect(() => {
    localStorage.setItem("openCategory", openCategory || "");
    localStorage.setItem("activeItem", activeItem);
  }, [openCategory, activeItem]);

  const toggleCategory = (category) => {
    if (openCategory === category) {
      setOpenCategory(null);
      setActiveItem("");
      const filter = searchParams.get("filter");
      setSearchParams(filter ? { filter } : {});
    } else {
      setOpenCategory(category);
      setActiveItem(category);
      setSearchParams({
        ...Object.fromEntries(searchParams),
      });
    }
  };

  const handleSubcategoryClick = (subcategory) => {
    if (activeItem === subcategory) {
      setActiveItem("");
      const filter = searchParams.get("filter");
      setSearchParams(filter ? { filter } : {});
    } else {
      setActiveItem(subcategory);
      setSearchParams({
        ...Object.fromEntries(searchParams),
        sort: subcategory,
      });
    }
  };

  const handleCategoryClick = (category) => {
    if (activeItem === category) {
      setActiveItem("");
      const filter = searchParams.get("filter");
      setSearchParams(filter ? { filter } : {});
    } else {
      setActiveItem(category);
      setSearchParams({
        ...Object.fromEntries(searchParams),
        sort: category,
      });
    }
  };

  return (
    <aside>
      {categoriesData.length > 0 ? (
        categoriesData.map((category) => (
          <div className="aside_select" key={category.name}>
            <div>
              <p
                className={`select_text ${
                  activeItem === category.name ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(category.name)}
              >
                {category.name}
              </p>
              <img
                src={arrowIcon}
                onClick={() => toggleCategory(category.name)}
                alt="Toggle category"
                className="arrow"
                style={{
                  transform:
                    openCategory === category.name
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                }}
              />
            </div>
            <div
              className={`categories ${
                openCategory === category.name ? "open" : ""
              }`}
            >
              {category.subcategories.map((subcategory) => (
                <p
                  key={subcategory}
                  className={`subcategory ${
                    activeItem === subcategory ? "active" : ""
                  }`}
                  onClick={() => handleSubcategoryClick(subcategory)}
                >
                  {subcategory}
                </p>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p>Нет категорий для {gender}</p>
      )}
    </aside>
  );
};

export default Aside;
