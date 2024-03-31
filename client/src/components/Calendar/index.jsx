import React, { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Modal from "./Modal";
import axios from "axios";
import { useAuthContext } from "../../hooks/useAuthContext";

const Calendar = () => {
  const { user } = useAuthContext();
  const [selectedEvent, setSelectedEvent] = useState({
    id: null,
    start: null,
    end: null,
    title: "",
    description: "",
  });
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [calendarView, setCalendarView] = useState("timeGridWeek");
  const calendarRef = useRef(null);

  const handleSelect = (selectInfo) => {
    setSelectedEvent({
      id: selectInfo.id,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      title: selectInfo.title,
      description: selectInfo.description ,
    });
    setShowModal(true);
  };

  const handleSaveEvent = async () => {
    if (!user || !selectedEvent) {
      return;
    }

    try {
      const url = selectedEvent.id
        ? `${process.env.REACT_APP_ENDPOINT}/${selectedEvent.id}`
        : `${process.env.REACT_APP_ENDPOINT}`;

      const method = selectedEvent.id ? "PUT" : "POST";

      const response = await axios({
        method,
        url,
        data: selectedEvent,
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const updatedEventData = response.data;
      if (selectedEvent.id) {
        // Update existing event
        setEvents(
          events.map((event) =>
            event.id === updatedEventData.id ? updatedEventData : event
          )
        );
      } else {
        // Create new event
        setEvents([...events, updatedEventData]);
      }
    } catch (error) {
      console.error("Error saving event:", error);
    }

    setSelectedEvent(null);
    setShowModal(false);
  };

  const handleEditEvent = (clickInfo) => {
    const clickedEvent = clickInfo.event;
    if (clickedEvent) {
      setSelectedEvent({
        id: clickedEvent.id,
        start: clickedEvent.startStr,
        end: clickedEvent.endStr,
        title: clickedEvent.title || "Untitled Event",
        description: clickedEvent.extendedProps.description || "",
      });
      setShowModal(true);
    } else {
      console.warn("Clicked event not found");
    }
  };

  const handleDeleteEvent = async () => {
    if (!user || !selectedEvent) {
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_ENDPOINT}/${selectedEvent.id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      setEvents(events.filter((event) => event.id !== selectedEvent.id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }

    setSelectedEvent(null);
    setShowModal(false);
  };

  const handleEventDrop = async (dropInfo) => {
    const { id, startStr, endStr, title, extendedProps } = dropInfo.event;
    const updatedEvent = {
      id,
      start: startStr,
      end: endStr,
      title,
      description: extendedProps.description,
    };

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_ENDPOINT}/${id}`,
        updatedEvent,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        const updatedEventData = response.data;
        const updatedEvents = events.map((event) =>
          event.id === updatedEventData.id ? updatedEventData : event
        );
        setEvents(updatedEvents);
      } else {
        console.error("Error updating event: Unexpected response", response);
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleEventResize = async (resizeInfo) => {
    const updatedEvent = {
      id: resizeInfo.event.id,
      start: resizeInfo.event.startStr,
      end: resizeInfo.event.endStr,
      title: resizeInfo.event.title,
      description: resizeInfo.event.description,
    };
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_ENDPOINT}/${updatedEvent.id}`,
        updatedEvent,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      if (response.status >= 200 && response.status < 300) {
        const updatedEventData = response.data;
        setEvents(
          events.map((event) =>
            event.id === updatedEventData.id ? updatedEventData : event
          )
        );
      } else {
        console.error("Error updating event: Unexpected response", response);
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleInputChange = (e, field) => {
    if (selectedEvent) {
      const updatedEvent = {
        ...selectedEvent,
        [field]: e.target.value,
      };
      setSelectedEvent(updatedEvent);
    }
  };

  const changeView = (view) => {
    if (view === "today") {
      let calendar = calendarRef.current.getApi();
      calendar.changeView("timeGridDay");
      calendar.gotoDate(new Date());
    } else {
      console.log("Changing view to:", view);
      let calendar = calendarRef.current.getApi();
      calendar.changeView(view);
      console.log("New calendar view:", calendar.view.title);
      setCalendarView(view);
    }
  };

  const handleViewChange = (view, currentView) => {
    setCalendarView(currentView.title);
    console.log(view);
  };
  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_ENDPOINT}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setEvents(response.data);
    } catch (error) {
      console.log(error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, fetchEvents]);
  // Only user dependency here

  return (
    <div style={{ margin: "10rem 0" }}>
      <div>
        <button onClick={() => changeView("today")}>Today</button>
        <button onClick={() => changeView("timeGridWeek")}>Week</button>
        <button onClick={() => changeView("dayGridMonth")}>Month</button>
      </div>
      <FullCalendar
        nowIndicator={true}
        now={new Date()}
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
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
              default:
                return "";
            }
          })(),
          center: "title",
          end: "",
        }}
        onViewChange={handleViewChange}
        selectable={true}
        select={handleSelect}
        events={events}
        eventClick={handleEditEvent}
        editable={true} // Enable drag and drop
        eventDrop={handleEventDrop} // Handle event drop
        eventResize={handleEventResize} // Handle event resize
      />
      {showModal && (
        <Modal onClose={() => setShowModal(false)} onDelete={handleDeleteEvent}>
          <h2>
            {selectedEvent.start} - {selectedEvent.end}
          </h2>
          <input
            type="text"
            placeholder="Event Name"
            // Set value from selectedEvent.title (assuming it's a state variable)
            value={selectedEvent.title}
            onChange={(e) => handleInputChange(e, "title")}
          />
          <textarea
            placeholder="Event Description"
            value={selectedEvent.description}
            onChange={(e) => handleInputChange(e, "description")}
          ></textarea>
          <button className="save-button" onClick={handleSaveEvent}>
            Save Event
          </button>
        </Modal>
      )}
    </div>
  );
};

export default Calendar;
