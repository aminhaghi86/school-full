import React from "react";
import "./viewbutton.css";

const TimeViewButtons = ({ changeView }) => {
  const handleRadioChange = (event) => {
    changeView(event.target.value);
  };

  const viewOptions = [
    { value: "timeGridWeek", label: "Week" },
    { value: "today", label: "Today" },
    { value: "dayGridMonth", label: "Month" },
    { value: "multiMonthYear", label: "Multi-Month" },
    { value: "listMonth", label: "List" },
  ];

  return (
    <div className="time-view-button">
      <label>Filter by Date:</label>
      {viewOptions.map((option) => (
        <div key={option.value}>
          <input
            type="radio"
            id={option.value}
            name="viewSelector"
            value={option.value}
            onChange={handleRadioChange}
            defaultChecked={option.value === "timeGridWeek"}
          />
          <label htmlFor={option.value}>{option.label}</label>
        </div>
      ))}
    </div>
  );
};

export default TimeViewButtons;
