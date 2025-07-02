export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders] = await req.db.query(
      `SELECT id, items, total, status, createdAt, updatedAt
       FROM Orders
       WHERE userId = ?
       ORDER BY createdAt DESC`,
      [userId]
    );

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      items:
        typeof order.items === "string" ? JSON.parse(order.items) : order.items,
      total: parseFloat(order.total),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    res.status(200).json(formattedOrders);
  } catch (err) {
    console.error("Ошибка при получении заказов:", err);
    res.status(500).json({
      message: "Внутренняя ошибка сервера",
      error: err.message,
    });
  }
};
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const [orders] = await req.db.query(
      `SELECT id, items, total, status, createdAt, updatedAt
       FROM Orders
       WHERE id = ? AND userId = ?`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Заказ не найден" });
    }

    const order = orders[0];
    const formattedOrder = {
      id: order.id,
      items:
        typeof order.items === "string" ? JSON.parse(order.items) : order.items,
      total: parseFloat(order.total),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    res.status(200).json(formattedOrder);
  } catch (err) {
    console.error("Ошибка при получении заказа:", err);
    res.status(500).json({
      message: "Внутренняя ошибка сервера",
      error: err.message,
    });
  }
};
