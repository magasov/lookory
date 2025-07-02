import React from "react";
import { Link } from "react-router-dom";

const Search = ({
  searchRef,
  handleSearchSubmit,
  searchQuery,
  handleSearchInputChange,
  search,
  isSearchActive,
  searchResults,
  setSearchQuery,
  setSearchResults,
  setIsSearchActive,
}) => {
  return (
    <div className="navlinks_right" ref={searchRef}>
      <form onSubmit={handleSearchSubmit}>
        <input
          type="text"
          className="search__input"
          placeholder="Поиск"
          value={searchQuery}
          onChange={handleSearchInputChange}
        />
        <button type="submit" className="search__btn">
          <img src={search} alt="search" />
        </button>
      </form>
      {isSearchActive && searchResults.length > 0 && (
        <div className="search__results">
          {searchResults.map((product) => (
            <Link
              key={product.id}
              to={`/men-home/product/${product.id}`}
              className="search__result-item"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setIsSearchActive(false);
              }}
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
  );
};

export default Search;
