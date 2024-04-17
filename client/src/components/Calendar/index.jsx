import React, { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Modal from "./Modal";
import axios from "axios";
import { io } from "socket.io-client";
import { useAuthContext } from "../../hooks/useAuthContext";
import { ToastContainer, toast } from "react-toastify";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
const Calendar = () => {
  const { user } = useAuthContext();
  const [selectedEvent, setSelectedEvent] = useState({
    id: null,
    start: null,
    end: null,
    title: "",
    description: "",
    course: "",
  });
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [calendarView, setCalendarView] = useState("timeGridWeek");
  const calendarRef = useRef(null);
  useEffect(() => {
    if (!user) return;

    return () => {};
  }, [user]);
  useEffect(() => {
    const socketInstance = io("http://localhost:8001");

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      socketInstance.emit("teacherConnected", user.userId);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    const handleMessageFromServer = (data) => {
      console.log("data server", data);
      setEvents((prev) => [...prev, data]);
    };
    const handleMessageCreatedFromServer = (data) => {
      if (data.creatorId === user.id) {
        toast.success("New event created!");
      }
      console.log("server created event", data);
    };
    socketInstance.on("message-from-server", handleMessageFromServer);
    socketInstance.on("scheduleCreated", handleMessageCreatedFromServer);

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socketInstance.disconnect();
      socketInstance.off("message-from-server", handleMessageFromServer);
      socketInstance.off(
        "server scheduleCreated",
        handleMessageCreatedFromServer
      );
    };
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      if (!user) return;

      const response = await axios.get(`${process.env.REACT_APP_ENDPOINT}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Cache-Control": "no-cache",
        },
      });
      const fetchedEvents = response.data.map((event) => ({
        ...event,
        className: `event-${event.status}`,
      }));
      setEvents(fetchedEvents);
    } catch (error) {
      console.log(error);
    }
  }, [user]);

  const handleAcceptEvent = async () => {
    if (!user || !selectedEvent) {
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_ENDPOINT}/${selectedEvent.id}/accept`,
        { scheduleId: selectedEvent.id },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.status === 200) {
        const updatedEvent = {
          ...selectedEvent,
          status: "accepted",
          className: "event-accepted",
        };

        // Update local state immediately
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === selectedEvent.id ? updatedEvent : event
          )
        );
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        alert("This schedule has already been accepted by another teacher.");
        fetchEvents();
      } else {
        console.error("Error accepting event:", error);
      }
    }

    setSelectedEvent(null);
    setShowModal(false);
  };

  const handleDenyEvent = async () => {
    if (!user || !selectedEvent) {
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_ENDPOINT}/${selectedEvent.id}/deny`,
        { scheduleId: selectedEvent.id },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.status === 200) {
        const updatedEvent = {
          ...selectedEvent,
          status: "denied",
          className: "event-denied",
        };

        // Update local state immediately
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === selectedEvent.id ? updatedEvent : event
          )
        );
      }
    } catch (error) {
      console.error("Error denying event:", error);
    }

    setSelectedEvent(null);
    setShowModal(false);
  };

  const handleSelect = (selectInfo) => {
    setSelectedEvent({
      id: selectInfo.id,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      title: selectInfo.title,
      description: selectInfo.description,
      course: "",
    });
    setShowModal(true);
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
        course: clickedEvent.extendedProps.course || "",
      });
      setShowModal(true);
    } else {
      console.warn("Clicked event not found");
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
      let calendar = calendarRef.current.getApi();
      calendar.changeView(view);
      setCalendarView(view);
    }
  };

  const handleViewChange = (view, currentView) => {
    setCalendarView(currentView.title);
  };

  const handleEventDrop = async (dropInfo) => {
    const { id, startStr, endStr, title, extendedProps } = dropInfo.event;
    const updatedEvent = {
      id,
      start: startStr,
      end: endStr,
      title,
      description: extendedProps.description,
      course: extendedProps.course || "HTML",
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
      course: resizeInfo.event.course || "HTML",
    };
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_ENDPOINT}/${updatedEvent.id}`,
        updatedEvent,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            cache: "no-cache",
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
  const handleDeleteEvent = async () => {
    try {
      if (!user || !selectedEvent) {
        return;
      }

      // Send a request to delete the event
      await axios.delete(
        `${process.env.REACT_APP_ENDPOINT}/${selectedEvent.id}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setEvents(events.filter((event) => event.id !== selectedEvent.id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }

    // Reset selectedEvent and hide the modal
    setSelectedEvent(null);
    setShowModal(false);
  };

  const handleSaveEvent = async () => {
    if (!user || !selectedEvent || !selectedEvent.course) {
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

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
    return () => {
      setEvents([]);
    };
  }, [user, fetchEvents]);

  return (
    <div style={{ margin: "10rem 0" }}>
      <ToastContainer position="bottom-left"/>
      <div>
        <button onClick={() => changeView("today")}>Today</button>
        <button onClick={() => changeView("timeGridWeek")}>Week</button>
        <button onClick={() => changeView("dayGridMonth")}>Month</button>
      </div>
      <FullCalendar
        slotMinTime="08:00:00"
        slotMaxTime="17:00:00"
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
        editable={true}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
      />
      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          onDelete={handleDeleteEvent}
          onAccept={handleAcceptEvent}
          onDeny={handleDenyEvent}
        >
          <h2>
            {selectedEvent.start} - {selectedEvent.end}
          </h2>
          <input
            type="text"
            placeholder="Event Name"
            value={selectedEvent.title}
            onChange={(e) => handleInputChange(e, "title")}
          />
          <textarea
            placeholder="Event Description"
            value={selectedEvent.description}
            onChange={(e) => handleInputChange(e, "description")}
            style={{ resize: "none" }}
            maxLength={100}
            minLength={1}
          ></textarea>
          <select
            value={selectedEvent.course}
            required
            onChange={(e) => handleInputChange(e, "course")}
          >
            <option value="">Choose a course</option>
            <option value="HTML">HTML</option>
            <option value="CSS">CSS</option>
            <option value="JAVASCRIPT">JavaScript</option>
            <option value="REACT">React</option>
            <option value="VUE">Vue</option>
            <option value="ANGULAR">Angular</option>
          </select>

          <button className="save-button" onClick={handleSaveEvent}>
            Save Event
          </button>
          {selectedEvent.status === "active" && (
            <>
              <button className="accept-button" onClick={handleAcceptEvent}>
                Accept Event
              </button>
              <button className="deny-button" onClick={handleDenyEvent}>
                Deny Event
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Calendar;
