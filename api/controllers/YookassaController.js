import { validationResult } from "express-validator";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";

const SHOP_ID = "1078658";
const SECRET_KEY = "test_klF0ymwIwQjXgBCqtlZqFyTAOHgBQLH5lNQGdCNBVw0";
const IS_TEST = "1";
const API_URL = "https://api.yookassa.ru/v3/payments";

const TELEGRAM_BOT_TOKEN = "7760934950:AAGcksZAw_CaoSl2NCDI_UEhu6fFWxni4AA";
const TELEGRAM_GROUP_ID = "-4763526100";

const sendTelegramMessage = async (message) => {
  try {
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_GROUP_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (error) {
    console.error("Ошибка при отправке сообщения в Telegram:", error);
  }
};

export const createPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user ? req.user.id : null;

    let userInfo = null;
    if (userId) {
      const [user] = await req.db.query(
        `SELECT id, email, firstName, lastName, phone, delivery, city, address FROM User WHERE id = ?`,
        [userId]
      );
      userInfo = user[0];
    }

    let [cart] = await req.db.query(
      `SELECT id FROM Cart WHERE userId ${userId ? "= ?" : "IS NULL"}`,
      userId ? [userId] : []
    );

    if (!cart.length) {
      const [newCart] = await req.db.query(
        `INSERT INTO Cart (userId, createdAt, updatedAt) VALUES (?, NOW(), NOW())`,
        [userId]
      );
      cart = [{ id: newCart.insertId }];
    }

    const cartId = cart[0].id;
    const [items] = await req.db.query(
      `SELECT ci.id, ci.productId, ci.variantId, ci.color, ci.size, ci.quantity, ci.price,
              p.title, p.brand, pi.mainUrl
       FROM CartItem ci
       JOIN Product p ON ci.productId = p.id
       JOIN ProductImage pi ON ci.variantId = pi.id
       WHERE ci.cartId = ?`,
      [cartId]
    );

    if (!items.length) {
      return res.status(400).json({ message: "Корзина пуста" });
    }

    const total = items.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );
    const orderItems = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      title: item.title,
      brand: item.brand,
      variantId: item.variantId,
      mainUrl: item.mainUrl,
      color: item.color,
      size: item.size,
      price: parseFloat(item.price),
      quantity: item.quantity,
    }));

    const [orderResult] = await req.db.query(
      `INSERT INTO Orders (items, total, status, createdAt, updatedAt, userId)
       VALUES (?, ?, 'pending', NOW(), NOW(), ?)`,
      [JSON.stringify(orderItems), total, userId]
    );

    const orderId = orderResult.insertId;

    let telegramMessage = `<b>Новый заказ №${orderId}</b>\n\n`;
    telegramMessage += `<b>Сумма:</b> ${total.toFixed(2)} RUB\n`;
    telegramMessage += `<b>Статус:</b> pending\n\n`;

    telegramMessage += `<b>Товары:</b>\n`;
    orderItems.forEach((item, index) => {
      telegramMessage += `${index + 1}. ${item.title} (${item.brand})\n`;
      telegramMessage += `   Цвет: ${item.color}, Размер: ${item.size}\n`;
      telegramMessage += `   Количество: ${
        item.quantity
      }, Цена: ${item.price.toFixed(2)} RUB\n`;
    });

    telegramMessage += `\n<b>Информация о пользователе:</b>\n`;
    if (userInfo) {
      telegramMessage += `ID: ${userInfo.id}\n`;
      telegramMessage += `Email: ${userInfo.email}\n`;
      telegramMessage += `Имя пользователя: ${
        userInfo.username || "Не указано"
      }\n`;
      telegramMessage += `Имя: ${userInfo.firstName || "Не указано"}\n`;
      telegramMessage += `Фамилия: ${userInfo.lastName || "Не указано"}\n`;
      telegramMessage += `Телефон: ${userInfo.phone || "Не указано"}\n`;
      telegramMessage += `Доставка: ${userInfo.delivery || "Не указано"}\n`;
      telegramMessage += `Город: ${userInfo.city || "Не указано"}\n`;
      telegramMessage += `Адрес: ${userInfo.address || "Не указано"}\n`;
    } else {
      telegramMessage += `Гость (неавторизованный пользователь)\n`;
      telegramMessage += `Email: ${req.body.email || "Не указано"}\n`;
      telegramMessage += `Телефон: ${req.body.phone || "Не указано"}\n`;
      telegramMessage += `Доставка: ${req.body.delivery || "Не указано"}\n`;
      telegramMessage += `Город: ${req.body.city || "Не указано"}\n`;
      telegramMessage += `Адрес: ${req.body.address || "Не указано"}\n`;
    }

    await sendTelegramMessage(telegramMessage);

    const idempotenceKey = uuidv4();
    const paymentData = {
      amount: {
        value: total.toFixed(2),
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        return_url: process.env.CLIENT_URL,
      },
      capture: true,
      description: `Оплата заказа №${orderId}`,
      metadata: {
        orderId,
        userId,
      },
      receipt: {
        customer: {
          email: req.body.email || "default@example.com",
        },
        items: orderItems.map((item) => ({
          description: item.title,
          quantity: item.quantity,
          amount: {
            value: parseFloat(item.price).toFixed(2),
            currency: "RUB",
          },
          vat_code: IS_TEST ? 4 : 2,
        })),
      },
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: `Basic ${Buffer.from(
          `${SHOP_ID}:${SECRET_KEY}`
        ).toString("base64")}`,
      },
      body: JSON.stringify(paymentData),
    });

    const payment = await response.json();

    if (
      payment.status === "pending" &&
      payment.confirmation?.confirmation_url
    ) {
      await req.db.query(`DELETE FROM CartItem WHERE cartId = ?`, [cartId]);
      await req.db.query(`DELETE FROM Cart WHERE id = ?`, [cartId]);

      res
        .status(200)
        .json({ paymentUrl: payment.confirmation.confirmation_url });
    } else if (payment.status === "waiting_for_capture") {
      await req.db.query(
        `UPDATE Orders SET status = 'waiting_for_capture', updatedAt = NOW() WHERE id = ?`,
        [orderId]
      );
      res
        .status(200)
        .json({ paymentUrl: payment.confirmation?.confirmation_url || null });
    } else {
      console.error("Ошибка создания платежа:", payment);
      await req.db.query(
        `UPDATE Orders SET status = 'failed', updatedAt = NOW() WHERE id = ?`,
        [orderId]
      );
      res.status(400).json({ message: "Не удалось создать платеж" });
    }
  } catch (err) {
    console.error("Ошибка при создании платежа:", err);
    await req.db.query(
      `UPDATE Orders SET status = 'failed', updatedAt = NOW() WHERE id = ?`,
      [orderId]
    );
    res.status(500).json({
      message: "Внутренняя ошибка сервера",
      error: err.message,
    });
  }
};

