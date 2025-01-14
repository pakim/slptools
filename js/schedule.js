// Define the days, hours, and minutes
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const hours = [8, 9, 10, 11, 12, 1, 2];
const minutes = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

import {
  connectToDatabase,
  fetchSessions,
  fetchStudents,
  addSession,
  addStudent,
  updateSession,
  deleteSession,
} from "./database.js";

/**
 * Dynamically generates a schedule visualization with time labels and day containers with lines every 5 minutes.
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
 * Takes in the end field of a session and converts it to a time formatted string.
 * @param {number} end The end field of a session object.
 * @returns {string} Time string equivalent to the end number. Ex: `600` -> `10:00`
 */
function getEndTime(end) {
  const minute = end % 60;

  // Convert from 24 hour to 12 hour
  let hour = Math.floor(end / 60) % 12;
  if (hour === 0) {
    hour = 12;
  }

  return minute === 0 ? `${hour}:${minute}0` : `${hour}:${minute}`;
}

/**
 * Converts the time string into a number value that is easier to compare if sessions overlap.
 * @param {string} time String containing a time.
 * @returns {number} Number equivalent of time. Every hour is 60 and every minute is 1. Ex: `9:00` -> `540`
 */
function convertTimeToNumber(time) {
  const [hour, minute] = time.split(":").map(Number);
  let total = hour * 60 + minute;

  if (hour < hours[0]) {
    total += 12 * 60;
  }

  return total;
}

/**
 * Checks if the given students are already within the database's students table.
 * @param {object[]} studentList Array of student objects that contain student database data.
 * @param {string[]} studentValues Array of student names that were added to a session.
 * @returns {string[]} Array of student names that are not in the database.
 */
function checkStudentInDatabase(studentList, studentValues) {
  const newStudents = [];

  studentValues.forEach(student => {
    let inDatabase = false;
    studentList.forEach(databaseStudent => {
      if (student === databaseStudent.name) {
        inDatabase = true;
      }
    });
    if (!inDatabase && student !== "") {
      newStudents.push(student);
    }
  });

  return newStudents;
}

/**
 * Validates user input data when adding a new session.
 * @param {object[]} sessions Array of session objects that contain session database data.
 * @returns {boolean} `true` if input data has no issues, otherwise `false`.
 */
function validateSessionInfo(sessions, id) {
  let isValid = true;
  const startTime = document.getElementById("start-time").value.trim();
  const sessionLength = parseInt(document.getElementById("session-length").value);
  const selectedDay = document.getElementById("day-options").value;

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

  // Display error if same day and if start and end time overlaps with an existing session's start and end time
  sessions.forEach(session => {
    if (session.day === selectedDay && session.id !== id) {
      if (
        (session.start > start && session.start < end) ||
        (session.end > start && session.end < end) ||
        (start >= session.start && end <= session.end)
      ) {
        const errorText = document.getElementById("conflict-error");
        errorText.classList.remove("hidden");
        isValid = false;
      }
    }
  });

  return isValid;
}

async function deleteButtonClick(db, id) {
  const isConfirmed = confirm("Are you sure you want to delete this session?");

  if (isConfirmed) {
    // Perform the delete action
    const message = await deleteSession(db, id);
    console.log(message);

    // Reload the page
    window.location.reload();
  }
}

/**
 * Adds/updates session info to the database when the save button is clicked.
 * @param {Database} db Database instance to run database queries.
 * @param {object[]} sessions Array of session objects that contain session database data.
 * @param {object[]} studentList Array of student objects that contain student database data.
 * @param {number} id Session id field in the database. 0 if adding new session.
 */
