// EventDetailsModal.js
import React from 'react';
import Modal from '../Modal/Modal'; 

const EventDetailsModal = ({
  selectedEvent,
  handleInputChange,
  handleSaveEvent,
  onClose,
  onAccept,
  onDelete,
  hasUnsavedChanges
}) => {
  return (
    <Modal
      selectedEvent={selectedEvent}
      onClose={onClose}
      onAccept={onAccept}
      onDelete={onDelete}
    >
      <div className="modal-container">
        {/* Date and time */}
        <div className="date-time">
          <span>From: {new Date(selectedEvent.start).toLocaleString()}</span>
          <span>To: {new Date(selectedEvent.end).toLocaleString()}</span>
        </div>

        {/* Event name input */}
        <input
          className="event-name"
          type="text"
          placeholder="Event Name"
          value={selectedEvent.title}
          onChange={(e) => handleInputChange(e, "title")}
          readOnly={selectedEvent.status === "pending"}
        />

        {/* Event description textarea */}
        <textarea
          className="event-description"
          placeholder="Event Description"
          value={selectedEvent.description}
          onChange={(e) => handleInputChange(e, "description")}
          readOnly={selectedEvent.status === "pending"}
          maxLength={100}
          minLength={1}
        ></textarea>

        {/* Course select */}
        <select
          className="course-select"
          value={selectedEvent.course}
          required
          disabled={selectedEvent.status === "pending"}
          onChange={(e) => handleInputChange(e, "course")}
        >
          <option value="">Choose a course</option>
          <option value="HTML">HTML</option>
          <option value="CSS">CSS</option>
          <option value="JAVASCRIPT">JavaScript</option>
          <option value="REACT">React</option>
          <option value="VUE">Vue</option>
          <option value="ANGULAR">Angular</option>
        </select>

        {/* Save button */}
        {(!selectedEvent.id || hasUnsavedChanges) && (
          <button className="save-button" onClick={handleSaveEvent}>
            Save Event
          </button>
        )}
      </div>
    </Modal>
  );
};

export default EventDetailsModal;
