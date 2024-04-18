import React, { useState } from "react";
import { useSignup } from "../../hooks/useSignup";
import "./register.css"
const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { signup, error, isLoading } = useSignup();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await signup(email, password);
    };

    return (
        <div className="register-container">
            <form onSubmit={handleSubmit} className="register-form">
                <h3>Register page</h3>
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
    );
};

export default Register;
