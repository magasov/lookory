import React, { useState, useEffect } from "react";
import axios from "../../axios";
import "./style.scss";

const Admin = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    brand: "",
    quality: "",
    orig: "",
    oldPrice: "",
    newPrice: "",
    country: "",
    categories: [],
    images: [],
    gender: "men",
  });

  const [editProductForm, setEditProductForm] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [genderFilter, setGenderFilter] = useState("all");

  const [categoryForm, setCategoryForm] = useState({
    id: null,
    name: "",
    parentName: "",
    gender: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = genderFilter !== "all" ? `?gender=${genderFilter}` : "";
        const [productsResponse, categoriesResponse, usersResponse] =
          await Promise.all([
            axios.get(`/products${query}`),
            axios.get(`/categories${query}`), // Фильтруем категории по gender
            axios.get("/users"),
          ]);
        setProducts(productsResponse.data);
        setCategories(categoriesResponse.data);
        setUsers(usersResponse.data);
      } catch (err) {
        setError("Не удалось загрузить данные");
        console.error("Ошибка загрузки данных:", err);
      }
    };
    fetchData();
  }, [genderFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditProductInputChange = (e) => {
    const { name, value } = e.target;
    setEditProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: categoryForm.name,
        parentName: categoryForm.parentName || null,
        gender: categoryForm.gender || null, // Добавляем gender
      };
      if (categoryForm.id) {
        await axios.put(`/categories/${categoryForm.id}`, payload);
      } else {
        await axios.post("/categories", payload);
      }
      setCategoryForm({ id: null, name: "", parentName: "", gender: "" });
      const categoriesResponse = await axios.get(
        genderFilter !== "all"
          ? `/categories?gender=${genderFilter}`
          : "/categories"
      );
      setCategories(categoriesResponse.data);
      setError(null);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Не удалось обработать категорию";
      setError(errorMessage);
      console.error("Ошибка обработки категории:", err.response?.data || err);
    }
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      parentName: category.parentName || "",
      gender: category.gender || "",
    });
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Вы уверены, что хотите удалить эту категорию?")) {
      try {
        await axios.delete(`/categories/${id}`);
        const categoriesResponse = await axios.get(
          genderFilter !== "all"
            ? `/categories?gender=${genderFilter}`
            : "/categories"
        );
        setCategories(categoriesResponse.data);
        setError(null);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Не удалось удалить категорию";
        setError(errorMessage);
        console.error("Ошибка удаления категории:", err.response?.data || err);
      }
    }
  };

  const addCategory = () => {
    setFormData((prev) => ({
      ...prev,
      categories: [...prev.categories, { name: "", subcategories: [""] }],
    }));
  };

  const handleProductCategoryChange = (categoryIndex, field, value) => {
    const newCategories = [...formData.categories];
    newCategories[categoryIndex][field] = value;
    setFormData((prev) => ({ ...prev, categories: newCategories }));
  };

  const handleSubcategoryChange = (categoryIndex, subIndex, value) => {
    const newCategories = [...formData.categories];
    newCategories[categoryIndex].subcategories[subIndex] = value;
    setFormData((prev) => ({ ...prev, categories: newCategories }));
  };

  const addSubcategory = (categoryIndex) => {
    const newCategories = [...formData.categories];
    newCategories[categoryIndex].subcategories.push("");
    setFormData((prev) => ({ ...prev, categories: newCategories }));
  };

  const removeSubcategory = (categoryIndex, subIndex) => {
    const newCategories = [...formData.categories];
    newCategories[categoryIndex].subcategories = newCategories[
      categoryIndex
    ].subcategories.filter((_, i) => i !== subIndex);
    if (newCategories[categoryIndex].subcategories.length === 0) {
      newCategories[categoryIndex].subcategories.push("");
    }
    setFormData((prev) => ({ ...prev, categories: newCategories }));
  };

  const removeCategory = (index) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  };

  const addImage = () => {
    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          mainFile: null,
          mainUrl: "",
          additionalFiles: [null],
          additionalUrls: [],
          sizes: [""],
          colors: [""],
        },
      ],
    }));
  };

  const handleMainFileChange = (imageIndex, e) => {
    const file = e.target.files[0];
    if (file) {
      const newImages = [...formData.images];
      newImages[imageIndex].mainFile = file;
      setFormData((prev) => ({ ...prev, images: newImages }));
    }
  };

  const handleAdditionalFileChange = (imageIndex, additionalIndex, e) => {
    const file = e.target.files[0];
    if (file) {
      const newImages = [...formData.images];
      newImages[imageIndex].additionalFiles[additionalIndex] = file;
      setFormData((prev) => ({ ...prev, images: newImages }));
    }
  };

  const addAdditionalImageField = (imageIndex) => {
    const newImages = [...formData.images];
    newImages[imageIndex].additionalFiles.push(null);
    newImages[imageIndex].additionalUrls.push("");
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const removeAdditionalFile = (imageIndex, additionalIndex) => {
    const newImages = [...formData.images];
    newImages[imageIndex].additionalFiles = newImages[
      imageIndex
    ].additionalFiles.filter((_, i) => i !== additionalIndex);
    newImages[imageIndex].additionalUrls = newImages[
      imageIndex
    ].additionalUrls.filter((_, i) => i !== additionalIndex);
    if (newImages[imageIndex].additionalFiles.length === 0) {
      newImages[imageIndex].additionalFiles.push(null);
      newImages[imageIndex].additionalUrls.push("");
    }
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const handleImageArrayChange = (imageIndex, field, arrayIndex, value) => {
    const newImages = [...formData.images];
    newImages[imageIndex][field][arrayIndex] = value;
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const addImageArrayItem = (imageIndex, field) => {
    const newImages = [...formData.images];
    newImages[imageIndex][field].push("");
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const removeImageArrayItem = (imageIndex, field, arrayIndex) => {
    const newImages = [...formData.images];
    newImages[imageIndex][field] = newImages[imageIndex][field].filter(
      (_, i) => i !== arrayIndex
    );
    if (newImages[imageIndex][field].length === 0) {
      newImages[imageIndex][field].push("");
    }
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return [];
    const uploadFormData = new FormData();
    files.forEach((file) => {
      if (file) uploadFormData.append("files", file);
    });
    try {
      const response = await axios.post("/upload", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.fileUrls;
    } catch (err) {
      throw new Error("Ошибка при загрузке файлов");
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedImages = await Promise.all(
        formData.images.map(async (image) => {
          const filesToUpload = [];
          if (image.mainFile) filesToUpload.push(image.mainFile);
          image.additionalFiles.forEach((file) => {
            if (file) filesToUpload.push(file);
          });
          const uploadedUrls = await uploadFiles(filesToUpload);
          return {
            mainUrl: image.mainFile ? uploadedUrls.shift() : "",
            additionalUrls: uploadedUrls,
            sizes: image.sizes.filter((size) => size),
            colors: image.colors.filter((color) => color),
          };
        })
      );

      const filteredCategories = formData.categories
        .filter(
          (cat) =>
            cat.name &&
            cat.subcategories.length > 0 &&
            cat.subcategories.every((sub) => sub)
        )
        .map((cat) => ({
          name: cat.name,
          subcategories: cat.subcategories.filter((sub) => sub),
        }));

      const response = await axios.post("/products", {
        ...formData,
        categories: filteredCategories,
        images: updatedImages.filter((img) => img.mainUrl),
      });

      setProducts((prev) => [...prev, response.data.product]);
      setFormData({
        title: "",
        description: "",
        brand: "",
        quality: "",
        orig: "",
        oldPrice: "",
        newPrice: "",
        country: "",
        categories: [],
        images: [],
        gender: "men",
      });
      const categoriesResponse = await axios.get(
        genderFilter !== "all"
          ? `/categories?gender=${genderFilter}`
          : "/categories"
      );
      setCategories(categoriesResponse.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось создать продукт");
      console.error(err);
    }
  };

  const handleEditProduct = (product) => {
    setEditProductForm({
      id: product.id,
      title: product.title,
      description: product.description,
      brand: product.brand,
      quality: product.quality,
      orig: product.orig,
      oldPrice: product.oldPrice,
      newPrice: product.newPrice,
      country: product.country,
      categories: product.categories.map((cat) => ({
        name: cat.name,
        subcategories: cat.subcategories || [],
      })),
      images: product.images.map((img) => ({
        mainFile: null,
        mainUrl: img.mainUrl,
        additionalFiles: img.additionalUrls.map(() => null),
        additionalUrls: img.additionalUrls,
        sizes: img.sizes || [""],
        colors: img.colors || [""],
      })),
      gender: product.gender || "men",
    });
  };

  const handleEditProductCategoryChange = (categoryIndex, field, value) => {
    const newCategories = [...editProductForm.categories];
    newCategories[categoryIndex][field] = value;
    setEditProductForm((prev) => ({ ...prev, categories: newCategories }));
  };

  const handleEditSubcategoryChange = (categoryIndex, subIndex, value) => {
    const newCategories = [...editProductForm.categories];
    newCategories[categoryIndex].subcategories[subIndex] = value;
    setEditProductForm((prev) => ({ ...prev, categories: newCategories }));
  };

  const addEditSubcategory = (categoryIndex) => {
    const newCategories = [...editProductForm.categories];
    newCategories[categoryIndex].subcategories.push("");
    setEditProductForm((prev) => ({ ...prev, categories: newCategories }));
  };

  const removeEditSubcategory = (categoryIndex, subIndex) => {
    const newCategories = [...editProductForm.categories];
    newCategories[categoryIndex].subcategories = newCategories[
      categoryIndex
    ].subcategories.filter((_, i) => i !== subIndex);
    if (newCategories[categoryIndex].subcategories.length === 0) {
      newCategories[categoryIndex].subcategories.push("");
    }
    setEditProductForm((prev) => ({ ...prev, categories: newCategories }));
  };

  const addEditCategory = () => {
    setEditProductForm((prev) => ({
      ...prev,
      categories: [...prev.categories, { name: "", subcategories: [""] }],
    }));
  };

  const removeEditCategory = (index) => {
    setEditProductForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  };

  const addEditImage = () => {
    setEditProductForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          mainFile: null,
          mainUrl: "",
          additionalFiles: [null],
          additionalUrls: [],
          sizes: [""],
          colors: [""],
        },
      ],
    }));
  };

  const handleEditMainFileChange = (imageIndex, e) => {
    const file = e.target.files[0];
    if (file) {
      const newImages = [...editProductForm.images];
      newImages[imageIndex].mainFile = file;
      setEditProductForm((prev) => ({ ...prev, images: newImages }));
    }
  };

  const handleEditAdditionalFileChange = (imageIndex, additionalIndex, e) => {
    const file = e.target.files[0];
    if (file) {
      const newImages = [...editProductForm.images];
      newImages[imageIndex].additionalFiles[additionalIndex] = file;
      setEditProductForm((prev) => ({ ...prev, images: newImages }));
    }
  };

  const addEditAdditionalImageField = (imageIndex) => {
    const newImages = [...editProductForm.images];
    newImages[imageIndex].additionalFiles.push(null);
    newImages[imageIndex].additionalUrls.push("");
    setEditProductForm((prev) => ({ ...prev, images: newImages }));
  };

  const removeEditAdditionalFile = (imageIndex, additionalIndex) => {
    const newImages = [...editProductForm.images];
    newImages[imageIndex].additionalFiles = newImages[
      imageIndex
    ].additionalFiles.filter((_, i) => i !== additionalIndex);
    newImages[imageIndex].additionalUrls = newImages[
      imageIndex
    ].additionalUrls.filter((_, i) => i !== additionalIndex);
    if (newImages[imageIndex].additionalFiles.length === 0) {
      newImages[imageIndex].additionalFiles.push(null);
      newImages[imageIndex].additionalUrls.push("");
    }
    setEditProductForm((prev) => ({ ...prev, images: newImages }));
  };

  const handleEditImageArrayChange = (imageIndex, field, arrayIndex, value) => {
    const newImages = [...editProductForm.images];
    newImages[imageIndex][field][arrayIndex] = value;
    setEditProductForm((prev) => ({ ...prev, images: newImages }));
  };

  const addEditImageArrayItem = (imageIndex, field) => {
    const newImages = [...editProductForm.images];
    newImages[imageIndex][field].push("");
    setEditProductForm((prev) => ({ ...prev, images: newImages }));
  };

  const removeEditImageArrayItem = (imageIndex, field, arrayIndex) => {
    const newImages = [...editProductForm.images];
    newImages[imageIndex][field] = newImages[imageIndex][field].filter(
      (_, i) => i !== arrayIndex
    );
    if (newImages[imageIndex][field].length === 0) {
      newImages[imageIndex][field].push("");
    }
    setEditProductForm((prev) => ({ ...prev, images: newImages }));
  };

  const removeEditImage = (index) => {
    setEditProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedImages = await Promise.all(
        editProductForm.images.map(async (image) => {
          const filesToUpload = [];
          if (image.mainFile) filesToUpload.push(image.mainFile);
          image.additionalFiles.forEach((file) => {
            if (file) filesToUpload.push(file);
          });
          const uploadedUrls = await uploadFiles(filesToUpload);
          return {
            mainUrl: image.mainFile
              ? uploadedUrls.shift()
              : image.mainUrl || "",
            additionalUrls:
              uploadedUrls.length > 0 ? uploadedUrls : image.additionalUrls,
            sizes: image.sizes.filter((size) => size),
            colors: image.colors.filter((color) => color),
          };
        })
      );

      const filteredCategories = editProductForm.categories
        .filter(
          (cat) =>
            cat.name &&
            cat.subcategories.length > 0 &&
            cat.subcategories.every((sub) => sub)
        )
        .map((cat) => ({
          name: cat.name,
          subcategories: cat.subcategories.filter((sub) => sub),
        }));

      const response = await axios.put(`/products/${editProductForm.id}`, {
        ...editProductForm,
        categories: filteredCategories,
        images: updatedImages.filter((img) => img.mainUrl),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editProductForm.id ? response.data.product : p
        )
      );
      setEditProductForm(null);
      const categoriesResponse = await axios.get(
        genderFilter !== "all"
          ? `/categories?gender=${genderFilter}`
          : "/categories"
      );
      setCategories(categoriesResponse.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось обновить продукт");
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Вы уверены, что хотите удалить этот продукт?")) {
      try {
        await axios.delete(`/products/${id}`);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Не удалось удалить продукт");
        console.error(err);
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Вы уверены, что хотите удалить этого пользователя?")) {
      try {
        await axios.delete(`/users/${id}`);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setError(null);
      } catch (err) {
        setError(
          err.response?.data?.message || "Не удалось удалить пользователя"
        );
        console.error(err);
      }
    }
  };

  // Фильтрация категорий по gender продукта
  const getFilteredCategories = (productGender) => {
    return categories.filter(
      (cat) => !cat.gender || cat.gender === productGender
    );
  };

  return (
    <div className="container">
      <div className="admin-panel">
        <h1 className="admin-panel__title">Админ-панель</h1>

        {/* Фильтр по гендеру */}
        <section className="gender-filter-section">
          <h2 className="section-title">Фильтр продуктов и категорий</h2>
          <div className="form-group">
            <label className="form-label">Пол</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">Все</option>
              <option value="men">Мужчины</option>
              <option value="women">Женщины</option>
            </select>
          </div>
        </section>

        {/* Форма для создания/обновления категории */}
        <section className="category-form-section">
          <form onSubmit={handleCategorySubmit} className="category-form">
            <h2 className="category-form__title">
              {categoryForm.id
                ? "Редактировать категорию"
                : "Создать категорию"}
            </h2>
            {error && <p className="form-error">{error}</p>}

            <div className="form-group">
              <label className="form-label">Название категории</label>
              <input
                type="text"
                name="name"
                value={categoryForm.name}
                onChange={handleCategoryInputChange}
                className="form-input"
                placeholder="Например: Кроссовки и Кеды"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Родительская категория</label>
              <select
                name="parentName"
                value={categoryForm.parentName}
                onChange={handleCategoryInputChange}
                className="form-select"
              >
                <option value="">Нет (корневая категория)</option>
                {categories
                  .filter(
                    (cat) =>
                      (!categoryForm.id || cat.id !== categoryForm.id) &&
                      (!categoryForm.gender ||
                        cat.gender === categoryForm.gender ||
                        !cat.gender)
                  )
                  .map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} {cat.gender ? `(${cat.gender})` : ""}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Пол</label>
              <select
                name="gender"
                value={categoryForm.gender}
                onChange={handleCategoryInputChange}
                className="form-select"
              >
                <option value="">Общий</option>
                <option value="men">Мужчины</option>
                <option value="women">Женщины</option>
              </select>
            </div>

            <button type="submit" className="btn btn--submit">
              {categoryForm.id ? "Обновить категорию" : "Создать категорию"}
            </button>
            {categoryForm.id && (
              <button
                type="button"
                onClick={() =>
                  setCategoryForm({
                    id: null,
                    name: "",
                    parentName: "",
                    gender: "",
                  })
                }
                className="btn btn--cancel"
              >
                Отмена
              </button>
            )}
          </form>
        </section>

        {/* Список категорий */}
        <section className="categories-section">
          <h2 className="section-title">Список категорий</h2>
          <div className="categories-list">
            {categories.map((category) => (
              <div key={category.name} className="category-card">
                <p className="category-card__name">{category.name}</p>
                <p className="category-card__gender">
                  Пол: {category.gender || "Общий"}
                </p>
                <p className="category-card__subcategories">
                  Подкатегории: {category.subcategories.join(", ") || "Нет"}
                </p>
                <p className="category-card__parent">
                  Родитель: {category.parentName || "Нет"}
                </p>
                <div className="category-card__actions">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="btn btn--edit"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="btn btn--delete"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Форма для создания продукта */}
        <section className="product-form-section">
          <form onSubmit={handleProductSubmit} className="product-form">
            <h2 className="product-form__title">Создать новый продукт</h2>
            {error && <p className="form-error">{error}</p>}

            <div className="form-group">
              <label className="form-label">Название</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Бренд</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Качество</label>
              <input
                type="text"
                name="quality"
                value={formData.quality}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ссылка на товар</label>
              <input
                type="text"
                name="orig"
                value={formData.orig}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Старая цена</label>
              <input
                type="number"
                name="oldPrice"
                value={formData.oldPrice}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Новая цена</label>
              <input
                type="number"
                name="newPrice"
                value={formData.newPrice}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Страна</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Пол</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="men">Мужчины</option>
                <option value="women">Женщины</option>
              </select>
            </div>

            <div className="form-group categories-group">
              <label className="form-label">Категории</label>
              {formData.categories.length === 0 && (
                <button
                  type="button"
                  onClick={addCategory}
                  className="btn btn--add"
                >
                  Добавить категорию
                </button>
              )}
              {formData.categories.map((category, catIndex) => (
                <div key={catIndex} className="category-item">
                  <div className="form-group">
                    <label className="form-label">Категория</label>
                    <select
                      value={category.name}
                      onChange={(e) =>
                        handleProductCategoryChange(
                          catIndex,
                          "name",
                          e.target.value
                        )
                      }
                      className="form-select"
                    >
                      <option value="">Выберите категорию</option>
                      {getFilteredCategories(formData.gender).map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name} {cat.gender ? `(${cat.gender})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Подкатегории</label>
                    {category.subcategories.map((subcategory, subIndex) => (
                      <div key={subIndex} className="subcategory-item">
                        <input
                          type="text"
                          placeholder="Подкатегория"
                          value={subcategory}
                          onChange={(e) =>
                            handleSubcategoryChange(
                              catIndex,
                              subIndex,
                              e.target.value
                            )
                          }
                          className="form-input"
                          list={`subcategorySuggestions-${catIndex}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeSubcategory(catIndex, subIndex)}
                          className="btn btn--remove btn--small"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSubcategory(catIndex)}
                      className="btn btn--add btn--small"
                    >
                      Добавить подкатегорию
                    </button>
                    <datalist id={`subcategorySuggestions-${catIndex}`}>
                      {categories
                        .find((cat) => cat.name === category.name)
                        ?.subcategories.map((subcat) => (
                          <option key={subcat} value={subcat} />
                        ))}
                    </datalist>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategory(catIndex)}
                    className="btn btn--remove"
                  >
                    Удалить категорию
                  </button>
                </div>
              ))}
              {formData.categories.length > 0 && (
                <button
                  type="button"
                  onClick={addCategory}
                  className="btn btn--add"
                >
                  Добавить еще категорию
                </button>
              )}
            </div>

            <div className="form-group images-group">
              <label className="form-label">Изображения</label>
              {formData.images.length === 0 && (
                <button
                  type="button"
                  onClick={addImage}
                  className="btn btn--add"
                >
                  Добавить первое изображение
                </button>
              )}
              {formData.images.map((image, imgIndex) => (
                <div key={imgIndex} className="image-item">
                  <div className="form-group">
                    <label className="form-label">Основное изображение</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleMainFileChange(imgIndex, e)}
                      className="form-input"
                    />
                    {image.mainFile && (
                      <p className="file-name">
                        Выбрано: {image.mainFile.name}
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Дополнительные изображения
                    </label>
                    {image.additionalFiles.map((file, additionalIndex) => (
                      <div
                        key={additionalIndex}
                        className="additional-file-item"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleAdditionalFileChange(
                              imgIndex,
                              additionalIndex,
                              e
                            )
                          }
                          className="form-input"
                        />
                        {file && (
                          <p className="file-name">Выбрано: {file.name}</p>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            removeAdditionalFile(imgIndex, additionalIndex)
                          }
                          className="btn btn--remove btn--small"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addAdditionalImageField(imgIndex)}
                      className="btn btn--add btn--small"
                    >
                      Добавить еще дополнительное изображение
                    </button>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Размеры</label>
                    {image.sizes.map((size, sizeIndex) => (
                      <div key={sizeIndex} className="array-item">
                        <input
                          type="text"
                          placeholder="Размер"
                          value={size}
                          onChange={(e) =>
                            handleImageArrayChange(
                              imgIndex,
                              "sizes",
                              sizeIndex,
                              e.target.value
                            )
                          }
                          className="form-input"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeImageArrayItem(imgIndex, "sizes", sizeIndex)
                          }
                          className="btn btn--remove btn--small"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addImageArrayItem(imgIndex, "sizes")}
                      className="btn btn--add btn--small"
                    >
                      Добавить размер
                    </button>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Цвета</label>
                    {image.colors.map((color, colorIndex) => (
                      <div key={colorIndex} className="array-item">
                        <input
                          type="text"
                          placeholder="Цвет"
                          value={color}
                          onChange={(e) =>
                            handleImageArrayChange(
                              imgIndex,
                              "colors",
                              colorIndex,
                              e.target.value
                            )
                          }
                          className="form-input"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeImageArrayItem(imgIndex, "colors", colorIndex)
                          }
                          className="btn btn--remove btn--small"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addImageArrayItem(imgIndex, "colors")}
                      className="btn btn--add btn--small"
                    >
                      Добавить цвет
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(imgIndex)}
                    className="btn btn--remove"
                  >
                    Удалить изображение
                  </button>
                </div>
              ))}
              {formData.images.length > 0 && (
                <button
                  type="button"
                  onClick={addImage}
                  className="btn btn--add"
                >
                  Добавить еще изображение
                </button>
              )}
            </div>

            <button type="submit" className="btn btn--submit">
              Создать продукт
            </button>
          </form>
        </section>

        {/* Форма для редактирования продукта */}
        {editProductForm && (
          <section className="product-form-section">
            <form onSubmit={handleEditProductSubmit} className="product-form">
              <h2 className="product-form__title">Редактировать продукт</h2>
              {error && <p className="form-error">{error}</p>}

              <div className="form-group">
                <label className="form-label">Название</label>
                <input
                  type="text"
                  name="title"
                  value={editProductForm.title}
                  onChange={handleEditProductInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Описание</label>
                <textarea
                  name="description"
                  value={editProductForm.description}
                  onChange={handleEditProductInputChange}
                  className="form-textarea"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Бренд</label>
                <input
                  type="text"
                  name="brand"
                  value={editProductForm.brand}
                  onChange={handleEditProductInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Качество</label>
                <input
                  type="text"
                  name="quality"
                  value={editProductForm.quality}
                  onChange={handleEditProductInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ссылка на товар</label>
                <input
                  type="text"
                  name="orig"
                  value={editProductForm.orig}
                  onChange={handleEditProductInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Старая цена</label>
                <input
                  type="number"
                  name="oldPrice"
                  value={editProductForm.oldPrice}
                  onChange={handleEditProductInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Новая цена</label>
                <input
                  type="number"
                  name="newPrice"
                  value={editProductForm.newPrice}
                  onChange={handleEditProductInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Страна</label>
                <input
                  type="text"
                  name="country"
                  value={editProductForm.country}
                  onChange={handleEditProductInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Пол</label>
                <select
                  name="gender"
                  value={editProductForm.gender}
                  onChange={handleEditProductInputChange}
                  className="form-select"
                  required
                >
                  <option value="men">Мужчины</option>
                  <option value="women">Женщины</option>
                </select>
              </div>

              <div className="form-group categories-group">
                <label className="form-label">Категории</label>
                {editProductForm.categories.length === 0 && (
                  <button
                    type="button"
                    onClick={addEditCategory}
                    className="btn btn--add"
                  >
                    Добавить категорию
                  </button>
                )}
                {editProductForm.categories.map((category, catIndex) => (
                  <div key={catIndex} className="category-item">
                    <div className="form-group">
                      <label className="form-label">Категория</label>
                      <select
                        value={category.name}
                        onChange={(e) =>
                          handleEditProductCategoryChange(
                            catIndex,
                            "name",
                            e.target.value
                          )
                        }
                        className="form-select"
                      >
                        <option value="">Выберите категорию</option>
                        {getFilteredCategories(editProductForm.gender).map(
                          (cat) => (
                            <option key={cat.name} value={cat.name}>
                              {cat.name} {cat.gender ? `(${cat.gender})` : ""}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Подкатегории</label>
                      {category.subcategories.map((subcategory, subIndex) => (
                        <div key={subIndex} className="subcategory-item">
                          <input
                            type="text"
                            placeholder="Подкатегория"
                            value={subcategory}
                            onChange={(e) =>
                              handleEditSubcategoryChange(
                                catIndex,
                                subIndex,
                                e.target.value
                              )
                            }
                            className="form-input"
                            list={`edit-subcategorySuggestions-${catIndex}`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeEditSubcategory(catIndex, subIndex)
                            }
                            className="btn btn--remove btn--small"
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addEditSubcategory(catIndex)}
                        className="btn btn--add btn--small"
                      >
                        Добавить подкатегорию
                      </button>
                      <datalist id={`edit-subcategorySuggestions-${catIndex}`}>
                        {categories
                          .find((cat) => cat.name === category.name)
                          ?.subcategories.map((subcat) => (
                            <option key={subcat} value={subcat} />
                          ))}
                      </datalist>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEditCategory(catIndex)}
                      className="btn btn--remove"
                    >
                      Удалить категорию
                    </button>
                  </div>
                ))}
                {editProductForm.categories.length > 0 && (
                  <button
                    type="button"
                    onClick={addEditCategory}
                    className="btn btn--add"
                  >
                    Добавить еще категорию
                  </button>
                )}
              </div>

              <div className="form-group images-group">
                <label className="form-label">Изображения</label>
                {editProductForm.images.length === 0 && (
                  <button
                    type="button"
                    onClick={addEditImage}
                    className="btn btn--add"
                  >
                    Добавить первое изображение
                  </button>
                )}
                {editProductForm.images.map((image, imgIndex) => (
                  <div key={imgIndex} className="image-item">
                    <div className="form-group">
                      <label className="form-label">Основное изображение</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleEditMainFileChange(imgIndex, e)}
                        className="form-input"
                      />
                      {image.mainUrl && (
                        <img
                          src={image.mainUrl}
                          alt="Main"
                          className="image-preview"
                        />
                      )}
                      {image.mainFile && (
                        <p className="file-name">
                          Выбрано: {image.mainFile.name}
                        </p>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Дополнительные изображения
                      </label>
                      {image.additionalFiles.map((file, additionalIndex) => (
                        <div
                          key={additionalIndex}
                          className="additional-file-item"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleEditAdditionalFileChange(
                                imgIndex,
                                additionalIndex,
                                e
                              )
                            }
                            className="form-input"
                          />
                          {image.additionalUrls[additionalIndex] && (
                            <img
                              src={image.additionalUrls[additionalIndex]}
                              alt="Additional"
                              className="image-preview image-preview--additional"
                            />
                          )}
                          {file && (
                            <p className="file-name">Выбрано: {file.name}</p>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              removeEditAdditionalFile(
                                imgIndex,
                                additionalIndex
                              )
                            }
                            className="btn btn--remove btn--small"
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addEditAdditionalImageField(imgIndex)}
                        className="btn btn--add btn--small"
                      >
                        Добавить еще дополнительное изображение
                      </button>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Размеры</label>
                      {image.sizes.map((size, sizeIndex) => (
                        <div key={sizeIndex} className="array-item">
                          <input
                            type="text"
                            placeholder="Размер"
                            value={size}
                            onChange={(e) =>
                              handleEditImageArrayChange(
                                imgIndex,
                                "sizes",
                                sizeIndex,
                                e.target.value
                              )
                            }
                            className="form-input"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeEditImageArrayItem(
                                imgIndex,
                                "sizes",
                                sizeIndex
                              )
                            }
                            className="btn btn--remove btn--small"
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addEditImageArrayItem(imgIndex, "sizes")}
                        className="btn btn--add btn--small"
                      >
                        Добавить размер
                      </button>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Цвета</label>
                      {image.colors.map((color, colorIndex) => (
                        <div key={colorIndex} className="array-item">
                          <input
                            type="text"
                            placeholder="Цвет"
                            value={color}
                            onChange={(e) =>
                              handleEditImageArrayChange(
                                imgIndex,
                                "colors",
                                colorIndex,
                                e.target.value
                              )
                            }
                            className="form-input"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeEditImageArrayItem(
                                imgIndex,
                                "colors",
                                colorIndex
                              )
                            }
                            className="btn btn--remove btn--small"
                          >
                            Удалить
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          addEditImageArrayItem(imgIndex, "colors")
                        }
                        className="btn btn--add btn--small"
                      >
                        Добавить цвет
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEditImage(imgIndex)}
                      className="btn btn--remove"
                    >
                      Удалить изображение
                    </button>
                  </div>
                ))}
                {editProductForm.images.length > 0 && (
                  <button
                    type="button"
                    onClick={addEditImage}
                    className="btn btn--add"
                  >
                    Добавить еще изображение
                  </button>
                )}
              </div>

              <button type="submit" className="btn btn--submit">
                Обновить продукт
              </button>
              <button
                type="button"
                onClick={() => setEditProductForm(null)}
                className="btn btn--cancel"
              >
                Отмена
              </button>
            </form>
          </section>
        )}

        {/* Список продуктов */}
        <section className="products-section">
          <h2 className="section-title">Список продуктов</h2>
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <h3 className="product-card__title">{product.title}</h3>
                <p className="product-card__article">
                  Артикул: {product.article}
                </p>
                <p className="product-card__description">
                  {product.description}
                </p>
                <p className="product-card__brand">Бренд: {product.brand}</p>
                <p className="product-card__quality">
                  Качество: {product.quality}
                </p>
                <p className="product-card__quality">Ссылка: {product.orig}</p>
                <p className="product-card__price">
                  Цена: <span className="old-price">{product.oldPrice}</span>{" "}
                  {product.newPrice}
                </p>
                <p className="product-card__country">
                  Страна: {product.country}
                </p>
                <p className="product-card__gender">
                  Пол: {product.gender === "men" ? "Мужчины" : "Женщины"}
                </p>
                <p className="product-card__categories">
                  Категории:{" "}
                  {product.categories
                    .map(
                      (cat) =>
                        `${cat.name} (${
                          cat.subcategories.join(", ") || "без подкатегорий"
                        })`
                    )
                    .join("; ")}
                </p>
                <div className="product-card__images">
                  {product.images.map((image, index) => (
                    <div key={index} className="image-card">
                      <img
                        src={image.mainUrl}
                        alt={`Main ${index}`}
                        className="image-preview"
                      />
                      {image.additionalUrls.length > 0 && (
                        <div className="additional-images">
                          <p>Дополнительные изображения:</p>
                          {image.additionalUrls.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Additional ${idx}`}
                              className="image-preview image-preview--additional"
                            />
                          ))}
                        </div>
                      )}
                      <p className="image-card__sizes">
                        Размеры: {image.sizes.join(", ") || "Не указаны"}
                      </p>
                      <p className="image-card__colors">
                        Цвета: {image.colors.join(", ") || "Не указаны"}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="product-card__actions">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="btn btn--edit"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="btn btn--delete"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Список пользователей */}
        <section className="users-section">
          <h2 className="section-title">Список пользователей</h2>
          <div className="users-grid">
            {users.map((user) => (
              <div key={user.id} className="user-card">
                <p className="user-card__email">Email: {user.email}</p>
                <p className="user-card__username">Имя: {user.username}</p>
                <p className="user-card__verify">
                  Подтвержден: {user.verify ? "Да" : "Нет"}
                </p>
                <p className="user-card__created">
                  Создан: {new Date(user.createdAt).toLocaleDateString()}
                </p>
                <div className="user-card__actions">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="btn btn--delete"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Admin;
