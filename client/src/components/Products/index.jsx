import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchProducts,
  loadMoreProducts,
  setFilteredProducts,
  setFilterOption,
  setGender,
} from "../../slices/productsSlice";
import { useLocation } from "react-router-dom";
import "./style.scss";
import Cart from "../Cart";
import Skeleton from "../Skeleton";

const Products = ({ sortOption, gender }) => {
  const dispatch = useDispatch();
  const {
    products,
    filteredProducts,
    displayedProducts,
    filterOption,
    page,
    productsPerPage,
    isLoading,
    isLoadingMore,
    error,
  } = useSelector((state) => state.products);
  const location = useLocation();
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false);

  useEffect(() => {
    let sortBy = "id";
    let order = "DESC";

    switch (sortOption) {
      case "Новинки":
        sortBy = "id";
        order = "DESC";
        break;
      case "Сначала дороже":
        sortBy = "newPrice";
        order = "DESC";
        break;
      case "Сначала дешевле":
        sortBy = "newPrice";
        order = "ASC";
        break;
      case "Сортировка":
      default:
        sortBy = "id";
        order = "DESC";
        break;
    }

    // Обновляем gender в сторе
    dispatch(setGender(gender));

    // Запрашиваем товары с сортировкой и фильтрацией по gender
    dispatch(fetchProducts({ sortBy, order, gender }));
  }, [sortOption, gender, dispatch]);

  useEffect(() => {
    // Обновляем фильтрованные товары при изменении filterOption или gender
    dispatch(setFilteredProducts({ filterOption, gender }));
  }, [filterOption, products, gender, dispatch]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sort = searchParams.get("sort");
    if (sort !== filterOption) {
      dispatch(setFilterOption(sort || ""));
    }
  }, [location.search, filterOption, dispatch]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !isLoadingMore) {
          dispatch(loadMoreProducts());
          setShowLoadMoreButton(false);
        }
      },
      { threshold: 0.1 }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [dispatch, isLoading, isLoadingMore]);

  useEffect(() => {
    if (
      loadMoreRef.current &&
      !isLoading &&
      !isLoadingMore &&
      displayedProducts.length < filteredProducts.length
    ) {
      observerRef.current.observe(loadMoreRef.current);

      const timeout = setTimeout(() => {
        setShowLoadMoreButton(true);
      }, 5000);

      return () => {
        clearTimeout(timeout);
        if (loadMoreRef.current && observerRef.current) {
          observerRef.current.unobserve(loadMoreRef.current);
        }
      };
    }
  }, [isLoading, isLoadingMore, displayedProducts, filteredProducts]);

  const handleLoadMore = () => {
    dispatch(loadMoreProducts());
    setShowLoadMoreButton(false);
  };

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (isLoading || products.length === 0) {
    return (
      <div className="products">
        {Array(8)
          .fill()
          .map((_, index) => (
            <Skeleton key={index} />
          ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="products">
        {/* {Array(8)
          .fill()
          .map((_, index) => (
            <Skeleton key={index} />
          ))} */}
        Товары в данной категории не найдены.
      </div>
    );
  }

  return (
    <div className="products">
      {displayedProducts.map((product) => (
        <div key={product.id} className="product-item">
          <Cart product={product} />
        </div>
      ))}

      {isLoadingMore && (
        <div className="products">
          {Array(8)
            .fill()
            .map((_, index) => (
              <Skeleton key={`loading-${index}`} />
            ))}
        </div>
      )}

      {displayedProducts.length < filteredProducts.length && (
        <>
          <div ref={loadMoreRef} className="h-10"></div>
          {showLoadMoreButton && !isLoadingMore && (
            <div className="text-center mt-4">
              <button onClick={handleLoadMore} disabled={isLoadingMore}>
                Загрузить еще
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
