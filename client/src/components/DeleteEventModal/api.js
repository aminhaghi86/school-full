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
  
  // services/eventService.js
// The assignTeacher has been updated according to the parameters used in the component

export async function assignTeacher(eventId, teacherIds, userEmail, token) {
  if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
    throw new Error('Invalid or empty teacherIds: Expected a non-empty array');
  }

  const body = {
    eventId,
    teacherIds, // This is now an array of ids directly
    email: userEmail,
    token
  };

  const response = await fetch(
    `${process.env.REACT_APP_ENDPOINT}/assign-teacher`, // Endpoint updated assuming batch assignment
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  return await response.json();
}

  
  