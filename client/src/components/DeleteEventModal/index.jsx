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
            isSelected: false
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

  // Handler for teacher selection change
  const handleSelectionChange = (teacherId) => {
    setAvailableTeachers(prevAvailableTeachers =>
      prevAvailableTeachers.map(teacher => ({
        ...teacher,
        isSelected: teacher.id === teacherId ? !teacher.isSelected : teacher.isSelected,
      }))
    );
  };

  // Handler for form submission
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    const selectedTeacherIds = availableTeachers
      .filter((teacher) => teacher.isSelected)
      .map((teacher) => teacher.id);

    if (selectedTeacherIds.length === 0) {
      console.error('No teachers selected.');
      return; // Exit the function if there are no teacher IDs to process
    }

    setLoading(true); // Set loading state for UI indication

    try {
      // Call "assignTeacher" with the array of teacher IDs
      const responses = await assignTeacher(eventId, selectedTeacherIds, user.email, user.token);

      // Handle the response according to your application's needs
      console.log('Teachers assigned successfully:', responses);

      // Close the modal or refresh the teacher list based on your app's requirements
      onClose();
    } catch (error) {
      console.error('Error during form submission:', error);
    }

    setLoading(false); // Reset loading state after operation
  };

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
                type="checkbox"
                
                onChange={() => handleSelectionChange(teacher.id)}
                checked={teacher.isSelected}
              />
              {teacher.name}
            </label>
            <p>{teacher.email}</p>
          </div>
        ))}
        <button type="submit">Assign Teachers</button>
      </form>
      {/* Cancel button */}
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default DeleteEventModal;
