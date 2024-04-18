import React, { useState } from "react";
import { useLogin } from "../../hooks/useLogin";
import './login.css'
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
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h3>Login page</h3>
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
    );
};

export default Login;
