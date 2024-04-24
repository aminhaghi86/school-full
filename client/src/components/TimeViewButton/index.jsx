// ViewButtons.js
import React from 'react';

const TimeViewButtons = ({ changeView }) => {
  return (
    <div>
      <button onClick={() => changeView("today")}>Today</button>
      <button onClick={() => changeView("timeGridWeek")}>Week</button>
      <button onClick={() => changeView("dayGridMonth")}>Month</button>
      <button onClick={() => changeView("multiMonthYear")}>
        Multi-Month
      </button>
      <button onClick={() => changeView("listMonth")}>List</button>
    </div>
  );
};

export default TimeViewButtons;
