import React, { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import { io } from "socket.io-client";
import { useAuthContext } from "../../hooks/useAuthContext";
import { ToastContainer, toast } from "react-toastify";
import Modal from "../Modal/Modal";
import DeleteEventModal from "../DeleteEventModal";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
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
  const [deleteMode, setDeleteMode] = useState(false);
  const [calendarView, setCalendarView] = useState("timeGridWeek");
  const calendarRef = useRef(null);
  const [filterCourse, setFilterCourse] = useState("ALL");
  const courses = [
    { value: "ALL", label: "All" },
    { value: "HTML", label: "HTML" },
    { value: "CSS", label: "CSS" },
    { value: "JAVASCRIPT", label: "JavaScript" },
    { value: "REACT", label: "React" },
    { value: "VUE", label: "Vue" },
    { value: "ANGULAR", label: "Angular" },
  ];
  useEffect(() => {
    if (!user) return;

    return () => {};
  }, [user]);

  useEffect(() => {
    const socketInstance = io("http://localhost:8000");

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
      toast.success("server : New event created!");
      console.log("server created event", data);
    };
    const handleMessageDeletedFromServer = (data) => {
      toast.warn("server : event Deleted!");
      console.log("server deleted event", data);
    };
    const handleMessageUpdatedFromServer = (data) => {
      toast.info("server : event Updated!");
      console.log("server updated event", data);
    };
    const handleAssignTask = (data) => {
      // Output data received from server to console
      console.log("data from server", data);
    
      // Update the calendar with the new event data
      setEvents((prevEvents) => [...prevEvents, data.event]);
    
      // Refetch events to ensure the calendar is up-to-date
      calendarRef.current.getApi().refetchEvents();
      // Show a toast notification indicating a new event has been assigned
      toast.info(`server: event comes from ${data.sendUser} to your calendar`);
    };
    
    const scheduleNotFounded = (data) => {
      console.log("event deleted - not found available teacher", data);
      toast.info(`server : event ${data.course} deleted  from DB`);
      setDeleteMode(false);
    };
    socketInstance.on("message-from-server", handleMessageFromServer);
    socketInstance.on("scheduleCreated", handleMessageCreatedFromServer);
    socketInstance.on("scheduleDeleted", handleMessageDeletedFromServer);
    socketInstance.on("scheduleUpdated", handleMessageUpdatedFromServer);
    socketInstance.on("eventAssigned", handleAssignTask);
    socketInstance.on("event-not-founded", scheduleNotFounded);
    socketInstance.on("eventAccepted", ({ eventId, acceptedBy }) => {
      if (user.userId !== acceptedBy) {
        setEvents((prevEvents) =>
          prevEvents.filter(
            (event) => event.id !== eventId && event.status !== "pending"
          )
        );
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socketInstance.off("message-from-server");
      socketInstance.off("scheduleCreated");
      socketInstance.off("scheduleUpdated");
      socketInstance.off("scheduleDeleted");
      socketInstance.off("eventAssigned");
      socketInstance.off("event-not-founded");
      socketInstance.off("eventAccepted");
      socketInstance.disconnect();
    };
  }, [user]);

  const fetchEvents = useCallback(async () => {
    try {
      if (!user) return;

      const response = await axios.get(`${process.env.REACT_APP_ENDPOINT}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Cache-Control": "no-cache",
        },
      });
      let fetchedEvents = response.data.map((event) => ({
        ...event,
        className: `event-${event.status}`,
      }));
      if (filterCourse !== "ALL") {
        fetchedEvents = fetchedEvents.filter(
          (event) => event.course === filterCourse
        );
      }
      setEvents(fetchedEvents);
    } catch (error) {
      console.log(error);
    }
  }, [user, filterCourse]);
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
    // The dependency array was missing; added `[user, fetchEvents]`
    return () => {
      setEvents([]);
    };
  }, [user, fetchEvents]);
  const handleSelect = (selectInfo) => {
    const start = selectInfo.start;
    const end = selectInfo.end;

    const isOverlap = isEventOverlap(start, end);

    if (!isOverlap) {
      setSelectedEvent({
        id: selectInfo.id,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        title: selectInfo.title,
        description: selectInfo.description,
        course: selectInfo.course,
      });
      setShowModal(true);
    } else {
      toast.error(
        "This time slot is already booked. Please choose another time."
      );
    }
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
        status: clickedEvent.extendedProps.status, // Ensure status is included here
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

  const isEventOverlap = (startDate, endDate, ignoreEventId = null) => {
    return events.some((event) => {
      if (ignoreEventId === event.id) {
        return false;
      }
      return startDate < new Date(event.end) && new Date(event.start) < endDate;
    });
  };

  const handleViewChange = (view, currentView) => {
    console.log("view", view);
    console.log("currentvire", currentView);
    setCalendarView(currentView.title);
  };

  const handleEventDrop = async (dropInfo) => {
    const startDate = dropInfo.event.start;
    const endDate = dropInfo.event.end;
    const movedEventId = dropInfo.event.id;

    const isOverlap = isEventOverlap(startDate, endDate, movedEventId);
    if (!isOverlap) {
      // No overlap found, continue with updating the event
      const updatedEvent = {
        id: movedEventId,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        title: dropInfo.event.title,
        description: dropInfo.event.extendedProps.description,
        course: dropInfo.event.extendedProps.course || "HTML",
        status: dropInfo.event.extendedProps.status,
      };

      try {
        const response = await axios.put(
          `${process.env.REACT_APP_ENDPOINT}/${movedEventId}`,
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
          toast.success("Event successfully updated.");
        } else {
          console.error("Error updating event: Unexpected response", response);
          dropInfo.revert(); // Revert the event back to its original position
        }
      } catch (error) {
        console.error("Error updating event:", error);
        toast.error("Failed to update the event.");
        dropInfo.revert(); // Revert the event back to its original position
      }
    } else {
      // Overlap found, revert the changes and alert the user
      toast.error(
        "Cannot move to this time slot as it conflicts with other events."
      );
      dropInfo.revert();
    }
  };

  const handleEventResize = async (resizeInfo) => {
    const updatedEvent = {
      id: resizeInfo.event.id,
      start: resizeInfo.event.startStr,
      end: resizeInfo.event.endStr,
      title: resizeInfo.event.title,
      description: resizeInfo.event.extendedProps.description,
      course: resizeInfo.event.extendedProps.course,
    };

    // Check if the event overlaps with any existing (excluding itself)
    const isOverlap = isEventOverlap(
      new Date(updatedEvent.start),
      new Date(updatedEvent.end),
      updatedEvent.id
    );

    if (isOverlap) {
      toast.error("Event times conflict with an existing event.");
      resizeInfo.revert(); // Revert the event back to its original duration
      return;
    }

    try {
      // Update the event in the backend
      const response = await axios.put(
        `${process.env.REACT_APP_ENDPOINT}/${updatedEvent.id}`,
        updatedEvent,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        const updatedEventData = response.data;

        // Update events state with the new event data
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === updatedEventData.id
              ? { ...event, ...updatedEventData }
              : event
          )
        );

        toast.success("Event updated successfully.");
      } else {
        toast.error("Failed to update event.");
        console.error("Error updating event: Unexpected response", response);
        resizeInfo.revert(); // In case of server errors, revert the event duration change
      }
    } catch (error) {
      toast.error("An error occurred while updating the event.");
      console.error("Error updating event:", error);
      resizeInfo.revert(); // Revert the event back to its original duration
    }
  };
  const handleDeleteClick = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (confirmDelete) {
      // User confirmed; proceed with deletion
      await handleDeleteEvent();
    } else {
      // User canceled; no further action needed
      console.log("Deletion cancelled by user.");
    }
  };

  const handleDeleteEvent = async () => {
    try {
      if (!user || !selectedEvent) {
        return;
      }
      setDeleteMode(true);
      // Send a request to delete the event

      const response = await axios.delete(
        `${process.env.REACT_APP_ENDPOINT}/${selectedEvent.id}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        // Update events directly using the state setter
        setEvents((prevEvents) =>
          prevEvents.filter((event) => event.id !== selectedEvent.id)
        );
        calendarRef.current.getApi().refetchEvents();
        // toast.success("Event successfully deleted.");
      } else {
        console.error("Error deleting event: Unexpected response", response);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete the event.");
    } finally {
      setShowModal(false);
    }
  };

  const handleSaveEvent = async () => {
    // Prevent saving if mandatory fields are not filled or if no user is logged in
    if (
      !user ||
      !selectedEvent ||
      !selectedEvent.title ||
      !selectedEvent.course
    ) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const start = new Date(selectedEvent.start);
    const end = new Date(selectedEvent.end);
    const isOverlap = isEventOverlap(start, end, selectedEvent.id);

    if (isOverlap) {
      toast.error("Event times conflict with an existing event.");
      return;
    }

    const url = selectedEvent.id
      ? `${process.env.REACT_APP_ENDPOINT}/${selectedEvent.id}`
      : process.env.REACT_APP_ENDPOINT;
    const method = selectedEvent.id ? "PUT" : "POST";

    try {
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
        // Add new event
        setEvents([...events, updatedEventData]);
      }

      toast.success(
        `client : Event ${selectedEvent.id ? "updated" : "added"} successfully.`
      );
      setSelectedEvent(null);
      setShowModal(false);
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save the event.");
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
    return () => {
      setEvents([]);
    };
  }, [user, fetchEvents]);
  const handleCourseChange = (e) => {
    const selectedCourse = e.target.value;
    setFilterCourse(selectedCourse);
  };

  const handleAcceptEvent = async () => {
    if (!user || !selectedEvent) return; // Check if user and event are available.

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_ENDPOINT}/accept-event`, // Use the correct endpoint for accepting an event.
        {
          eventId: selectedEvent.id,
          userId: user.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success("You have accepted the event.");
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === selectedEvent.id
              ? { ...event, status: "accepted" }
              : event
          )
        );
        setShowModal(false);
      } else {
        toast.error("Failed to accept the event.");
      }
    } catch (error) {
      console.error("Error while accepting event:", error);
      toast.error("An error occurred while accepting the event.");
    }
  };

  return (
    <div style={{ margin: "5rem 0" }}>
      <ToastContainer position="bottom-left" autoClose={1500} />
      <div>
        {courses.map((course) => (
          <label key={course.value}>
            <input
              type="radio"
              value={course.value}
              name="course"
              checked={filterCourse === course.value}
              onChange={handleCourseChange}
            />
            {course.label}
          </label>
        ))}
      </div>
      <div>
        <button onClick={() => changeView("today")}>Today</button>
        <button onClick={() => changeView("timeGridWeek")}>Week</button>
        <button onClick={() => changeView("dayGridMonth")}>Month</button>
        <button onClick={() => changeView("multiMonthYear")}>
          Multi-Month
        </button>
        <button onClick={() => changeView("listMonth")}>List</button>
      </div>
      <FullCalendar
      key={events.length}
        height="78vh"
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
        onViewChange={handleViewChange}
        selectable={true}
        select={handleSelect}
        events={events.map((event) => ({
          ...event,
          className: `event-${event.status}`, // Apply the class based on status
        }))}
        eventClick={handleEditEvent}
        editable={true}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
      />
      {showModal && (
        <Modal
          selectedEvent={selectedEvent}
          onClose={() => setShowModal(false)}
          onAccept={handleAcceptEvent}
          onDelete={handleDeleteClick}
        >
          <div className="modal-container">
            {/* Date and time */}
            <div className="date-time">
              <span>From:{new Date(selectedEvent.start).toLocaleString()}</span>
              <span>to: {new Date(selectedEvent.end).toLocaleString()}</span>
            </div>

            {/* Event name input */}
            <input
              className="event-name"
              type="text"
              placeholder="Event Name"
              value={selectedEvent.title}
              onChange={(e) => handleInputChange(e, "title")}
            />

            {/* Event description textarea */}
            <textarea
              className="event-description"
              placeholder="Event Description"
              value={selectedEvent.description}
              onChange={(e) => handleInputChange(e, "description")}
              maxLength={100}
              minLength={1}
            ></textarea>

            {/* Course select */}
            <select
              className="course-select"
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

            {/* Save button */}
            <button className="save-button" onClick={handleSaveEvent}>
              Save Event
            </button>

            {/* Status */}
            {selectedEvent.status === "active" && (
              <div className="status">Active</div>
            )}
          </div>
        </Modal>
      )}

      {deleteMode && (
        <DeleteEventModal
          eventId={selectedEvent.id}
          onClose={() => {
            setDeleteMode(false);
            setSelectedEvent({
              id: null,
              start: null,
              end: null,
              title: "",
              description: "",
              course: "",
            });
          }}
        />
      )}
    </div>
  );
};

export default Calendar;
