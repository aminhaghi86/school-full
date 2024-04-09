import React from "react";
import "./modal.css";

const Modal = ({ onClose, onDelete, children,onAccept,onDeny }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <div className="modal-content">{children}</div>
        <div className="modal-buttons">
          <button className="delete-button" onClick={onDelete}>
            Delete Event
          </button>
          <button className="save-button" onClick={onClose}>
            Close
          </button>
          {onAccept && <button onClick={onAccept}>Accept</button>}
          {onDeny && <button onClick={onDeny}>Deny</button>}
        </div>
      </div>
    </div>
  );
};

export default Modal;
