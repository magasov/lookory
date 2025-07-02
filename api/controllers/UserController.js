import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import nodemailer from "nodemailer";
import crypto from "crypto";

const sendVerificationEmail = async (email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Подтвердите ваш email",
      html: `
        <html>
        <head>
          <style>
            body, table, td, a { padding: 0; margin: 0; font-family: Arial, sans-serif; text-decoration: none; }
            body { width: 100%; background-color: #f4f4f9; line-height: 1.4; margin: 0; }
            table { border-spacing: 0; width: 100%; border-collapse: collapse; }
            .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
            .banner { text-align: center; padding: 20px; }
            .banner img { width: 100px; height: 100px; border-radius: 50%; }
            .content { padding: 20px; text-align: center; }
            h2 { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
            p { font-size: 16px; color: #555; margin: 0 0 20px; }
            .btn { display: inline-block; padding: 10px 20px; border: 1px solid #0077FF; color: #0077FF; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 25px; margin-bottom: 20px; }
            .footer { font-size: 14px; color: #999; text-align: center; padding: 10px 20px; }
            .footer a { color: #0077FF; text-decoration: underline; }
          </style>
        </head>
        <body>
          <table role="presentation" class="email-container">
            <tr><td class="banner"><img src="https://example.com/logo.png" alt="Logo"></td></tr>
            <tr><td class="content"><h2>Здравствуйте!</h2><p>Для завершения регистрации перейдите по следующей ссылке:</p><a href="${process.env.CLIENT_URL}/verify/${token}" class="btn">Подтвердить Email</a></td></tr>
            <tr><td class="footer">by <a href="${process.env.CLIENT_URL}" target="_blank">LinkNow</a></td></tr>
          </table>
        </body>
      </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error("Ошибка при отправке письма:", err);
    throw new Error("Не удалось отправить письмо подтверждения");
  }
};

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ message: "Все поля обязательны для заполнения" });
    }

    const [existingUser] = await req.db.query(
      "SELECT * FROM User WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким email уже существует" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    await req.db.query(
      "INSERT INTO User (email, username, passwordHash, verify, verifyToken, phone, firstname, lastname, delivery, city, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        email,
        username,
        passwordHash,
        false,
        verifyToken,
        req.body.phone || null,
        req.body.firstname || null,
        req.body.lastname || null,
        req.body.delivery || null,
        req.body.city || null,
        req.body.address || null,
      ]
    );

    await sendVerificationEmail(email, verifyToken);

    res.status(201).json({
      message:
        "Регистрация прошла успешно. Проверьте ваш email для подтверждения.",
    });
  } catch (err) {
    console.error("Ошибка при регистрации:", err);
    res
      .status(500)
      .json({ message: "Не удалось зарегистрироваться", error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email и пароль обязательны" });
    }

    const [user] = await req.db.query("SELECT * FROM User WHERE email = ?", [
      email,
    ]);

    if (!user.length) {
      return res.status(400).json({ message: "Пользователь не найден" });
    }

    if (!user[0].verify) {
      return res.status(400).json({ message: "Подтвердите вашу почту" });
    }

    const isValidPass = await bcrypt.compare(password, user[0].passwordHash);
    if (!isValidPass) {
      return res.status(400).json({ message: "Неверный пароль" });
    }

    const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    const { passwordHash, verifyToken, ...userData } = user[0];

    res.status(200).json({ ...userData, token });
  } catch (err) {
    console.error("Ошибка при авторизации:", err);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(400).json({ message: "Не передан ID пользователя" });
    }

    const [user] = await req.db.query("SELECT * FROM User WHERE id = ?", [
      req.userId,
    ]);

    if (!user.length) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const { passwordHash, verifyToken, ...userData } = user[0];
    res.json({ ...userData });
  } catch (err) {
    console.error("Ошибка при получении данных пользователя", err);
    res
      .status(500)
      .json({ message: "Ошибка при получении данных пользователя" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const [user] = await req.db.query(
      "SELECT * FROM User WHERE verifyToken = ?",
      [token]
    );

    if (!user.length) {
      return res.status(400).json({ message: "Неверный токен" });
    }

    await req.db.query(
      "UPDATE User SET verify = TRUE, verifyToken = NULL WHERE id = ?",
      [user[0].id]
    );
    res.status(200).json({ message: "Ваш email подтвержден" });
  } catch (err) {
    console.error("Ошибка при верификации:", err);
    res
      .status(500)
      .json({ message: "Ошибка при подтверждении email", error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const [users] = await req.db.query(
      "SELECT id, email, username, verify, createdAt FROM User"
    );

    res.status(200).json(users);
  } catch (err) {
    console.error("Ошибка при получении списка пользователей:", err);
    res.status(500).json({
      message: "Не удалось получить список пользователей",
      error: err.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [user] = await req.db.query("SELECT id FROM User WHERE id = ?", [id]);

    if (!user.length) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    await req.db.query("DELETE FROM User WHERE id = ?", [id]);

    res.status(200).json({ message: "Пользователь успешно удален" });
  } catch (err) {
    console.error("Ошибка при удалении пользователя:", err);
    res.status(500).json({
      message: "Не удалось удалить пользователя",
      error: err.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.userId) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    const { firstname, lastname, phone, delivery, city, address } = req.body;

    const [user] = await req.db.query("SELECT * FROM User WHERE id = ?", [
      req.userId,
    ]);

    if (!user.length) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    await req.db.query(
      "UPDATE User SET firstname = ?, lastname = ?, phone = ?, delivery = ?, city = ?, address = ? WHERE id = ?",
      [firstname, lastname, phone, delivery, city, address, req.userId]
    );

    const [updatedUser] = await req.db.query(
      "SELECT * FROM User WHERE id = ?",
      [req.userId]
    );

    const { passwordHash, verifyToken, ...userData } = updatedUser[0];

    res.status(200).json({
      message: "Данные пользователя успешно обновлены",
      user: userData,
    });
  } catch (err) {
    console.error("Ошибка при обновлении данных пользователя:", err);
    res.status(500).json({
      message: "Не удалось обновить данные пользователя",
      error: err.message,
    });
  }
};
