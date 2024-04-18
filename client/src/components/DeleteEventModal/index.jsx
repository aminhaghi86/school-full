import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../hooks/useAuthContext";
import Spinner from "../Spinner";

const DeleteEventModal = ({ eventId, onClose }) => {
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchAvailableTeachers = async () => {
      if (!eventId) {
        console.error("Event ID is null or undefined.");
        return;
      }

      setLoading(true);

      const timer = setTimeout(async () => {
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

          const data = await response.json();
          setAvailableTeachers(data);
        } catch (error) {
          console.error("Failed to fetch available teachers:", error);
        } finally {
          setLoading(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    };

    fetchAvailableTeachers();
  }, [eventId, user]);

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

      onClose();
    } catch (error) {
      console.error("Failed to assign teacher or delete schedule:", error);
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
      {loading && <Spinner />}
      <form onSubmit={handleSubmit}>
        {availableTeachers.map((teacher) => (
          <div key={teacher.id}>
            <p>{teacher.email}</p>
            <label>
              <input
                type="radio"
                value={teacher.id}
                checked={selectedTeacherId === teacher.id}
                onChange={() => handleSelectionChange(teacher.id)}
              />
              {teacher.name}
            </label>
          </div>
        ))}

        {selectedTeacherId && <button type="submit">Assign Teacher</button>}
      </form>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default DeleteEventModal;
