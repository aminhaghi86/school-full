import React, { useState, useRef, useEffect } from "react";
import useSocket from "../../hooks/useSocket";
import axios from "axios";
import { useAuthContext } from "../../hooks/useAuthContext";
import { ToastContainer, toast } from "react-toastify";
import DeleteEventModal from "../DeleteEventModal";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../utils/eventServices";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import { Course } from "../Course";
import TimeViewButtons from "../TimeViewButton";
import EventDetailsModal from "../EventDetailsModal";
import CalendarComponent from "../CalendarComponent";
import { isEventOverlap } from "../../utils/overlapEvent";
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
  useSocket(user, setEvents);
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

    const isOverlap = isEventOverlap(events, start, end);

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

  const handleEventDrop = async (dropInfo) => {
    const startDate = dropInfo.event.start;
    const endDate = dropInfo.event.end;
    const movedEventId = dropInfo.event.id;
    if (dropInfo.event.extendedProps.status === "pending") {
      toast.error("Pending events cannot be moved.");
      dropInfo.revert();
      return;
    }
    const isOverlap = isEventOverlap(events, startDate, endDate, movedEventId);
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
    const isOverlap = isEventOverlap(
      events,
      new Date(updatedEvent.start),
      new Date(updatedEvent.end),
      updatedEvent.id
    );

    if (isOverlap) {
      toast.error("Event times conflict with an existing event.");
      resizeInfo.revert();
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
      await handleDeleteEvent();
    } else {
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
    const isOverlap = isEventOverlap(events, start, end, selectedEvent.id);

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
    if (!user || !selectedEvent) return;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_ENDPOINT}/accept-event`,
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
  const onClose = () => {
    setDeleteMode(false);
    setSelectedEvent({
      id: null,
      start: null,
      end: null,
      title: "",
      description: "",
      course: "",
    });
  };

  return (
    <div style={{ margin: "5rem 0" }}>
      <ToastContainer position="bottom-left" autoClose={500} />

      <Course
        filterCourse={filterCourse}
        handleCourseChange={handleCourseChange}
      />

      <TimeViewButtons changeView={changeView} />
      <CalendarComponent
        calendarRef={calendarRef}
        handleSelect={handleSelect}
        handleEditEvent={handleEditEvent}
        handleEventDrop={handleEventDrop}
        handleEventResize={handleEventResize}
        events={events}
        calendarView={calendarView}
      />
      {showModal && (
        <EventDetailsModal
          selectedEvent={selectedEvent}
          handleInputChange={handleInputChange}
          handleSaveEvent={handleSaveEvent}
          onClose={() => setShowModal(false)}
          onAccept={handleAcceptEvent}
          onDelete={handleDeleteClick}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      )}

      {deleteMode && (
        <DeleteEventModal eventId={selectedEvent.id} onClose={onClose} />
      )}
    </div>
  );
};

export default Calendar;
