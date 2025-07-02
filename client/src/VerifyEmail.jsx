import React, { useEffect, useState } from "react";
import axios from "./axios"; // используйте ваш axios-инстанс
import { useParams } from "react-router-dom";

const VerifyEmail = () => {
  const [message, setMessage] = useState("");
  const { token } = useParams();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`/auth/verify/${token}`);
        setMessage(response.data.message);
      } catch (error) {
        setMessage("Не удалось подтвердить email.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div>
      <h2>Подтверждение Email</h2>
      <p>{message}</p>
    </div>
  );
};

export default VerifyEmail;
