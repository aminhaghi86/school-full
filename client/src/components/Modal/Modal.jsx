import React from "react";
import "./modal.css";

// ... rest of the Modal component ...

const Modal = ({ onClose, onDelete, children, onAccept, onDeny,selectedEvent }) => {
  console.log('modal selecenen',selectedEvent);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <div className="modal-content">{children}</div>
        <div className="modal-buttons">
          {/* Add Accept and Deny buttons conditionally */}
          {selectedEvent && selectedEvent.status === "pending" && (
            <button className="accept-button" onClick={onAccept}>
              Accept Event
            </button>
          )}
          {onDeny && (
            <button className="deny-button" onClick={onDeny}>
              Deny
            </button>
          )}
          <button className="delete-button" onClick={onDelete}>
            Delete Event
          </button>
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;

