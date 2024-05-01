import React from "react";
import { useLogout } from "../../hooks/useLogout";
import { useAuthContext } from "../../hooks/useAuthContext";
import "./profile.css";
const Profile = () => {
  const { logout } = useLogout();
  const { user } = useAuthContext();
  const handleClick = () => {
    logout();
  };
  return (
    <>
      {user && (
        <div className="profile-container">
          <img
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            alt="profile"
            className="image"
          />
          <span className="profile">{user.email}</span>
          <button className="logout" onClick={handleClick}>
            Logout
          </button>
        </div>
      )}
    </>
  );
};

export default Profile;