async function saveButtonClick(db, sessions, studentList, id) {
  if (validateSessionInfo(sessions, id)) {
    // Get modal fields
    const selectedDay = document.getElementById("day-options").value;
    const startTime = document.getElementById("start-time").value.trim();
    const sessionLength = parseInt(document.getElementById("session-length").value);
    const roomNumber = document.getElementById("room-number").value.trim();
    const students = document.querySelectorAll(".student");

    // Retrieve all non-empty student input values
    const studentValues = Array.from(students)
      .map(student => student.value.trim()) // Get the trimmed value of each input
      .filter(value => value !== ""); // Keep only non-empty strings

    if (id > 0) {
      while (studentValues.length < 10) {
        studentValues.push("");
      }
    }

    const start = convertTimeToNumber(startTime);
    const end = start + sessionLength;

    // Create session object to send to addSession function
    const sessionData = {
      id,
      selectedDay,
      startTime,
      sessionLength,
      start,
      end,
      roomNumber,
      studentValues,
    };

    try {
      // If action is add then insert new session into table. If action is edit then update session in the table.
      if (id === 0) {
        const sessionMessage = await addSession(db, sessionData);
        console.log(sessionMessage);
      } else if (id > 0) {
        const sessionMessage = await updateSession(db, sessionData);
        console.log(sessionMessage);
      }

      // Check if students in the new session are in the students table in the database
      const newStudents = checkStudentInDatabase(studentList, studentValues);

      // Add new students to the students table in the database
      for (const studentName of newStudents) {
        const studentData = {
          studentName,
          iepDate: "",
          grade: "",
          gender: "",
          teacher: "",
          goalValues: [],
        };
        const studentMessage = await addStudent(db, studentData);
        console.log(studentMessage);
      }
    } catch (error) {
      console.error(error);
    }

    // Reload the page
    window.location.reload();
  }
}

/**
 * Displays the add/edit session modal.
 * @param {Database} db Database instance to run database queries.
 * @param {object[]} sessions Array of session objects that contain session database data.
 * @param {object[]} studentList Array of student objects that contain student database data.
 * @param {number} id Session id field in the database. Default 0 if adding new session.
 */
function openModal(db, sessions, studentList, id = 0) {
  // Get the modal
  const modal = document.getElementById("modal");

  // Get the save button element
  const saveButton = document.getElementById("save-button");

  // Get the delete button element
  const deleteButton = document.getElementById("delete-button");

  // Change modal title to Edit Session when directed by clicking on session container
  // Change modal title to Add Session when directed by clicking on Add button
  const modalTitle = document.querySelector(".modal h2");

  if (id === 0) {
    modalTitle.textContent = "Add Session";
    saveButton.textContent = "Save";
    deleteButton.classList.add("hidden");
  } else {
    modalTitle.textContent = "Edit Session";
    saveButton.textContent = "Update";
    deleteButton.classList.remove("hidden");
  }

  // Display the modal by changing display from hidden to flex
  modal.style.display = "flex";

  // Set save button click to function. Cannot use eventlistener since eventlistener will be
  // added everytime modal is opened.
  saveButton.onclick = () => {
    saveButtonClick(db, sessions, studentList, id);
  };

  // Set delete button click to function
  deleteButton.onclick = () => {
    deleteButtonClick(db, id);
  };
}

/**
 * Creates and displays session containers onto the schedule.
 * @param {Database} db Database instance to run database queries.
 * @param {object[]} sessions Array of session objects that contain session database data.
 * @param {object[]} studentList Array of student objects that contain student database data.
 */
