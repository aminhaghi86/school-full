import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../hooks/useAuthContext";
import Spinner from "../Spinner";
import { fetchAvailableTeachers, assignTeacher } from "./api";
import "./deleteevent.css";

const DeleteEventModal = ({ eventId, onClose }) => {
  // State variables
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();

  // Effect hook to fetch available teachers
  useEffect(() => {
    let timer;

    const fetchTeachers = async () => {
      setLoading(true);
      try {
        timer = setTimeout(async () => {
          const teachers = await fetchAvailableTeachers(eventId, user.token);
          // Set the initial isSelected property for each teacher
          const teachersWithSelection = teachers.map((teacher) => ({
            ...teacher,
            isSelected: false,
          }));
          setAvailableTeachers(teachersWithSelection);
          setLoading(false);
        }, 2000); // Delay of 2 seconds
      } catch (error) {
        console.error("Failed to fetch available teachers:", error);
        setLoading(false);
      }
    };

    if (eventId) {
      fetchTeachers();
    }

    return () => clearTimeout(timer); // Clear timeout when the component unmounts or dependencies change
  }, [eventId, user.token]);


  // Handler for form submission
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    // Include IDs of all available teachers directly
    const selectedTeacherIds = availableTeachers.map((teacher) => teacher.id);

    setLoading(true); // Set loading state for UI indication

    try {
      // Call "assignTeacher" with the array of teacher IDs
      const responses = await assignTeacher(
        eventId,
        selectedTeacherIds,
        user.email,
        user.token
      );

      console.log("Teachers assigned successfully:", responses);
      onClose();
    } catch (error) {
      console.error("Error during form submission:", error);
    }

    setLoading(false); 
  };

  return (
    <div className="delete-event-modal">
      <h3>Select a Teacher:</h3>
      {loading && <Spinner />}
      <form onSubmit={handleSubmit}>
        {availableTeachers.map((teacher) => (
          <div key={teacher.id} className="modal-inner">
            <label>
              <input type="checkbox" checked={true} readOnly />
              {teacher.name}
            </label>
            <p>{teacher.email}</p>
          </div>
        ))}
        <button type="submit">
          {availableTeachers.length < 2 ? "Assign Teacher" : "Assign Teachers"}
        </button>
      </form>
      {/* Cancel button */}
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default DeleteEventModal;
