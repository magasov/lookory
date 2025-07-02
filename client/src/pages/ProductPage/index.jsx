import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "../../axios";
import { Toaster, toast } from "sonner";
import { Helmet } from "react-helmet-async";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import "./style.scss";
import left from "../../assets/icon/left.svg";
import right from "../../assets/icon/right.svg";
import Cart from "../../components/Cart";

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isInCart, setIsInCart] = useState(false);
  const [cartItemId, setCartItemId] = useState(null);
  const [isInFavorites, setIsInFavorites] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/product/${id}`);
        setProduct(response.data);
        setError(null);

        if (response.data.images && response.data.images.length > 0) {
          setSelectedVariant(response.data.images[0]);
          if (response.data.images[0].colors?.length > 0) {
            setSelectedColor(response.data.images[0].colors[0]);
          }
          if (response.data.images[0].sizes?.length > 0) {
            setSelectedSize(response.data.images[0].sizes[0]);
          }
        }
      } catch (err) {
        setError("Не удалось загрузить товар");
        console.error(err);
      }
    };
    window.scrollTo(0, 0);
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const checkCart = async () => {
      const token = localStorage.getItem("token");
      if (
        !token ||
        !product ||
        !selectedVariant ||
        !selectedColor ||
        !selectedSize
      ) {
        setIsInCart(false);
        setCartItemId(null);
        return;
      }

      try {
        const response = await axios.get("/api/cart");
        const cartItems = response.data.items || [];
        const cartItem = cartItems.find(
          (item) =>
            item.productId === product.id &&
            item.variant.id === selectedVariant.id &&
            item.color === selectedColor &&
            item.size === selectedSize
        );
        setIsInCart(!!cartItem);
        setCartItemId(cartItem ? cartItem.id : null);
      } catch (err) {
        console.error("Ошибка при проверке корзины:", err);
        setIsInCart(false);
        setCartItemId(null);
      }
    };

    checkCart();
  }, [product, selectedVariant, selectedColor, selectedSize]);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        let url = "/products";
        if (product?.categories?.length > 0) {
          const category = product.categories[0].name;
          url += `?category=${encodeURIComponent(category)}`;
        }

        const response = await axios.get(url);
        const allProducts = response.data.filter((p) => p.id !== parseInt(id));
        const shuffled = allProducts.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);
        setSimilarProducts(selected);
      } catch (err) {
        console.error("Не удалось загрузить похожие товары", err);
      }
    };

    if (product) {
      fetchSimilarProducts();
    }
  }, [product, id]);

  const handleCartAction = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error(
        "Пожалуйста, войдите в аккаунт, чтобы добавить товар в корзину."
      );
      return;
    }

    if (!selectedVariant || !selectedColor || !selectedSize) {
      toast.error("Пожалуйста, выберите вариант, цвет и размер");
      return;
    }

    try {
      if (isInCart) {
        await axios.delete(`/api/cart/${cartItemId}`);
        setIsInCart(false);
        setCartItemId(null);
        toast.success("Товар удален из корзины!");
      } else {
        const cartItem = {
          productId: product.id,
          variantId: selectedVariant.id,
          color: selectedColor,
          size: selectedSize,
          quantity: 1,
        };

        await axios.post("/api/cart", cartItem);
        setIsInCart(true);

        const response = await axios.get("/api/cart");
        const cartItems = response.data.items || [];
        const newCartItem = cartItems.find(
          (item) =>
            item.productId === product.id &&
            item.variant.id === selectedVariant.id &&
            item.color === selectedColor &&
            item.size === selectedSize
        );
        setCartItemId(newCartItem ? newCartItem.id : null);
        toast.success("Товар добавлен в корзину!");
      }
    } catch (err) {
      console.error("Ошибка при работе с корзиной:", err);
      toast.error(
        err.response?.data?.message || "Ошибка при работе с корзиной"
      );
    }
  };

  const handleFavoritesAction = () => {
    if (!selectedVariant || !selectedColor || !selectedSize) {
      toast.error("Пожалуйста, выберите вариант, цвет и размер");
      return;
    }

    const favoriteItem = {
      id: product.id,
      title: product.title,
      brand: product.brand,
      price: product.newPrice || 0,
      oldPrice: product.oldPrice || 0,
      image: selectedVariant.mainUrl || "",
      color: selectedColor,
      size: selectedSize,
    };

    const currentFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );

    if (isInFavorites) {
      const updatedFavorites = currentFavorites.filter(
        (item) =>
          !(
            item.id === favoriteItem.id &&
            item.color === favoriteItem.color &&
            item.size === favoriteItem.size
          )
      );
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
      setIsInFavorites(false);
      toast.success("Товар удален из избранного!");
    } else {
      currentFavorites.push(favoriteItem);
      localStorage.setItem("favorites", JSON.stringify(currentFavorites));
      setIsInFavorites(true);
      toast.success("Товар добавлен в избранное!");
    }
  };

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  if (!product) {
    return (
      <div>
        <p>Загрузка...</p>
      </div>
    );
  }

  const availableColors = selectedVariant?.colors || [];
  const availableSizes = selectedVariant?.sizes || [];
  const allImages = selectedVariant
    ? [selectedVariant.mainUrl, ...(selectedVariant.additionalUrls || [])]
    : [];

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setSelectedColor(variant.colors?.[0] || null);
    setSelectedSize(variant.sizes?.[0] || null);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
  };

  const pageTitle = `${product.brand} ${product.title} - Купить за ${product.newPrice} ₽`;
  const pageDescription = `Купите ${product.brand} ${product.title} за ${
    product.newPrice
  } ₽. ${
    product.description || "Качественный товар с доставкой по всей России."
  }`;
  const canonicalUrl = `${window.location.origin}/men-home/product/${id}`;
  const ogImage = selectedVariant?.mainUrl || "";

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    prevArrow: <img src={left} alt="left" className="slider-arrow" />,
    nextArrow: <img src={right} alt="right" className="slider-arrow" />,
  };

  return (
    <div className="container">
      <>
        <Helmet>
          <title>{pageTitle}</title>
          <meta name="description" content={pageDescription} />
          <meta
            name="keywords"
            content={`${product.brand}, ${product.title}, ${
              product.categories?.[0]?.name || "товар"
            }, купить, цена`}
          />
          <link rel="canonical" href={canonicalUrl} />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta property="og:image" content={ogImage} />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:type" content="product" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDescription} />
          <meta name="twitter:image" content={ogImage} />
        </Helmet>
        <Toaster position="top-center" richColors />
        <div className="productPage">
          <div className="productPage__left">
            <div className="productPage__image-all">
              {selectedVariant?.mainUrl ? (
                <div className="productPage__image-all-div">
                  <div className="productPage__image-main">
                    <img
                      src={selectedVariant.mainUrl}
                      alt={`${product.title}-main`}
                      onClick={() => handleImageClick(0)}
                      style={{ cursor: "zoom-in" }}
                    />
                    {selectedVariant.additionalUrls?.length > 0 && (
                      <img
                        src={selectedVariant.additionalUrls[0]}
                        alt={`${product.title}-additional-0`}
                        onClick={() => handleImageClick(1)}
                        style={{ cursor: "zoom-in" }}
                      />
                    )}
                  </div>
                  {selectedVariant.additionalUrls?.length > 1 && (
                    <div className="productPage__image-secondary">
                      {selectedVariant.additionalUrls
                        .slice(1, 5)
                        .map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`${product.title}-additional-${index + 1}`}
                            onClick={() => handleImageClick(index + 2)}
                            style={{ cursor: "zoom-in" }}
                          />
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>Нет изображения</div>
              )}
            </div>
            <div className="infoData">
              <h3>О товаре</h3>
              <p>{product.description || "Описание отсутствует"}</p>
              <div className="infoData_all">
                <div className="infoData_all-one">
                  <p>Бренд</p>
                  <span className="ellips"></span>
                  <p>{product.brand || "Не указано"}</p>
                </div>
                <div className="infoData_all-one">
                  <p>Артикул</p>
                  <span className="ellips"></span>
                  <p>{product.article || "Не указано"}</p>
                </div>
                <div className="infoData_all-one">
                  <p>Произведено</p>
                  <span className="ellips"></span>
                  <p>{product.country || "Не указано"}</p>
                </div>
                <div className="infoData_all-one">
                  <p>Качество</p>
                  <span className="ellips"></span>
                  <p>{product.quality || "Не указано"}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="productPage__left__media">
            {allImages.length > 0 ? (
              <Slider {...sliderSettings}>
                {allImages.map((url, index) => (
                  <div key={index}>
                    <img
                      src={url}
                      alt={`${product.title}-slide-${index}`}
                      className="slider-image"
                      onClick={() => handleImageClick(index)}
                    />
                  </div>
                ))}
              </Slider>
            ) : (
              <div>Нет изображений </div>
            )}
          </div>
          <div className="productPage__right">
            <div className="productPage__right-head">
              <h3>{product.brand}</h3>
              <span>{product.title}</span>
            </div>

            <div className="prices">
              <span className="line-through">{product.oldPrice} ₽</span>
              <p>{product.newPrice} ₽</p>
            </div>
            {product.images.length > 0 && (
              <div className="select__product-one">
                {product.images.map((variant, index) => (
                  <img
                    key={index}
                    onClick={() => handleVariantChange(variant)}
                    className={
                      selectedVariant?.id === variant.id
                        ? "img__active-select"
                        : ""
                    }
                    width={100}
                    src={variant.mainUrl}
                    alt={`Variant ${index}`}
                  />
                ))}
              </div>
            )}
            {availableColors.length > 0 && (
              <div className="size__select">
                <h3>Цвет</h3>
                <div className="size__select-btns">
                  {availableColors.map((color) => (
                    <button
                      className={
                        selectedColor === color ? "size__select-active" : ""
                      }
                      key={color}
                      onClick={() => handleColorChange(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {availableSizes.length > 0 && (
              <div className="size__select">
                <h3>Размер</h3>
                <div className="size__select-btns">
                  {availableSizes.map((size) => (
                    <button
                      className={
                        selectedSize === size ? "size__select-active" : ""
                      }
                      key={size}
                      onClick={() => handleSizeChange(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="product__btns">
              <button onClick={handleCartAction}>
                {isInCart ? "Удалить из корзины" : "Добавить в корзину"}
              </button>
              <button onClick={handleFavoritesAction}>
                {isInFavorites ? (
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
                      fill="#f93c00"
                      stroke="#f93c00"
                    />
                  </svg>
                ) : (
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
                      fill="white"
                      stroke="black"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        {isFullScreen && (
          <div className="fullscreen-slider">
            <div className="fullscreen-slider__content">
              <button
                className="fullscreen-slider__close"
                onClick={handleCloseFullScreen}
              >
                ×
              </button>
              <button
                className="fullscreen-slider__arrow fullscreen-slider__arrow--left"
                onClick={handlePrevImage}
              >
                <img src={left} alt="left" />
              </button>
              <img
                src={allImages[currentImageIndex]}
                alt={`${product.title}-fullscreen-${currentImageIndex}`}
                className="fullscreen-slider__image"
              />
              <button
                className="fullscreen-slider__arrow fullscreen-slider__arrow--right"
                onClick={handleNextImage}
              >
                <img src={right} alt="right" />
              </button>
            </div>
          </div>
        )}
        {similarProducts.length > 0 && (
          <div className="similar-products">
            <h3>Рекомендуем посмотреть</h3>
            <div className="products">
              {similarProducts.map((similarProduct) => (
                <Cart key={similarProduct.id} product={similarProduct} />
              ))}
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default ProductPage;
