import express from "express";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import multer from "multer";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { registerValidations, loginValidations } from "./validations.js";
import checkAuth from "./utils/checkAuth.js";
import * as UserController from "./controllers/UserController.js";
import * as PostController from "./controllers/PostController.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import checkAdmin from "./utils/checkAdmin.js";
import restrictToLocalhost from "./utils/restrictToLocalhost.js";
import * as CartController from "./controllers/CartController.js";
import {
  createPayment,
  handleFail,
  handleNotification,
  handleSuccess,
} from "./controllers/YookassaController.js";
import { getOrderById, getOrders } from "./controllers/OrdersController.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(restrictToLocalhost);

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "magasov12345",
  database: process.env.DB_NAME || "lookory",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use((req, res, next) => {
  req.db = pool;
  next();
});

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 500,
//   message: { error: "Слишком много запросов, попробуйте позже" },
// });
// app.use(limiter);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(file.originalname.toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extname && mimeType) {
      return cb(null, true);
    } else {
      return cb(new Error("Неподдерживаемый формат файла"), false);
    }
  },
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

app.get("/", (req, res) => {
  res.send("Сервер работает!");
});

// Authentication routes
app.post("/auth/register", UserController.register);
app.post("/auth/login", UserController.login);
app.get("/auth/verify/:token", UserController.verifyEmail);

// Protected routes (требуют авторизации)
app.get("/auth/me", checkAuth, UserController.getMe);
app.put("/users/me", checkAuth, UserController.updateUser);

// Protected routes (требуют авторизации)
app.post("/api/cart", checkAuth, CartController.addToCart);
app.get("/api/cart", checkAuth, CartController.getCart);
app.delete("/api/cart/:itemId", checkAuth, CartController.removeFromCart);
app.put("/api/cart/:itemId", checkAuth, CartController.updateCartItem);
app.delete("/api/cart", checkAuth, CartController.clearCart);

// Admin-only routes (требуют isAdmin=1)
app.get("/users", checkAdmin, UserController.getAllUsers);
app.delete("/users/:id", checkAdmin, UserController.deleteUser);

// Products (смешанные права)
app.post("/products", checkAdmin, PostController.createProduct);
app.get("/products", PostController.getProducts); // Доступно всем
app.get("/product/:id", PostController.getProductById); // Доступно всем
app.put("/products/:id", checkAdmin, PostController.updateProduct);
app.delete("/products/:id", checkAdmin, PostController.deleteProduct);

// Categories (админ-доступ к изменению)
app.get("/categories", PostController.getCategories); // Доступно всем
app.post("/categories", checkAdmin, PostController.createCategory);
app.put("/categories/:id", checkAdmin, PostController.updateCategory);
app.delete("/categories/:id", checkAdmin, PostController.deleteCategory);

app.post("/api/yookassa/create", checkAuth, createPayment);
app.post("/api/yookassa/notification", handleNotification);
app.get("/api/yookassa/success", handleSuccess);
app.get("/api/yookassa/fail", handleFail);

app.get("/orders", checkAuth, getOrders);
app.get("/orders/:id", checkAuth, getOrderById);

// Загрузка файлов
app.post("/upload", upload.array("files", 10), (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ message: "Нет файлов для загрузки." });
  }
  const fileUrls = files.map(
    (file) => `${process.env.API_URL}/uploads/${file.filename}`
  );
  res.status(200).json({ fileUrls });
});

app.use("/uploads", express.static("uploads"));

async function start() {
  try {
    // Проверка подключения к MySQL
    const conn = await pool.getConnection();
    console.log("✅ Успешное подключение к MySQL ");
    conn.release();

    app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
      console.log(
        `🚀 Сервер запущен на http://localhost:${process.env.PORT || 5000}`
      );
    });
  } catch (err) {
    console.error("❌ Ошибка подключения к MySQL:", err.message);
    process.exit(1);
  }
}

start();
