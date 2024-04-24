import axios from 'axios';

const BASE_URL = process.env.REACT_APP_ENDPOINT;

// Factory function to generate headers with authorization token
const headers = (token) => ({
  Authorization: `Bearer ${token}`,
});


//  * Fetch all events based on provided filters.

export const fetchEvents = async (user, filterCourse ) => {
  try {
    const response = await axios.get(`${BASE_URL}`, {
      headers: headers(user.token),
    });
    
    let fetchedEvents = response.data.map(event => ({
      ...event,
      className: `event-${event.status}`,
    }));
    
    if (filterCourse !== 'ALL') {
      fetchedEvents = fetchedEvents.filter(event => event.course === filterCourse);
    }
    
    return fetchedEvents;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};


export const createEvent = async (eventData, user) => {
  try {
    const response = await axios.post(`${BASE_URL}`, eventData, {
      headers: headers(user.token),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};


export const updateEvent = async (eventId, eventData, user) => {
  try {
    const response = await axios.put(`${BASE_URL}/${eventId}`, eventData, {
      headers: headers(user.token),
    });
    return response.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};


export const deleteEvent = async (eventId, user) => {
  try {
    await axios.delete(`${BASE_URL}/${eventId}`, {
      headers: headers(user.token),
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

