import React, { useState } from "react";
import { useSignup } from "../../hooks/useSignup";
import Lampsvg from "../../components/Lampsvg";
import "./register.css";
const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signup, error, isLoading } = useSignup();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup(email, password);
  };

  return (
    <div className="register-page">
      <div className="image-container">
        <Lampsvg />
      </div>
      <div className="register-container">
        <form onSubmit={handleSubmit} className="register-form">
          <h3>Register</h3>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button disabled={isLoading}>Register</button>
          {error && <div className="error-container">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default Register;
