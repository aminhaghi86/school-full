// FullCalendarComponent.js
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";

const CalendarComponent = ({
  calendarRef,
  handleSelect,
  handleEditEvent,
  handleEventDrop,
  handleEventResize,
  events,
  calendarView,
}) => {
  return (
    <FullCalendar
      height="90vh"
      width="100%"
      slotMinTime="08:00:00"
      slotMaxTime="17:00:00"
      nowIndicator={true}
      now={new Date()}
      navLinks={true}
      multiMonthMaxColumns={1}
      dayMaxEvents={true}
      ref={calendarRef}
      plugins={[
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin,
        listPlugin,
        multiMonthPlugin,
      ]}
      initialView={"timeGridWeek"}
      headerToolbar={{
        start: (() => {
          switch (calendarView) {
            case "timeGridDay":
              return "prev,next";
            case "timeGridWeek":
              return "prev,next";
            case "dayGridMonth":
              return "prev,next";
            case "listMonth":
              return "prev,next";
            case "multiMonthYear":
              return "prev,next";
            default:
              return "";
          }
        })(),
        center: "title",
        end: "",
      }}
      selectable={true}
      select={handleSelect}
      events={events.map((event) => ({
        ...event,
        className: `event-${event.status}`,
      }))}
      eventClick={handleEditEvent}
      editable={true}
      eventDrop={handleEventDrop}
      eventResize={handleEventResize}
    />
  );
};

export default CalendarComponent;
