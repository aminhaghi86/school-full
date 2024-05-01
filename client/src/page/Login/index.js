import React, { useState } from "react";
import { useLogin } from "../../hooks/useLogin";
import Navbar from "../../components/Navbar";
import "./login.css";
import Lampsvg from "../../components/Lampsvg";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, isLoading } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
    setEmail("");
    setPassword("");
  };

  return (
    <>
      <Navbar />
      <div className="login-page">
        <div className="login-container">
          <form onSubmit={handleSubmit} className="login-form">
            <h3>login</h3>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
            <button disabled={isLoading}>Login</button>
            {error && <div className="error-container">{error}</div>}
          </form>
        </div>
        <div className="image-container">
          <Lampsvg />
        </div>
      </div>
    </>
  );
};

export default Login;
