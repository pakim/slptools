// Dynamically generate the elements for the time row
const timeLabelsContainer = document.querySelector(".time-labels");

// Define the hours and minutes
const hours = [8, 9, 10, 11, 12, 1, 2];
const minutes = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

// Generate the time labels
hours.forEach((hour, index) => {
  const timeDiv = document.createElement("div");
  timeDiv.classList.add("time");

  const hourDiv = document.createElement("div");
  hourDiv.classList.add("hour");
  hourDiv.textContent = `${hour}:00`;
  timeDiv.appendChild(hourDiv);

  const minutesDiv = document.createElement("div");
  minutesDiv.classList.add("minutes");

  minutes.forEach((minute, index) => {
    const minuteDiv = document.createElement("div");
    minuteDiv.classList.add("minute");
    if (index === 0) {
      minuteDiv.classList.add("first-minute");
    }
    minuteDiv.textContent = minute < 10 ? `0${minute}` : minute;
    minutesDiv.appendChild(minuteDiv);
  });

  timeDiv.appendChild(minutesDiv);
  timeLabelsContainer.appendChild(timeDiv);
});

// Dynamically generate the elements for the days
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const scheduleContainer = document.querySelector(".schedule-container");

// Populate days-container with day elements
days.forEach(day => {
  const dayContainer = document.createElement("div");
  dayContainer.classList.add("day-container");
  dayContainer.id = day;

  // Day text
  const dayDiv = document.createElement("div");
  dayDiv.classList.add("day");
  const dayText = document.createElement("div");
  dayText.classList.add("day-text");
  dayText.textContent = day;

  dayDiv.appendChild(dayText);
  dayContainer.appendChild(dayDiv);

  // Day schedule
  const daySchedule = document.createElement("div");
  daySchedule.classList.add("day-schedule");
  dayContainer.appendChild(daySchedule);

  scheduleContainer.appendChild(dayContainer);
});

document.addEventListener("DOMContentLoaded", () => {
  // Get the modal
  const modal = document.getElementById("modal");

  // Get the button that opens the modal
  const addButton = document.querySelector(".add");

  // Get the <span> element that closes the modal
  const closeButton = document.getElementById("close");

  // Get the Student field and add button
  const studentFields = document.getElementById("studentFields");
  const addStudentButton = document.getElementById("addStudent");

  const saveButton = document.getElementById("save-button"); // Save button

  // When the user clicks the "Add" button, open the modal
  addButton.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // When the user clicks on <span> (x), close the modal
  closeButton.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Handle adding a new student input
  addStudentButton.addEventListener("click", () => {
    const newStudentInput = document.createElement("div");
    newStudentInput.classList.add("student-input");

    // Create input and remove button
    const studentInput = document.createElement("input");
    studentInput.type = "text";
    studentInput.classList.add("student");
    studentInput.name = "students[]";
    studentInput.placeholder = "Student's Name";

    const removeButton = document.createElement("button");
    removeButton.textContent = "X";
    removeButton.classList.add("removeStudent");

    // Prevent removal of the first student input
    removeButton.addEventListener("click", () => {
      if (studentFields.children.length > 1) {
        studentFields.removeChild(newStudentInput);
      }
    });

    newStudentInput.appendChild(studentInput);
    newStudentInput.appendChild(removeButton);
    studentFields.appendChild(newStudentInput);
  });

  // When the user clicks "Save", create the session container on the schedule
  saveButton.addEventListener("click", () => {
    // Get selected day
    const selectedDay = document.getElementById("dayOptions").value;

    // Get start time and session length
    const startTime = document.getElementById("startTime").value;
    const sessionLength = document.getElementById("sessionLength").value;

    // Parse start time hour and minute
    const [startHour, startMinute] = startTime.split(":").map(Number);

    // Calculate the session container's left offset position
    let hourOffset = startHour;
    if (startHour < hours[0]) {
      hourOffset += 12;
    }
    hourOffset -= hours[0];
    // 228 is the number of pixels for an hour. 19 for every 5 minutes
    let totalOffset = hourOffset * 228 + (startMinute / 5) * 19;

    // Calculate the width of the session container based on the time difference
    const sessionWidth = (sessionLength / 5) * 19; // 19px per 5 minutes

    // Create the session container
    const sessionContainer = document.createElement("div");
    sessionContainer.classList.add("session-container");
    sessionContainer.style.width = `${sessionWidth}px`;
    sessionContainer.style.height = "118px"; // Fixed height as mentioned
    sessionContainer.style.backgroundColor = "rgb(0, 123, 255)"; // Light blue background
    sessionContainer.style.left = `${totalOffset}px`;

    // Get the correct day container
    const dayContainer = document.getElementById(selectedDay).querySelector(".day-schedule");

    // Add the session container to the beginning of the day's schedule
    dayContainer.prepend(sessionContainer);

    // Close the modal
    modal.style.display = "none";
  });
});
