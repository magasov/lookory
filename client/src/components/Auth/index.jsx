import React, { useState } from "react";
import axios from "../../axios";
import { Toaster, toast } from "sonner";

import "./style.scss";
import close from "../../assets/icon/close.svg";

const Auth = ({ setIsPopupAuth }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isForgotPassword) {
        const response = await axios.post("/auth/forgot-password", {
          email: form.email,
        });
        toast.success(response.data.message || "Письмо отправлено на почту");
      } else if (isRegister) {
        await axios.post("/auth/register", form);
        toast.success(
          "Регистрация прошла успешно! Проверьте ваш email для подтверждения."
        );
        resetStates();
      } else {
        const { data } = await axios.post("/auth/login", {
          email: form.email,
          password: form.password,
        });

        localStorage.setItem("token", data.token);
        toast.success("Успешный вход!");
        setIsPopupAuth(false);
        window.location.reload();
      }
    } catch (err) {
      console.error("Ошибка:", err.response?.data);
      setError(
        err.response?.data?.message ||
          "Произошла ошибка. Пожалуйста, попробуйте позже."
      );
      toast.error(err.response?.data?.message || "Произошла ошибка.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetStates = () => {
    setIsRegister(false);
    setIsForgotPassword(false);
    setForm({ email: "", password: "", username: "" });
  };

  return (
    <>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          duration: 2000,
          style: {
            padding: "16px",
          },
        }}
      />
      <div className="auth">
        <div className="auth__popup">
          <h1>
            {isForgotPassword
              ? "Восстановление пароля"
              : isRegister
              ? "Регистрация"
              : "Авторизация"}
          </h1>

          <img
            src={close}
            alt="close"
            className="close__popup"
            onClick={() => setIsPopupAuth(false)}
          />

          <div className="auth__main">
            {error && <div className="auth__error">{error}</div>}

            <p>
              {isForgotPassword
                ? "Введите ваш e-mail, и мы вышлем ссылку для сброса пароля."
                : isRegister
                ? "Зарегистрируйтесь, чтобы оформить заказы и отслеживать покупки."
                : "Войдите в аккаунт, чтобы оформить заказ и просматривать историю покупок."}
            </p>

            <input
              type="text"
              placeholder="E-mail"
              name="email"
              value={form.email}
              onChange={handleChange}
              disabled={isLoading}
            />

            {isRegister && (
              <input
                type="text"
                placeholder="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                disabled={isLoading}
              />
            )}

            {!isForgotPassword && (
              <input
                type="password"
                placeholder="Пароль"
                name="password"
                value={form.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            )}

            {!isRegister && !isForgotPassword && (
              <span
                className="auth__forgot"
                onClick={() => !isLoading && setIsForgotPassword(true)}
              >
                Забыли ваш пароль?
              </span>
            )}

            <div className="auth__btn">
              <button onClick={handleSubmit} disabled={isLoading}>
                {isLoading
                  ? "Загрузка..."
                  : isForgotPassword
                  ? "Сбросить пароль"
                  : isRegister
                  ? "Зарегистрироваться"
                  : "Авторизироваться"}
              </button>

              {!isForgotPassword && (
                <button
                  onClick={() => !isLoading && setIsRegister(!isRegister)}
                  disabled={isLoading}
                >
                  {isRegister ? "Уже есть аккаунт?" : "Создать новый аккаунт"}
                </button>
              )}

              {isForgotPassword && (
                <button
                  onClick={() => !isLoading && setIsForgotPassword(false)}
                  disabled={isLoading}
                >
                  Назад к авторизации
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