export const handleNotification = async (req, res) => {
  try {
    const { event, object } = req.body;
    const { metadata, amount } = object;
    const orderId = metadata.orderId;
    const userId = metadata.userId;

    const [order] = await req.db.query(
      `SELECT id, total, status FROM Orders WHERE id = ? AND userId ${
        userId ? "= ?" : "IS NULL"
      }`,
      userId ? [orderId, userId] : [orderId]
    );

    if (!order.length) {
      console.error("Заказ не найден");
      return res.status(404).send("Order not found");
    }

    if (
      order[0].status !== "pending" &&
      order[0].status !== "waiting_for_capture"
    ) {
      console.error("Заказ уже обработан");
      return res.status(400).send("Order already processed");
    }

    switch (event) {
      case "payment.waiting_for_capture":
        await req.db.query(
          `UPDATE Orders SET status = 'waiting_for_capture', updatedAt = NOW() WHERE id = ?`,
          [orderId]
        );
        break;

      case "payment.succeeded":
        if (
          parseFloat(order[0].total).toFixed(2) !==
          parseFloat(amount.value).toFixed(2)
        ) {
          console.error("Неверная сумма");
          return res.status(400).send("Invalid amount");
        }
        await req.db.query(
          `UPDATE Orders SET status = 'paid', updatedAt = NOW() WHERE id = ?`,
          [orderId]
        );
        break;

      case "payment.canceled":
        await req.db.query(
          `UPDATE Orders SET status = 'failed', updatedAt = NOW() WHERE id = ?`,
          [orderId]
        );
        break;

      case "refund.succeeded":
        await req.db.query(
          `UPDATE Orders SET status = 'refunded', updatedAt = NOW() WHERE id = ?`,
          [orderId]
        );
        break;

      default:
        console.warn("Необработанное событие:", event);
        return res.status(200).send("OK");
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Ошибка при обработке уведомления:", err);
    res.status(500).send("Server error");
  }
};

export const handleSuccess = async (req, res) => {
  try {
    const { paymentId } = req.query;

    const response = await fetch(`${API_URL}/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${SHOP_ID}:${SECRET_KEY}`
        ).toString("base64")}`,
      },
    });

    const payment = await response.json();
    const orderId = payment.metadata.orderId;

    if (payment.status === "succeeded") {
      await req.db.query(
        `UPDATE Orders SET status = 'paid', updatedAt = NOW() WHERE id = ?`,
        [orderId]
      );
      res.redirect("/order/success");
    } else if (payment.status === "waiting_for_capture") {
      await req.db.query(
        `UPDATE Orders SET status = 'waiting_for_capture', updatedAt = NOW() WHERE id = ?`,
        [orderId]
      );
      res.redirect("/order/success");
    } else {
      await req.db.query(
        `UPDATE Orders SET status = 'failed', updatedAt = NOW() WHERE id = ?`,
        [orderId]
      );
      res.redirect("/order/fail");
    }
  } catch (err) {
    console.error("Ошибка при обработке успешной оплаты:", err);
    res.redirect("/order/fail");
  }
};

export const handleFail = async (req, res) => {
  res.redirect("/order/fail");
};
