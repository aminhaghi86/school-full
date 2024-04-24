import React, { useState, useRef, useEffect } from "react";
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
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../utils/eventServices";
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    if (user) {
      const getEvents = async () => {
        try {
          const fetchedEvents = await fetchEvents(user, filterCourse);
          setEvents(fetchedEvents);
        } catch (error) {
          toast.error("Error fetching events.");
          console.error(error);
        }
      };
      getEvents();
    }
  }, [user, filterCourse]);

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
      setEvents((prevEvents) => [...prevEvents, data]);
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
      console.log("data from server", data);
      // Access event and status from data
      const { event } = data;

      // Ensure event is defined
      if (event) {
        setEvents((prevEvents) => {
          // Check if the event already exists in the state
          const updatedEvents = prevEvents.map((e) => {
            if (e.id === event.id) {
              // If the event exists, update its status
              return { ...e, status: event.status };
            }
            return e;
          });
          if (!prevEvents.some((e) => e.id === event.id)) {
            updatedEvents.push(event);
          }
          return updatedEvents;
        });

        toast.info(
          `Server: Event added to your calendar from ${data.sendUser}`
        );
      } else {
        console.error("Event is undefined:", data);
      }
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
      setEvents((prevEvents) =>
        prevEvents
          .map((event) => {
            if (event.id === eventId) {
              return {
                ...event,
                status: acceptedBy === user.userId ? "accepted" : "removed",
              };
            }
            return event;
          })
          .filter((event) => event.status !== "removed")
      );
    });

    // Add a listener for the 'eventRemoved' event from the server
    socketInstance.on("eventRemoved", (data) => {
      const { removedEventId } = data;
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== removedEventId)
      );
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
      socketInstance.off("eventRemoved");
      socketInstance.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (user) {
    }
    // The dependency array was missing; added `[user, fetchEvents]`
    return () => {
      setEvents([]);
    };
  }, [user]);
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
        status: clickedEvent.extendedProps.status,
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
      setHasUnsavedChanges(true);
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

  const handleEventDrop = async (dropInfo) => {
    const startDate = dropInfo.event.start;
    const endDate = dropInfo.event.end;
    const movedEventId = dropInfo.event.id;
    if (dropInfo.event.extendedProps.status === "pending") {
      toast.error("Pending events cannot be moved.");
      dropInfo.revert();
      return;
    }
    const isOverlap = isEventOverlap(startDate, endDate, movedEventId);
    if (!isOverlap) {
      // No overlap found, continue with updating the event

      try {
        const updatedEventData = await updateEvent(
          movedEventId,
          {
            start: dropInfo.event.startStr,
            end: dropInfo.event.endStr,
            title: dropInfo.event.title,
            description: dropInfo.event.extendedProps.description,
            course: dropInfo.event.extendedProps.course,
            status: dropInfo.event.extendedProps.status,
          },
          user
        );
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === updatedEventData.id ? updatedEventData : event
          )
        );
        toast.success("Event successfully updated.");
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
    if (resizeInfo.event.extendedProps.status === "pending") {
      toast.error("Pending events cannot be resized.");
      resizeInfo.revert();
      return;
    }
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
      if (!user || !selectedEvent) return;

      setDeleteMode(true);

      await deleteEvent(selectedEvent.id, user);

      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== selectedEvent.id)
      );
      calendarRef.current.getApi().refetchEvents();

      toast.success("Event deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete the event.");
      console.error(error);
    } finally {
      setShowModal(false);
    }
  };

  const handleSaveEvent = async () => {
    if (selectedEvent.status === "pending") {
      toast.error("Cannot save a pending event.");
      return;
    }
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

    try {
      let updatedEventData;
      if (selectedEvent.id) {
        updatedEventData = await updateEvent(
          selectedEvent.id,
          selectedEvent,
          user
        );
      } else {
        updatedEventData = await createEvent(selectedEvent, user);
      }

      setEvents((prevEvents) =>
        selectedEvent.id
          ? prevEvents.map((event) =>
              event.id === updatedEventData.id ? updatedEventData : event
            )
          : [...prevEvents, updatedEventData]
      );

      toast.success(
        `Event ${selectedEvent.id ? "updated" : "created"} successfully.`
      );
      setSelectedEvent(null);
      setShowModal(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Failed to save the event.");
      console.error(error);
    }
  };

  useEffect(() => {
    if (user) {
      
    }
    return () => {
      setEvents([]);
    };
  }, [user]);
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
        // onViewChange={handleViewChange}
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
              readOnly={selectedEvent.status === "pending"}
            />

            {/* Event description textarea */}
            <textarea
              className="event-description"
              placeholder="Event Description"
              value={selectedEvent.description}
              onChange={(e) => handleInputChange(e, "description")}
              readOnly={selectedEvent.status === "pending"}
              maxLength={100}
              minLength={1}
            ></textarea>

            {/* Course select */}
            <select
              className="course-select"
              value={selectedEvent.course}
              required
              disabled={selectedEvent.status === "pending"}
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

            {/* {(selectedEvent.status === "accepted" || !selectedEvent.status) && (
              <button className="save-button" onClick={handleSaveEvent}  disabled={!hasUnsavedChanges}>
                Save Event
              </button>
            )} */}
            {(!selectedEvent.id || hasUnsavedChanges) && (
              <button className="save-button" onClick={handleSaveEvent}>
                Save Event
              </button>
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