async function displaySessions(db, sessions, studentList) {
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
    sessionContainer.dataset.id = session.id;
    sessionContainer.style.width = `${sessionWidth}px`;
    sessionContainer.style.height = "118px";
    sessionContainer.style.backgroundColor = "rgb(0, 123, 255)"; // Light blue background
    sessionContainer.style.left = `${totalOffset}px`;

    // Get the correct day container
    const dayContainer = document.getElementById(selectedDay).querySelector(".day-schedule");

    // Add the session container to the beginning of the day's schedule
    dayContainer.prepend(sessionContainer);

    // Add session info to the container
    const timeInfo = document.createElement("p");
    timeInfo.textContent = `${session.start_time} - ${getEndTime(session.end)}`;
    sessionContainer.appendChild(timeInfo);

    if (session.room_number !== "" && session.room_number !== null) {
      const roomInfo = document.createElement("p");
      roomInfo.textContent = `#${session.room_number}`;
      sessionContainer.appendChild(roomInfo);
    }

    let numStudents = 0;
    for (let i = 1; i <= 10; i++) {
      if (session[`student_${i}`] !== null && session[`student_${i}`] !== "") {
        const studentInfo = document.createElement("p");
        studentInfo.textContent = session[`student_${i}`];
        sessionContainer.appendChild(studentInfo);
        numStudents++;
      }
    }

    // Add eventlistener for when session is clicked. Displays modal with session info
    sessionContainer.addEventListener("click", () => {
      const selectedDay = document.getElementById("day-options");
      const startTime = document.getElementById("start-time");
      const sessionLength = document.getElementById("session-length");
      const roomNumber = document.getElementById("room-number");
      const studentFields = document.getElementById("student-fields");

      // Show modal
      openModal(db, sessions, studentList, session.id);
      selectedDay.value = session.day;
      startTime.value = session.start_time;
      sessionLength.value = parseInt(session.session_length);
      roomNumber.value = session.room_number;

      for (let i = 1; i <= numStudents; i++) {
        if (session[`student_${i}`] !== null && session[`student_${i}`] !== "") {
          if (i === 1) {
            const firstStudentInput = document.querySelector(".student");
            firstStudentInput.value = session["student_1"];
          } else {
            // Create more input fields for sessions with multiple students
            const newStudentInput = document.createElement("div");
            newStudentInput.classList.add("student-input");

            // Create input and remove button
            const studentInput = document.createElement("input");
            studentInput.type = "text";
            studentInput.classList.add("student");
            studentInput.name = "students[]";
            studentInput.placeholder = "Student's Name";
            studentInput.value = session[`student_${i}`];

            const removeButton = document.createElement("button");
            removeButton.innerHTML = "&times;";
            removeButton.classList.add("removeStudent");

            // Remove button event listener
            removeButton.addEventListener("click", () => {
              studentFields.removeChild(newStudentInput);
            });

            newStudentInput.appendChild(studentInput);
            newStudentInput.appendChild(removeButton);
            studentFields.appendChild(newStudentInput);
          }
        }
      }
    });
  });
}

/**
 * Run visual and database functions when the DOM is loaded.
 */
document.addEventListener("DOMContentLoaded", async () => {
  let sessions;
  let db;
  let studentList;

  // Dynamically add schedule elements (time row and days)
  loadScheduleVisual();

  // Database connection and fetch sessions
  try {
    db = await connectToDatabase();
    sessions = await fetchSessions(db);
    studentList = await fetchStudents(db);
    console.log("Fetched data");
    displaySessions(db, sessions, studentList);
  } catch (error) {
    console.error(error);
  }

  // Get the button elements and student fields container
  const addButton = document.querySelector(".add");
  const closeButton = document.getElementById("close");
  const studentFields = document.getElementById("student-fields");
  const addStudentButton = document.getElementById("add-student");

  // Add session button event listener
  addButton.addEventListener("click", () => openModal(db, sessions, studentList));

  // Modal close button event listener
  closeButton.addEventListener("click", () => {
    // Hide modal
    modal.style.display = "none";

    // Hide errors
    document.querySelectorAll(".error").forEach(element => {
      element.classList.add("hidden");
    });

    // Reset input fields
    document.querySelectorAll(".modal input").forEach(element => {
      element.value = "";
    });

    // Reset select element value
    const dayOptions = document.getElementById("day-options");
    dayOptions.value = "Monday";

    // Remove extra student input fields
    const extraStudentInput = document.querySelectorAll(".student-input");
    if (extraStudentInput.length !== 0) {
      extraStudentInput.forEach(input => {
        studentFields.removeChild(input);
      });
    }
  });

  // Add Student button event listener. Adds input for another student
  addStudentButton.addEventListener("click", () => {
    // Prevent modal from having more than 10 student input fields
    if (studentFields.children.length >= 10) {
      return;
    }

    const newStudentInput = document.createElement("div");
    newStudentInput.classList.add("student-input");

    // Create input and remove button
    const studentInput = document.createElement("input");
    studentInput.type = "text";
    studentInput.classList.add("student");
    studentInput.name = "students[]";
    studentInput.placeholder = "Student's Name";

    const removeButton = document.createElement("button");
    removeButton.innerHTML = "&times;";
    removeButton.classList.add("removeStudent");

    // Remove button event listener
    removeButton.addEventListener("click", () => {
      studentFields.removeChild(newStudentInput);
    });

    newStudentInput.appendChild(studentInput);
    newStudentInput.appendChild(removeButton);
    studentFields.appendChild(newStudentInput);
  });
});
