// hooks/useSocket.js

import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const useSocket = (user, setEvents) => {
  useEffect(() => {
    if (!user) return undefined;

    const socketInstance = io("http://localhost:8000");

    // Define all event listeners
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
      // setDeleteMode(false);
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

    // Return a cleanup function to disconnect and remove all event listeners
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
  }, [user, setEvents]);
};

export default useSocket;
