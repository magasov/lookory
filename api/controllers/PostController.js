import { v4 as uuidv4 } from "uuid";
import { validationResult } from "express-validator";

export const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      brand,
      oldPrice,
      newPrice,
      country,
      categories = [],
      images = [],
      quality,
      gender,
      orig,
    } = req.body;

    if (
      !title ||
      !description ||
      !brand ||
      !oldPrice ||
      !newPrice ||
      !country ||
      !quality ||
      !gender ||
      !orig ||
      !["men", "women"].includes(gender)
    ) {
      return res.status(400).json({
        message:
          "Все обязательные поля должны быть заполнены, и gender должен быть 'men' или 'women'",
      });
    }

    const article = uuidv4().slice(0, 8).toUpperCase();

    const [productResult] = await req.db.query(
      `INSERT INTO Product (article, title, description, brand, oldPrice, newPrice, country, quality, gender, orig)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        article,
        title,
        description,
        brand,
        oldPrice,
        newPrice,
        country,
        quality,
        gender,
        orig,
      ]
    );
    const productId = productResult.insertId;

    const savedCategories = [];
    for (const categoryObj of categories) {
      const { name: categoryName, subcategories = [] } = categoryObj;
      if (!categoryName) continue;

      let categoryId;
      const [existingCategory] = await req.db.query(
        `SELECT id, gender FROM Category WHERE name = ? AND parentId IS NULL`,
        [categoryName]
      );

      if (existingCategory.length > 0) {
        categoryId = existingCategory[0].id;
        // Проверка, что gender категории соответствует gender продукта
        if (
          existingCategory[0].gender &&
          existingCategory[0].gender !== gender
        ) {
          return res.status(400).json({
            message: `Категория '${categoryName}' не соответствует gender '${gender}'`,
          });
        }
      } else {
        const [categoryResult] = await req.db.query(
          `INSERT INTO Category (name, parentId, gender) VALUES (?, NULL, ?)`,
          [categoryName, gender]
        );
        categoryId = categoryResult.insertId;
      }

      const savedSubcategories = [];
      for (const subcategoryName of subcategories) {
        if (!subcategoryName) continue;

        let subcategoryId;
        const [existingSubcategory] = await req.db.query(
          `SELECT id, gender FROM Category WHERE name = ? AND parentId = ?`,
          [subcategoryName, categoryId]
        );

        if (existingSubcategory.length > 0) {
          subcategoryId = existingSubcategory[0].id;
          if (
            existingSubcategory[0].gender &&
            existingSubcategory[0].gender !== gender
          ) {
            return res.status(400).json({
              message: `Подкатегория '${subcategoryName}' не соответствует gender '${gender}'`,
            });
          }
        } else {
          const [subcategoryResult] = await req.db.query(
            `INSERT INTO Category (name, parentId, gender) VALUES (?, ?, ?)`,
            [subcategoryName, categoryId, gender]
          );
          subcategoryId = subcategoryResult.insertId;
        }

        await req.db.query(
          `INSERT INTO ProductCategory (productId, categoryId) VALUES (?, ?)`,
          [productId, subcategoryId]
        );

        savedSubcategories.push(subcategoryName);
      }

      savedCategories.push({
        name: categoryName,
        subcategories: savedSubcategories,
      });
    }

    // Остальная часть функции (обработка изображений, размеров, цветов) остается без изменений
    const savedImages = [];
    for (const {
      mainUrl,
      additionalUrls = [],
      sizes = [],
      colors = [],
    } of images) {
      if (!mainUrl) continue;

      const [imageResult] = await req.db.query(
        `INSERT INTO ProductImage (productId, mainUrl) VALUES (?, ?)`,
        [productId, mainUrl]
      );
      const imageId = imageResult.insertId;

      for (const additionalUrl of additionalUrls) {
        if (!additionalUrl) continue;
        await req.db.query(
          `INSERT INTO AdditionalImage (imageId, url) VALUES (?, ?)`,
          [imageId, additionalUrl]
        );
      }

      const sizeArray = Array.isArray(sizes)
        ? sizes
        : sizes
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
      const savedSizes = [];
      const sizeMap = new Map();
      for (const size of [...new Set(sizeArray)]) {
        let sizeId;
        const [existingSize] = await req.db.query(
          `SELECT id FROM ProductSize WHERE productId = ? AND size = ?`,
          [productId, size]
        );

        if (existingSize.length > 0) {
          sizeId = existingSize[0].id;
        } else {
          const [sizeResult] = await req.db.query(
            `INSERT INTO ProductSize (productId, size) VALUES (?, ?)`,
            [productId, size]
          );
          sizeId = sizeResult.insertId;
        }

        await req.db.query(
          `INSERT INTO ImageSize (imageId, sizeId) VALUES (?, ?)`,
          [imageId, sizeId]
        );

        savedSizes.push(size);
        sizeMap.set(size, sizeId);
      }

      const colorArray = Array.isArray(colors)
        ? colors
        : colors
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c);
      const savedColors = [];
      for (const color of [...new Set(colorArray)]) {
        let colorId;
        const [existingColor] = await req.db.query(
          `SELECT id FROM ProductColor WHERE productId = ? AND color = ?`,
          [productId, color]
        );

        if (existingColor.length > 0) {
          colorId = existingColor[0].id;
        } else {
          const [colorResult] = await req.db.query(
            `INSERT INTO ProductColor (productId, color) VALUES (?, ?)`,
            [productId, color]
          );
          colorId = colorResult.insertId;
        }

        await req.db.query(
          `INSERT INTO ImageColor (imageId, colorId) VALUES (?, ?)`,
          [imageId, colorId]
        );

        savedColors.push(color);
      }

      savedImages.push({
        id: imageId,
        mainUrl,
        additionalUrls,
        sizes: savedSizes,
        colors: savedColors,
      });
    }

    res.status(201).json({
      message: "Товар успешно создан",
      product: {
        id: productId,
        article,
        title,
        description,
        brand,
        oldPrice,
        newPrice,
        country,
        categories: savedCategories,
        images: savedImages,
        quality,
        gender,
        orig,
      },
    });
  } catch (err) {
    console.error("Ошибка при создании товара:", err);
    res
      .status(500)
      .json({ message: "Не удалось создать товар", error: err.message });
  }
};
export const getProducts = async (req, res) => {
  try {
    const { sortBy, order, gender } = req.query;

    const validSortFields = {
      id: "id",
      newPrice: "newPrice",
    };

    const validOrders = ["ASC", "DESC"];
    const validGenders = ["men", "women"];

    let sortField = validSortFields.id;
    let sortOrder = "DESC";
    let genderFilter = "";

    if (sortBy && validSortFields[sortBy]) {
      sortField = validSortFields[sortBy];
    }

    if (order && validOrders.includes(order.toUpperCase())) {
      sortOrder = order.toUpperCase();
    }

    if (gender && validGenders.includes(gender)) {
      genderFilter = `WHERE gender = ?`;
    }

    const sortExpression =
      sortField === "newPrice" ? `CAST(newPrice AS DECIMAL(10,2))` : sortField;

    const query = `SELECT * FROM Product ${genderFilter} ORDER BY ${sortExpression} ${sortOrder}`;
    const queryParams = gender && validGenders.includes(gender) ? [gender] : [];

    const [products] = await req.db.query(query, queryParams);

    for (const product of products) {
      const [categoriesData] = await req.db.query(
        `SELECT c.id, c.name, c.parentId
         FROM ProductCategory pc
         JOIN Category c ON pc.categoryId = c.id
         WHERE pc.productId = ?`,
        [product.id]
      );

      const categories = [];
      const categoryMap = new Map();

      for (const cat of categoriesData) {
        if (cat.parentId) {
          const [parent] = await req.db.query(
            `SELECT id, name FROM Category WHERE id = ?`,
            [cat.parentId]
          );
          if (parent.length > 0) {
            const parentName = parent[0].name;
            if (!categoryMap.has(parentName)) {
              categoryMap.set(parentName, {
                name: parentName,
                subcategories: [],
              });
            }
            categoryMap.get(parentName).subcategories.push(cat.name);
          }
        }
      }

      product.categories = Array.from(categoryMap.values());

      const [images] = await req.db.query(
        `SELECT pi.id, pi.mainUrl
         FROM ProductImage pi
         WHERE pi.productId = ?`,
        [product.id]
      );

      for (const image of images) {
        const [additionalUrls] = await req.db.query(
          `SELECT url FROM AdditionalImage WHERE imageId = ?`,
          [image.id]
        );

        const [sizes] = await req.db.query(
          `SELECT ps.size
           FROM ImageSize iss
           JOIN ProductSize ps ON iss.sizeId = ps.id
           WHERE iss.imageId = ?`,
          [image.id]
        );

        const [colors] = await req.db.query(
          `SELECT pc.color
           FROM ImageColor ic
           JOIN ProductColor pc ON ic.colorId = pc.id
           WHERE ic.imageId = ?`,
          [image.id]
        );

        image.additionalUrls = additionalUrls.map((au) => au.url);
        image.sizes = sizes.map((s) => s.size);
        image.colors = colors.map((c) => c.color);
      }

      product.images = images;
    }

    res.status(200).json(products);
  } catch (err) {
    console.error("Ошибка при получении списка товаров:", err);
    res.status(500).json({
      message: "Не удалось получить список товаров",
      error: err.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await req.db.query(
      `SELECT * FROM Product WHERE id = ?`,
      [id]
    );

    if (!products.length) {
      return res.status(404).json({
        message: "Товар не найден",
      });
    }

    const product = products[0];

    const [categoriesData] = await req.db.query(
      `SELECT c.id, c.name, c.parentId
       FROM ProductCategory pc
       JOIN Category c ON pc.categoryId = c.id
       WHERE pc.productId = ?`,
      [product.id]
    );

    const categories = [];
    const categoryMap = new Map();

    for (const cat of categoriesData) {
      if (cat.parentId) {
        const [parent] = await req.db.query(
          `SELECT id, name FROM Category WHERE id = ?`,
          [cat.parentId]
        );
        if (parent.length > 0) {
          const parentName = parent[0].name;
          if (!categoryMap.has(parentName)) {
            categoryMap.set(parentName, {
              name: parentName,
              subcategories: [],
            });
          }
          categoryMap.get(parentName).subcategories.push(cat.name);
        }
      }
    }

    product.categories = Array.from(categoryMap.values());

    const [images] = await req.db.query(
      `SELECT pi.id, pi.mainUrl
       FROM ProductImage pi
       WHERE pi.productId = ?`,
      [product.id]
    );

    for (const image of images) {
      const [additionalUrls] = await req.db.query(
        `SELECT url FROM AdditionalImage WHERE imageId = ?`,
        [image.id]
      );

      const [sizes] = await req.db.query(
        `SELECT ps.size
         FROM ImageSize iss
         JOIN ProductSize ps ON iss.sizeId = ps.id
         WHERE iss.imageId = ?`,
        [image.id]
      );

      const [colors] = await req.db.query(
        `SELECT pc.color
         FROM ImageColor ic
         JOIN ProductColor pc ON ic.colorId = pc.id
         WHERE ic.imageId = ?`,
        [image.id]
      );

      image.additionalUrls = additionalUrls.map((au) => au.url);
      image.sizes = sizes.map((s) => s.size);
      image.colors = colors.map((c) => c.color);
    }

    product.images = images;

    res.status(200).json(product);
  } catch (err) {
    console.error("Ошибка при получении товара:", err);
    res.status(500).json({
      message: "Не удалось получить товар",
      error: err.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      title,
      description,
      brand,
      oldPrice,
      newPrice,
      country,
      categories = [],
      images = [],
      quality,
      gender,
      orig,
    } = req.body;

    const [existingProduct] = await req.db.query(
      `SELECT id FROM Product WHERE id = ?`,
      [id]
    );

    if (!existingProduct.length) {
      return res.status(404).json({ message: "Продукт не найден" });
    }

    if (
      !title ||
      !description ||
      !brand ||
      !oldPrice ||
      !newPrice ||
      !country ||
      !quality ||
      !gender ||
      !orig ||
      !["men", "women"].includes(gender)
    ) {
      return res.status(400).json({
        message:
          "Все обязательные поля должны быть заполнены, и gender должен быть 'men' или 'women'",
      });
    }

    await req.db.query(
      `UPDATE Product SET title = ?, description = ?, brand = ?, oldPrice = ?, newPrice = ?, country = ?, quality = ?, gender = ?, orig = ? WHERE id = ?`,
      [
        title,
        description,
        brand,
        oldPrice,
        newPrice,
        country,
        quality,
        gender,
        orig,
        id,
      ]
    );

    await req.db.query(`DELETE FROM ProductCategory WHERE productId = ?`, [id]);

    const savedCategories = [];
    for (const categoryObj of categories) {
      const { name: categoryName, subcategories = [] } = categoryObj;
      if (!categoryName) continue;

      let categoryId;
      const [existingCategory] = await req.db.query(
        `SELECT id, gender FROM Category WHERE name = ? AND parentId IS NULL`,
        [categoryName]
      );

      if (existingCategory.length > 0) {
        categoryId = existingCategory[0].id;
        if (
          existingCategory[0].gender &&
          existingCategory[0].gender !== gender
        ) {
          return res.status(400).json({
            message: `Категория '${categoryName}' не соответствует gender '${gender}'`,
          });
        }
      } else {
        const [categoryResult] = await req.db.query(
          `INSERT INTO Category (name, parentId, gender) VALUES (?, NULL, ?)`,
          [categoryName, gender]
        );
        categoryId = categoryResult.insertId;
      }

      const savedSubcategories = [];
      for (const subcategoryName of subcategories) {
        if (!subcategoryName) continue;

        let subcategoryId;
        const [existingSubcategory] = await req.db.query(
          `SELECT id, gender FROM Category WHERE name = ? AND parentId = ?`,
          [subcategoryName, categoryId]
        );

        if (existingSubcategory.length > 0) {
          subcategoryId = existingSubcategory[0].id;
          if (
            existingSubcategory[0].gender &&
            existingSubcategory[0].gender !== gender
          ) {
            return res.status(400).json({
              message: `Подкатегория '${subcategoryName}' не соответствует gender '${gender}'`,
            });
          }
        } else {
          const [subcategoryResult] = await req.db.query(
            `INSERT INTO Category (name, parentId, gender) VALUES (?, ?, ?)`,
            [subcategoryName, categoryId, gender]
          );
          subcategoryId = subcategoryResult.insertId;
        }

        await req.db.query(
          `INSERT INTO ProductCategory (productId, categoryId) VALUES (?, ?)`,
          [id, subcategoryId]
        );

        savedSubcategories.push(subcategoryName);
      }

      savedCategories.push({
        name: categoryName,
        subcategories: savedSubcategories,
      });
    }

    // Остальная часть функции (удаление и добавление изображений, размеров, цветов) остается без изменений
    const [existingImages] = await req.db.query(
      `SELECT id FROM ProductImage WHERE productId = ?`,
      [id]
    );
    for (const image of existingImages) {
      await req.db.query(`DELETE FROM AdditionalImage WHERE imageId = ?`, [
        image.id,
      ]);
      await req.db.query(`DELETE FROM ImageSize WHERE imageId = ?`, [image.id]);
      await req.db.query(`DELETE FROM ImageColor WHERE imageId = ?`, [
        image.id,
      ]);
    }
    await req.db.query(`DELETE FROM ProductImage WHERE productId = ?`, [id]);
    await req.db.query(`DELETE FROM ProductSize WHERE productId = ?`, [id]);
    await req.db.query(`DELETE FROM ProductColor WHERE productId = ?`, [id]);

    const savedImages = [];
    for (const {
      mainUrl,
      additionalUrls = [],
      sizes = [],
      colors = [],
    } of images) {
      if (!mainUrl) continue;

      const [imageResult] = await req.db.query(
        `INSERT INTO ProductImage (productId, mainUrl) VALUES (?, ?)`,
        [id, mainUrl]
      );
      const imageId = imageResult.insertId;

      for (const additionalUrl of additionalUrls) {
        if (!additionalUrl) continue;
        await req.db.query(
          `INSERT INTO AdditionalImage (imageId, url) VALUES (?, ?)`,
          [imageId, additionalUrl]
        );
      }

      const sizeArray = Array.isArray(sizes)
        ? sizes
        : sizes
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
      const savedSizes = [];
      const sizeMap = new Map();
      for (const size of [...new Set(sizeArray)]) {
        let sizeId;
        const [existingSize] = await req.db.query(
          `SELECT id FROM ProductSize WHERE productId = ? AND size = ?`,
          [id, size]
        );

        if (existingSize.length > 0) {
          sizeId = existingSize[0].id;
        } else {
          const [sizeResult] = await req.db.query(
            `INSERT INTO ProductSize (productId, size) VALUES (?, ?)`,
            [id, size]
          );
          sizeId = sizeResult.insertId;
        }

        await req.db.query(
          `INSERT INTO ImageSize (imageId, sizeId) VALUES (?, ?)`,
          [imageId, sizeId]
        );

        savedSizes.push(size);
        sizeMap.set(size, sizeId);
      }

      const colorArray = Array.isArray(colors)
        ? colors
        : colors
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c);
      const savedColors = [];
      for (const color of [...new Set(colorArray)]) {
        let colorId;
        const [existingColor] = await req.db.query(
          `SELECT id FROM ProductColor WHERE productId = ? AND color = ?`,
          [id, color]
        );

        if (existingColor.length > 0) {
          colorId = existingColor[0].id;
        } else {
          const [colorResult] = await req.db.query(
            `INSERT INTO ProductColor (productId, color) VALUES (?, ?)`,
            [id, color]
          );
          colorId = colorResult.insertId;
        }

        await req.db.query(
          `INSERT INTO ImageColor (imageId, colorId) VALUES (?, ?)`,
          [imageId, colorId]
        );

        savedColors.push(color);
      }

      savedImages.push({
        id: imageId,
        mainUrl,
        additionalUrls,
        sizes: savedSizes,
        colors: savedColors,
      });
    }

    res.status(200).json({
      message: "Продукт успешно обновлен",
      product: {
        id,
        title,
        description,
        brand,
        oldPrice,
        newPrice,
        country,
        categories: savedCategories,
        images: savedImages,
        quality,
        gender,
        orig,
      },
    });
  } catch (err) {
    console.error("Ошибка при обновлении продукта:", err);
    res.status(500).json({
      message: "Не удалось обновить продукт",
      error: err.message,
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const { gender } = req.query;

    // Проверка валидности gender
    if (gender && !["men", "women"].includes(gender)) {
      return res
        .status(400)
        .json({ message: "Gender должен быть 'men' или 'women'" });
    }

    const query = gender
      ? `SELECT id, name, parentId, gender FROM Category WHERE gender = ? OR gender IS NULL`
      : `SELECT id, name, parentId, gender FROM Category`;
    const queryParams = gender ? [gender] : [];

    const [categories] = await req.db.query(query, queryParams);

    const categoryMap = new Map();
    const result = [];

    for (const category of categories) {
      if (!category.parentId) {
        categoryMap.set(category.name, {
          name: category.name,
          gender: category.gender,
          subcategories: [],
        });
        result.push(categoryMap.get(category.name));
      } else {
        const [parent] = await req.db.query(
          `SELECT name, gender FROM Category WHERE id = ?`,
          [category.parentId]
        );
        if (parent.length > 0 && categoryMap.has(parent[0].name)) {
          categoryMap.get(parent[0].name).subcategories.push(category.name);
        }
      }
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Ошибка при получении категорий:", err);
    res.status(500).json({
      message: "Не удалось получить категории",
      error: err.message,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, parentName, gender } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Название категории обязательно" });
    }

    // Проверка валидности gender
    if (gender && !["men", "women"].includes(gender)) {
      return res
        .status(400)
        .json({ message: "Gender должен быть 'men' или 'women'" });
    }

    let parentId = null;
    if (parentName) {
      const [parent] = await req.db.query(
        `SELECT id, gender FROM Category WHERE name = ? AND parentId IS NULL`,
        [parentName]
      );
      if (parent.length === 0) {
        return res
          .status(400)
          .json({ message: "Родительская категория не найдена" });
      }
      parentId = parent[0].id;

      // Проверка, что gender родительской категории совпадает
      if (gender && parent[0].gender && parent[0].gender !== gender) {
        return res
          .status(400)
          .json({ message: "Gender родительской категории не совпадает" });
      }
    }

    const [existingCategory] = await req.db.query(
      `SELECT id FROM Category WHERE name = ? AND parentId ${
        parentId === null ? "IS NULL" : "= ?"
      } AND (gender = ? OR gender IS NULL)`,
      parentId === null ? [name, gender] : [name, parentId, gender]
    );

    if (existingCategory.length > 0) {
      return res.status(400).json({ message: "Категория уже существует" });
    }

    const [result] = await req.db.query(
      `INSERT INTO Category (name, parentId, gender) VALUES (?, ?, ?)`,
      [name, parentId, gender || null]
    );

    res.status(201).json({
      message: parentId
        ? "Подкатегория успешно создана"
        : "Категория успешно создана",
      category: {
        id: result.insertId,
        name,
        parentId,
        gender: gender || null,
      },
    });
  } catch (err) {
    console.error("Ошибка при создании категории:", err);
    res
      .status(500)
      .json({ message: "Не удалось создать категорию", error: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, parentName, gender } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ message: "Название категории обязательно" });
    }

    // Проверка валидности gender
    if (gender && !["men", "women"].includes(gender)) {
      return res
        .status(400)
        .json({ message: "Gender должен быть 'men' или 'women'" });
    }

    const [existingCategory] = await req.db.query(
      `SELECT id, parentId, gender FROM Category WHERE id = ?`,
      [id]
    );

    if (!existingCategory.length) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    let parentId = null;
    if (parentName) {
      const [parent] = await req.db.query(
        `SELECT id, gender FROM Category WHERE name = ? AND parentId IS NULL`,
        [parentName]
      );
      if (!parent.length) {
        return res
          .status(400)
          .json({ message: "Родительская категория не найдена" });
      }
      parentId = parent[0].id;

      // Проверка, что gender родительской категории совпадает
      if (gender && parent[0].gender && parent[0].gender !== gender) {
        return res
          .status(400)
          .json({ message: "Gender родительской категории не совпадает" });
      }
    }

    const [duplicateCategory] = await req.db.query(
      `SELECT id FROM Category WHERE name = ? AND parentId ${
        parentId === null ? "IS NULL" : "= ?"
      } AND (gender = ? OR gender IS NULL) AND id != ?`,
      parentId === null ? [name, gender, id] : [name, parentId, gender, id]
    );

    if (duplicateCategory.length > 0) {
      return res
        .status(400)
        .json({ message: "Категория с таким именем уже существует" });
    }

    await req.db.query(
      `UPDATE Category SET name = ?, parentId = ?, gender = ? WHERE id = ?`,
      [name, parentId, gender || null, id]
    );

    res.status(200).json({
      message: "Категория успешно обновлена",
      category: { id, name, parentId, gender: gender || null },
    });
  } catch (err) {
    console.error("Ошибка при обновлении категории:", err);
    res.status(500).json({
      message: "Не удалось обновить категорию",
      error: err.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [category] = await req.db.query(
      `SELECT id, gender FROM Category WHERE id = ?`,
      [id]
    );

    if (!category.length) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    const [subcategories] = await req.db.query(
      `SELECT id FROM Category WHERE parentId = ?`,
      [id]
    );

    if (subcategories.length > 0) {
      return res.status(400).json({
        message: "Нельзя удалить категорию, содержащую подкатегории",
      });
    }

    const [productLinks] = await req.db.query(
      `SELECT p.id, p.gender FROM ProductCategory pc JOIN Product p ON pc.productId = p.id WHERE pc.categoryId = ?`,
      [id]
    );

    if (productLinks.length > 0) {
      const categoryGender = category[0].gender;
      for (const product of productLinks) {
        if (categoryGender && product.gender !== categoryGender) {
          return res.status(400).json({
            message: `Категория связана с продуктом с другим gender (${product.gender})`,
          });
        }
      }
      return res.status(400).json({
        message: "Нельзя удалить категорию, связанную с продуктами",
      });
    }

    await req.db.query(`DELETE FROM Category WHERE id = ?`, [id]);

    res.status(200).json({ message: "Категория успешно удалена" });
  } catch (err) {
    console.error("Ошибка при удалении категории:", err);
    res.status(500).json({
      message: "Не удалось удалить категорию",
      error: err.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [product] = await req.db.query(
      `SELECT id FROM Product WHERE id = ?`,
      [id]
    );

    if (!product.length) {
      return res.status(404).json({ message: "Продукт не найден" });
    }

    const [images] = await req.db.query(
      `SELECT id FROM ProductImage WHERE productId = ?`,
      [id]
    );
    for (const image of images) {
      await req.db.query(`DELETE FROM AdditionalImage WHERE imageId = ?`, [
        image.id,
      ]);
      await req.db.query(`DELETE FROM ImageSize WHERE imageId = ?`, [image.id]);
      await req.db.query(`DELETE FROM ImageColor WHERE imageId = ?`, [
        image.id,
      ]);
    }

    await req.db.query(`DELETE FROM ProductImage WHERE productId = ?`, [id]);
    await req.db.query(`DELETE FROM ProductCategory WHERE productId = ?`, [id]);
    await req.db.query(`DELETE FROM ProductSize WHERE productId = ?`, [id]);
    await req.db.query(`DELETE FROM ProductColor WHERE productId = ?`, [id]);
    await req.db.query(`DELETE FROM Product WHERE id = ?`, [id]);

    res.status(200).json({ message: "Продукт успешно удален" });
  } catch (err) {
    console.error("Ошибка при удалении продукта:", err);
    res.status(500).json({
      message: "Не удалось удалить продукт",
      error: err.message,
    });
  }
};
