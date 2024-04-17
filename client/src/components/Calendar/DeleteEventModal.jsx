import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../hooks/useAuthContext";
const DeleteEventModal = ({ eventId, onClose }) => {
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const { user } = useAuthContext();
  // Function to fetch available teachers

  console.log("eventId", eventId);
  console.log("selectedTeacherId", selectedTeacherId);
  // Fetch available teachers when component mounts
  useEffect(() => {
    const fetchAvailableTeachers = async () => {
      // Check if eventId is null or undefined
      if (!eventId) {
        console.error("Event ID is null or undefined.");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_ENDPOINT}/available-teachers?eventId=${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        console.log("response", response);
        const data = await response.json();
        setAvailableTeachers(data);
      } catch (error) {
        console.error("Failed to fetch available teachers:", error);
      }
    };

    fetchAvailableTeachers();
  }, [eventId, user]);

  // Function to handle teacher selection
  const handleSelectionChange = (teacherId) => {
    setSelectedTeacherId(teacherId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTeacherId) {
      alert("Please select a teacher to assign before deleting");
      return;
    }

    try {
      // Try to assign the teacher first
      const assignResponse = await fetch(
        `${process.env.REACT_APP_ENDPOINT}/assign-teacher`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            eventId,
            teacherId: selectedTeacherId,
          }),
        }
      );

      if (!assignResponse.ok)
        throw new Error(`Error: ${assignResponse.statusText}`);
      const assignData = await assignResponse.json();
      console.log("Teacher assigned:", assignData);

      // // After successful assignment, proceed to delete the schedule
      // const deleteResponse = await fetch(
      //   `${process.env.REACT_APP_ENDPOINT}/${eventId}`,
      //   {
      //     method: "DELETE",
      //     headers: {
      //       Authorization: `Bearer ${user.token}`,
      //     },
      //   }
      // );

      // if (!deleteResponse.ok) throw new Error(`Error: ${deleteResponse.statusText}`);
      // const deleteData = await deleteResponse.json();
      // console.log("Schedule deleted:", deleteData);

      onClose(); // Close the modal after successful deletion
    } catch (error) {
      console.error("Failed to assign teacher or delete schedule:", error);
      // Handle error case here
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        zIndex: "99999",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "50vh",
        height: "50vh",
        background: "#cccccc",
        borderRadius: "1rem",
        overflowY: "auto",
        padding: "1rem",
      }}
    >
      <h3>Select a Teacher:</h3>
      <form onSubmit={handleSubmit}>
        {availableTeachers.map((teacher) => (
          <>
            <p>{teacher.email}</p>
            <label key={teacher.id}>
              <input
                type="radio"
                value={teacher.id}
                checked={selectedTeacherId === teacher.id}
                onChange={() => handleSelectionChange(teacher.id)}
              />
              {teacher.name}
            </label>
          </>
        ))}
        <button type="submit">Assign Teacher</button>
      </form>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default DeleteEventModal;
