import React from "react";
import "./course.css";
const courses = [
  { value: "ALL", label: "All" },
  { value: "HTML", label: "HTML" },
  { value: "CSS", label: "CSS" },
  { value: "JAVASCRIPT", label: "JavaScript" },
  { value: "REACT", label: "React" },
  { value: "VUE", label: "Vue" },
  { value: "ANGULAR", label: "Angular" },
];
export const Course = ({ filterCourse, handleCourseChange }) => {
  return (
    <div className="course-container">
      <label>Filter by Course:</label>
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
  );
};
