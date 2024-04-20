// services/eventService.js
export async function fetchAvailableTeachers(eventId, token) {
    if (!eventId) {
      throw new Error("Event ID is null or undefined.");
    }
  
    const response = await fetch(
      `${process.env.REACT_APP_ENDPOINT}/available-teachers?eventId=${eventId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
  
    return await response.json();
  }
  
  export async function assignTeacher(eventId, teacherId, userEmail, token) {
    const assignResponse = await fetch(
      `${process.env.REACT_APP_ENDPOINT}/assign-teacher`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          teacherId,
          email: userEmail,
        }),
      }
    );
  
    if (!assignResponse.ok) {
      throw new Error(`Error: ${assignResponse.statusText}`);
    }
  
    return await assignResponse.json();
  }
  