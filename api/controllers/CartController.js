import { validationResult } from "express-validator";

export const addToCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, variantId, color, size, quantity = 1 } = req.body;

    if (!productId || !variantId || !color || !size) {
      return res
        .status(400)
        .json({ message: "Все обязательные поля должны быть заполнены" });
    }

    const [product] = await req.db.query(
      `SELECT id, newPrice AS price FROM Product WHERE id = ?`,
      [productId]
    );
    if (!product.length) {
      return res.status(404).json({ message: "Продукт не найден" });
    }

    const [variant] = await req.db.query(
      `SELECT id FROM ProductImage WHERE id = ? AND productId = ?`,
      [variantId, productId]
    );
    if (!variant.length) {
      return res.status(404).json({ message: "Вариант продукта не найден" });
    }

    const [colorCheck] = await req.db.query(
      `SELECT pc.id FROM ProductColor pc
       JOIN ImageColor ic ON pc.id = ic.colorId
       WHERE pc.productId = ? AND pc.color = ? AND ic.imageId = ?`,
      [productId, color, variantId]
    );
    const [sizeCheck] = await req.db.query(
      `SELECT ps.id FROM ProductSize ps
       JOIN ImageSize iss ON ps.id = iss.sizeId
       WHERE ps.productId = ? AND ps.size = ? AND iss.imageId = ?`,
      [productId, size, variantId]
    );

    if (!colorCheck.length || !sizeCheck.length) {
      return res
        .status(400)
        .json({ message: "Указанный цвет или размер недоступен" });
    }

    let cartId;
    const userId = req.user ? req.user.id : null;
    const [cart] = await req.db.query(
      `SELECT id FROM Cart WHERE userId ${userId ? "= ?" : "IS NULL"}`,
      userId ? [userId] : []
    );

    if (cart.length) {
      cartId = cart[0].id;
    } else {
      const [cartResult] = await req.db.query(
        `INSERT INTO Cart (userId, createdAt, updatedAt) VALUES (?, NOW(), NOW())`,
        [userId]
      );
      cartId = cartResult.insertId;
    }

    const [existingItem] = await req.db.query(
      `SELECT id, quantity FROM CartItem
       WHERE cartId = ? AND productId = ? AND variantId = ? AND color = ? AND size = ?`,
      [cartId, productId, variantId, color, size]
    );

    if (existingItem.length) {
      const currentQuantity = existingItem[0].quantity;
      const newQuantity = currentQuantity + quantity;

      if (newQuantity > 150) {
        return res.status(400).json({
          message: "Максимально допустимое количество товара в корзине — 150",
        });
      }

      await req.db.query(
        `UPDATE CartItem SET quantity = ?, updatedAt = NOW()
         WHERE id = ?`,
        [newQuantity, existingItem[0].id]
      );
    } else {
      if (quantity > 150) {
        return res.status(400).json({
          message: "Максимально допустимое количество товара в корзине — 150",
        });
      }

      await req.db.query(
        `INSERT INTO CartItem (cartId, productId, variantId, color, size, quantity, price, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [cartId, productId, variantId, color, size, quantity, product[0].price]
      );
    }

    res.status(200).json({ message: "Продукт успешно добавлен в корзину" });
  } catch (err) {
    console.error("Ошибка при добавлении в корзину:", err);
    res.status(500).json({
      message: "Не удалось добавить продукт в корзину",
      error: err.message,
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const [cart] = await req.db.query(
      `SELECT id FROM Cart WHERE userId ${userId ? "= ?" : "IS NULL"}`,
      userId ? [userId] : []
    );

    if (!cart.length) {
      return res.status(200).json({ items: [], total: 0 });
    }

    const cartId = cart[0].id;
    const [items] = await req.db.query(
      `SELECT ci.id, ci.productId, ci.variantId, ci.color, ci.size, ci.quantity, ci.price,
              p.title, p.brand, pi.mainUrl,
              (SELECT GROUP_CONCAT(url) FROM AdditionalImage ai WHERE ai.imageId = ci.variantId) AS additionalUrls
       FROM CartItem ci
       JOIN Product p ON ci.productId = p.id
       JOIN ProductImage pi ON ci.variantId = pi.id
       WHERE ci.cartId = ?`,
      [cartId]
    );

    const formattedItems = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      title: item.title,
      brand: item.brand,
      variant: {
        id: item.variantId,
        mainUrl: item.mainUrl,
        additionalUrls: item.additionalUrls
          ? item.additionalUrls.split(",")
          : [],
        sizes: [item.size],
        colors: [item.color],
      },
      color: item.color,
      size: item.size,
      price: item.price,
      quantity: item.quantity,
    }));

    const total = formattedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    res.status(200).json({ items: formattedItems, total });
  } catch (err) {
    console.error("Ошибка при получении корзины:", err);
    res
      .status(500)
      .json({ message: "Не удалось получить корзину", error: err.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const [item] = await req.db.query(
      `SELECT id, cartId FROM CartItem WHERE id = ?`,
      [itemId]
    );
    if (!item.length) {
      return res.status(404).json({ message: "Элемент корзины не найден" });
    }

    const userId = req.user ? req.user.id : null;
    const [cart] = await req.db.query(
      `SELECT id FROM Cart WHERE id = ? AND userId ${
        userId ? "= ?" : "IS NULL"
      }`,
      userId ? [item[0].cartId, userId] : [item[0].cartId]
    );

    if (!cart.length) {
      return res
        .status(403)
        .json({ message: "У вас нет доступа к этой корзине" });
    }

    await req.db.query(`DELETE FROM CartItem WHERE id = ?`, [itemId]);

    res.status(200).json({ message: "Продукт успешно удален из корзины" });
  } catch (err) {
    console.error("Ошибка при удалении из корзины:", err);
    res.status(500).json({
      message: "Не удалось удалить продукт из корзины",
      error: err.message,
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res
        .status(400)
        .json({ message: "Количество должно быть больше 0" });
    }

    const [item] = await req.db.query(
      `SELECT id, cartId FROM CartItem WHERE id = ?`,
      [itemId]
    );
    if (!item.length) {
      return res.status(404).json({ message: "Элемент корзины не найден" });
    }

    const userId = req.user ? req.user.id : null;
    const [cart] = await req.db.query(
      `SELECT id FROM Cart WHERE id = ? AND userId ${
        userId ? "= ?" : "IS NULL"
      }`,
      userId ? [item[0].cartId, userId] : [item[0].cartId]
    );

    if (!cart.length) {
      return res
        .status(403)
        .json({ message: "У вас нет доступа к этой корзине" });
    }

    await req.db.query(
      `UPDATE CartItem SET quantity = ?, updatedAt = NOW() WHERE id = ?`,
      [quantity, itemId]
    );

    res.status(200).json({ message: "Количество успешно обновлено" });
  } catch (err) {
    console.error("Ошибка при обновлении количества:", err);
    res
      .status(500)
      .json({ message: "Не удалось обновить количество", error: err.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const [cart] = await req.db.query(
      `SELECT id FROM Cart WHERE userId ${userId ? "= ?" : "IS NULL"}`,
      userId ? [userId] : []
    );

    if (!cart.length) {
      return res.status(200).json({ message: "Корзина уже пуста" });
    }

    await req.db.query(`DELETE FROM CartItem WHERE cartId = ?`, [cart[0].id]);
    await req.db.query(`DELETE FROM Cart WHERE id = ?`, [cart[0].id]);

    res.status(200).json({ message: "Корзина успешно очищена" });
  } catch (err) {
    console.error("Ошибка при очистке корзины:", err);
    res
      .status(500)
      .json({ message: "Не удалось очистить корзину", error: err.message });
  }
};
