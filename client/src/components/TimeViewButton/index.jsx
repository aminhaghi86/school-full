import React from 'react';
import './viewbutton.css'
const TimeViewButtons = ({ changeView }) => {
  const handleSelectChange = (event) => {
    changeView(event.target.value);
  };

  return (
    <div className='time-view-button'>
      <label htmlFor="viewSelector">Filter by Date:</label>
      <select id="viewSelector" onChange={handleSelectChange}>
        <option value="timeGridWeek">Week</option>
        <option value="today">Today</option>
        <option value="dayGridMonth">Month</option>
        <option value="multiMonthYear">Multi-Month</option>
        <option value="listMonth">List</option>
      </select>
    </div>
  );
};

export default TimeViewButtons;
