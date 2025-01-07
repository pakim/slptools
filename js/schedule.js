// Define the days, hours, and minutes
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const hours = [8, 9, 10, 11, 12, 1, 2];
const minutes = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/**
 * Database setup and functions.
 */
const sqlite3 = require("sqlite3").verbose();

/**
 * Connects to the SQLite database.
 */
function connectToDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("./data/data.db", err => {
      if (err) {
        reject("Error connecting to the database:", err.message);
      } else {
        console.log("Connected to the database.");
        resolve(db);
      }
    });
  });
}

/**
 * Fetches all sessions from the database.
 */
function fetchSessions(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * from sessions", (err, rows) => {
      if (err) {
        reject("Error fetching data:", err.message);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Adds a new session to the database.
 */
function addSession(db, sessionData) {
  return new Promise((resolve, reject) => {
    const {
      selectedDay,
      startTime,
      sessionLength,
      start,
      end,
      roomNumber,
      studentValues = [], // Default to an empty array if no students are provided
    } = sessionData;

    // Dynamically build the columns and placeholders for the students
    const studentColumns = studentValues.map((_, index) => `student_${index + 1}`).join(", ");
    const studentPlaceholders = studentValues.map(() => "?").join(", ");

    // Construct the SQL query dynamically
    const sql = `
      INSERT INTO sessions (day, start_time, session_length, start, end, room_number${
        studentColumns ? `, ${studentColumns}` : ""
      }) 
      VALUES (?, ?, ?, ?, ?, ?${studentPlaceholders ? `, ${studentPlaceholders}` : ""})
    `;

    // Combine all values for placeholders
    const values = [selectedDay, startTime, sessionLength, start, end, roomNumber, ...studentValues];

    // Execute the query
    db.run(sql, values, err => {
      if (err) {
        reject("Error inserting data:", err.message);
      } else {
        resolve("Insert session successful");
      }
    });
  });
}

/**
 * Creates and displays session containers onto the schedule.
 */
async function displaySessions(sessions) {
  // sessions = await fetchSessions(db);
  console.log("in displaysessions");
  console.log(sessions);
  sessions.forEach(session => {
    const startTime = session.start_time;
    const sessionLength = session.session_length;
    const selectedDay = session.day;

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
    sessionContainer.style.height = "118px";
    sessionContainer.style.backgroundColor = "rgb(0, 123, 255)"; // Light blue background
    sessionContainer.style.left = `${totalOffset}px`;

    // Get the correct day container
    const dayContainer = document.getElementById(selectedDay).querySelector(".day-schedule");

    // Add the session container to the beginning of the day's schedule
    dayContainer.prepend(sessionContainer);
  });
}

/**
 * Dynamically generates a schedule visualization with time labels and day containers.
 */
function loadScheduleVisual() {
  // Dynamically generate the elements for the time row
  const timeLabelsContainer = document.querySelector(".time-labels");

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
}

/**
 * Validates user input data when adding a new session.
 */
function validateSessionInfo(sessions) {
  console.log(sessions);
  let isValid = true;
  const startTime = document.getElementById("start-time").value;
  const sessionLength = document.getElementById("session-length").value;

  // Verify correct startTime format (03:00 or 3:00)
  const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])$/;
  if (!timeRegex.test(startTime) || startTime === "") {
    const errorText = document.getElementById("start-error");
    errorText.classList.remove("hidden");
    isValid = false;
  }

  // Verify session length is not too big/small
  if (sessionLength < 10 || sessionLength === "") {
    const errorText = document.getElementById("length-error");
    errorText.classList.remove("hidden");
    isValid = false;
  }

  // Verify session time does not conflict with an existing session
  const start = convertTimeToNumber(startTime);
  const end = start + sessionLength;

  // Display error if start and end time overlaps with an existing session's start and end time
  sessions.forEach(session => {
    if (
      (session.start > start && session.start < end) ||
      (session.end > start && session.end < end)
    ) {
      const errorText = document.getElementById("conflict-error");
      errorText.classList.remove("hidden");
      isValid = false;
    }
  });

  return isValid;
}

/**
 * Converts the time string into a number value that is easier to compare if sessions overlap.
 */
function convertTimeToNumber(time) {
  const [hour, minute] = time.split(":").map(Number);
  let total = hour * 60 + minute;

  if (hour < hours[0]) {
    total += 12 * 60;
  }

  return total;
}

document.addEventListener("DOMContentLoaded", async () => {
  let sessions;
  let db;

  // Dynamically add schedule elements (time row and days)
  loadScheduleVisual();

  // Database connection and fetch sessions
  try {
    db = await connectToDatabase();
    sessions = await fetchSessions(db);
    displaySessions(sessions);
    console.log("Fetched data:");
  } catch (error) {
    console.error(error);
  }

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

  // Add session button event listener
  addButton.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  // Modal close button event listener
  closeButton.addEventListener("click", () => {
    modal.style.display = "none";
    document.querySelectorAll(".error").forEach(element => {
      element.classList.add("hidden");
    });
  });

  // Add Student button event listener. Adds input for another student
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

  // Save button event listener
  saveButton.addEventListener("click", () => {
    if (validateSessionInfo(sessions)) {
      // Get modal fields
      const selectedDay = document.getElementById("day-options").value;
      const startTime = document.getElementById("start-time").value;
      const sessionLength = parseInt(document.getElementById("session-length").value);
      const roomNumber = document.getElementById("room-number").value;
      const students = document.querySelectorAll(".student");

      // Retrieve all non-empty student input values
      const studentValues = Array.from(students)
        .map(student => student.value.trim()) // Get the trimmed value of each input
        .filter(value => value !== ""); // Keep only non-empty strings

      const start = convertTimeToNumber(startTime);
      const end = start + sessionLength;

      const sessionData = {
        selectedDay,
        startTime,
        sessionLength,
        start,
        end,
        roomNumber,
        studentValues,
      };

      try {
        addSession(db, sessionData);
      } catch (error) {
        console.error(error);
      }

      // Close the modal
      modal.style.display = "none";
      document.querySelectorAll(".error").forEach(element => {
        element.classList.add("hidden");
      });
    }
  });
});
