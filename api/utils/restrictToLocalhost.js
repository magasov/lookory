export default function restrictToLocalhost(req, res, next) {
  const allowedOrigin = process.env.CLIENT_URL;
  const origin =
    req.get("Origin") || req.get("Referer")?.split("/").slice(0, 3).join("/");

  // Проверяем, что запрос исходит от разрешённого источника
  if (!origin || origin !== allowedOrigin) {
    return res.status(403).json({ message: "Доступ запрещён" });
  }

  next();
}
