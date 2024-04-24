// overlapEvent.js
export const isEventOverlap = (events, startDate, endDate, ignoreEventId = null) => {
    return events.some((event) => {
      if (ignoreEventId === event.id) {
        return false;
      }
      return startDate < new Date(event.end) && new Date(event.start) < endDate;
    });
  };
  