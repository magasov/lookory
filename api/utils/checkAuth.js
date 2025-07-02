import jwt from "jsonwebtoken";

export default (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Не авторизован: токен отсутствует или неверный формат",
      });
    }

    const token = authHeader.replace(/Bearer\s?/, "");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: decoded.id };
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("Ошибка верификации токена:", err.message);
    return res.status(403).json({
      message: "Нет доступа: неверный или истекший токен",
      error: err.message,
    });
  }
};
