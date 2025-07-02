import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../axios";

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async ({ sortBy, order, gender }, { rejectWithValue }) => {
    try {
      const response = await axios.get("/products", {
        params: { sortBy, order, gender },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue("Не удалось загрузить продукты");
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    filteredProducts: [],
    displayedProducts: [],
    sortOption: "Сортировка",
    filterOption: "",
    gender: "", // Добавляем gender в состояние
    page: 1,
    productsPerPage: 40,
    isLoading: false,
    isLoadingMore: false,
    error: null,
  },
  reducers: {
    setSortOption: (state, action) => {
      state.sortOption = action.payload;
      state.page = 1;

      // Применяем сортировку на клиенте
      let sortedProducts = [...state.filteredProducts];
      switch (action.payload) {
        case "Сначала дороже":
          sortedProducts.sort((a, b) => b.newPrice - a.newPrice);
          break;
        case "Сначала дешевле":
          sortedProducts.sort((a, b) => a.newPrice - b.newPrice);
          break;
        case "Новинки":
        default:
          sortedProducts.sort((a, b) => b.id - a.id);
          break;
      }
      state.filteredProducts = sortedProducts;
      state.displayedProducts = sortedProducts.slice(0, state.productsPerPage);
    },
    setFilterOption: (state, action) => {
      state.filterOption = action.payload;
      state.page = 1;
    },
    setGender: (state, action) => {
      state.gender = action.payload;
      state.page = 1;
    },
    loadMoreProducts: (state) => {
      state.isLoadingMore = true;
      state.page += 1;
      const newDisplayed = state.filteredProducts.slice(
        0,
        state.page * state.productsPerPage
      );
      state.displayedProducts = newDisplayed;
      state.isLoadingMore = false;
    },
    setFilteredProducts: (state, action) => {
      const { filterOption, gender } = action.payload;
      let filtered = [...state.products];

      // Фильтрация по gender
      if (gender) {
        filtered = filtered.filter(
          (product) => product.gender.toLowerCase() === gender.toLowerCase()
        );
      }

      // Фильтрация по категориям
      if (filterOption) {
        filtered = filtered.filter((product) =>
          product.categories.some(
            (category) =>
              category.name === filterOption ||
              category.subcategories.includes(filterOption)
          )
        );
      }

      // Применяем сортировку после фильтрации
      switch (state.sortOption) {
        case "Сначала дороже":
          filtered.sort((a, b) => b.newPrice - a.newPrice);
          break;
        case "Сначала дешевле":
          filtered.sort((a, b) => a.newPrice - b.newPrice);
          break;
        case "Новинки":
        default:
          filtered.sort((a, b) => b.id - a.id);
          break;
      }

      state.filteredProducts = filtered;
      state.displayedProducts = filtered.slice(0, state.productsPerPage);
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
        state.filteredProducts = action.payload;
        state.displayedProducts = action.payload.slice(
          0,
          state.productsPerPage
        );
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSortOption,
  setFilterOption,
  setGender,
  loadMoreProducts,
  setFilteredProducts,
} = productsSlice.actions;
export default productsSlice.reducer;
