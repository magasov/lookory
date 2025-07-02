import { body } from "express-validator";

export const loginValidations = [
  body("email", "Некорректный формат email").isEmail(),
  body("password", "Пароль должен содержать не менее 6 символов").isLength({
    min: 6,
  }),
];

export const registerValidations = [
  body("email", "Некорректный формат email").isEmail(),
  body("password", "Пароль должен содержать не менее 6 символов").isLength({
    min: 6,
  }),
  body(
    "username",
    "Имя пользователя обязательно и должно быть не менее 3 символов"
  ).isLength({ min: 3 }),
  body("avatar", "Некорректный URL для аватара").optional().isURL(),
];
