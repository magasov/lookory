import React, { useRef, useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./index.scss";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Cart = ({ product }) => {
  const sliderRef = useRef(null);
  const lastSwitchTimeRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavoriteHovered, setIsFavoriteHovered] = useState(false);
  const [isInFavorites, setIsInFavorites] = useState(false);

  const images = Array.isArray(product.images)
    ? product.images
        .flatMap((img) => [
          img.mainUrl,
          ...(Array.isArray(img.additionalUrls) ? img.additionalUrls : []),
        ])
        .filter(Boolean)
    : [];

  useEffect(() => {
    const currentFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );
    const isFavorite = currentFavorites.some((item) => item.id === product.id);
    setIsInFavorites(isFavorite);
  }, [product.id]);

  const settings = {
    dots: isHovered && !isFavoriteHovered && images.length > 1,
    infinite: true,
    speed: 200,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    customPaging: (i) => <div className="custom-dot" />,
    dotsClass: "slick-dots custom-dots",
  };

  const handleMouseMove = (e) => {
    if (!sliderRef.current || images.length <= 1) return;

    const now = Date.now();
    const minInterval = 300;
    if (now - lastSwitchTimeRef.current < minInterval) return;

    const { left, width } = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - left;
    const segmentWidth = width / images.length;

    const segmentIndex = Math.floor(mouseX / segmentWidth);

    if (
      images.length % 2 === 1 &&
      Math.abs(mouseX - width / 2) < segmentWidth / 2
    ) {
      const centerIndex = Math.floor(images.length / 2);
      if (sliderRef.current.innerSlider.state.currentSlide !== centerIndex) {
        sliderRef.current.slickGoTo(centerIndex);
        lastSwitchTimeRef.current = now;
      }
    } else if (
      segmentIndex !== sliderRef.current.innerSlider.state.currentSlide
    ) {
      sliderRef.current.slickGoTo(segmentIndex);
      lastSwitchTimeRef.current = now;
    }
  };

  const handleFavoritesAction = (e) => {
    e.preventDefault();
    const defaultVariant = product.images?.[0] || {};
    const defaultColor = defaultVariant.colors?.[0] || null;
    const defaultSize = defaultVariant.sizes?.[0] || null;

    const favoriteItem = {
      id: product.id,
      title: product.title,
      brand: product.brand,
      price: product.newPrice || 0,
      oldPrice: product.oldPrice || 0,
      image: images[0] || "",
      color: defaultColor,
      size: defaultSize,
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

  useEffect(() => {
    return () => {
      lastSwitchTimeRef.current = 0;
    };
  }, []);

  // Calculate discount percentage
  const calculateDiscount = () => {
    if (
      product.oldPrice &&
      product.newPrice &&
      product.oldPrice > product.newPrice
    ) {
      const discount =
        ((product.oldPrice - product.newPrice) / product.oldPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const discount = calculateDiscount();

  return (
    <div className="cart" key={product.id}>
      <Link
        to={`/men-home/product/${product.id}`}
        className="cart__one"
        onMouseMove={images.length > 1 ? handleMouseMove : null}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          if (sliderRef.current) {
            sliderRef.current.slickGoTo(0);
          }
        }}
      >
        {discount > 0 && <div className="discount">-{discount}%</div>}
        {images.length > 1 ? (
          <Slider {...settings} ref={sliderRef}>
            {images.map((img, index) => (
              <div className="slider__cart" key={index}>
                <img src={img} alt={`${product.title}-${index}`} />
              </div>
            ))}
          </Slider>
        ) : images.length === 1 ? (
          <img src={images[0]} alt={product.title} />
        ) : (
          <div className="no-image">Нет изображения</div>
        )}
        <div
          className="favorite"
          onMouseEnter={() => setIsFavoriteHovered(true)}
          onMouseLeave={() => setIsFavoriteHovered(false)}
          onClick={handleFavoritesAction}
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
              fill={isInFavorites ? "#FF0000" : "white"}
              stroke={isInFavorites ? "#FF0000" : "black"}
            />
          </svg>
        </div>
      </Link>
      <div className="cart__two">
        <div className="prices">
          <span className="line-through">{product.oldPrice} ₽</span>
          <p>{product.newPrice} ₽</p>
        </div>
        <div className="brandandname">
          <p className="brand">{product.brand}</p>
          <p className="name">{product.title}</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;
