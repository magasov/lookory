import React from "react";
import axios from "./axios";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Main from "./pages/Main";
import VerifyEmail from "./VerifyEmail";
import Header from "./components/Header";
import Admin from "./pages/Admin";
import ProductPage from "./pages/ProductPage";
import FavoritePages from "./pages/FavoritePages";
import MyProfile from "./pages/Profile";
import CartPages from "./pages/CartPages";
import NotFound from "./pages/NotFound";
import Footer from "./pages/Footer";
import Orders from "./pages/Orders";

// Protected route for admin-only access
const ProtectedAdminRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/men-home" replace />;
  if (!user.isAdmin) return <Navigate to="/men-home" replace />;
  return children;
};

function App() {
  const [user, setUser] = React.useState(null);
  const [loadingUser, setLoadingUser] = React.useState(true);
  const location = useLocation();

  React.useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      axios
        .get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUser(response.data);
        })
        .catch((error) => {
          console.error("Ошибка при получении данных пользователя:", error);
          setUser(null);
        })
        .finally(() => {
          setLoadingUser(false);
        });
    } else {
      setLoadingUser(false);
    }
  }, []);

  if (loadingUser) {
    return "Загрузка...";
  }

  const shouldHideHeader = location.pathname === "/404";

  return (
    <div className="App">
      {!shouldHideHeader && <Header user={user} />}

      <Routes>
        <Route path="/" element={<Navigate to="/men-home" replace />} />
        <Route path="/men-home" element={<Main gender="men" />} />
        <Route path="/women-home" element={<Main gender="women" />} />
        <Route path="/profile" element={<MyProfile user={user} />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute user={user}>
              <Admin />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/men-home/product/:id" element={<ProductPage />} />
        <Route path="/favorite" element={<FavoritePages />} />
        <Route path="/cart" element={<CartPages user={user} />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      {!shouldHideHeader && <Footer />}
    </div>
  );
}

export default App;
