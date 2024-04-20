import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../hooks/useAuthContext";
import Spinner from "../Spinner";
import { fetchAvailableTeachers, assignTeacher } from "./api";
import "./deleteevent.css";

const DeleteEventModal = ({ eventId, onClose }) => {
  // State variables
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();

  // Effect hook to fetch available teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        // Simulating delay with setTimeout for spinner visibility
        const timer = setTimeout(async () => {
          const teachers = await fetchAvailableTeachers(eventId, user.token);
          setAvailableTeachers(teachers);
          setLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Failed to fetch available teachers:", error);
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [eventId, user]);

  // Handler for teacher selection change
  const handleSelectionChange = (teacherId) => {
    setSelectedTeacherId(teacherId);
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTeacherId) {
      alert("Please select a teacher to assign before deleting");
      return;
    }

    try {
      await assignTeacher(eventId, selectedTeacherId, user.email, user.token);
      onClose();
    } catch (error) {
      console.error("Failed to assign teacher or delete schedule:", error);
    }
  };

  // JSX rendering
  return (
    <div className="delete-event-modal">
      <h3>Select a Teacher:</h3>
      {/* Display spinner while loading */}
      {loading && <Spinner />}
      <form onSubmit={handleSubmit}>
        {/* Map through available teachers */}
        {availableTeachers.map((teacher) => (
          <div key={teacher.id} className="modal-inner">
            <label>
              <input
                type="radio"
                value={teacher.id}
                checked={selectedTeacherId === teacher.id}
                onChange={() => handleSelectionChange(teacher.id)}
              />
              {teacher.name}
            </label>
            <p>{teacher.email}</p>
          </div>
        ))}
        {/* Display assign button if teacher is selected */}
        {selectedTeacherId && <button type="submit">Assign Teacher</button>}
      </form>
      {/* Cancel button */}
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default DeleteEventModal;
