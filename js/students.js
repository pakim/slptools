import {
  connectToDatabase,
  fetchSessions,
  fetchStudents,
  addStudent,
  updateStudent,
} from "./database.js";

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
 * Returns true if the session contains the student name.
 * @param {string} name The name of the student to search for.
 * @param {object} session Session object that contains session database data.
 * @returns {boolean} `true` if the name exists in the session, otherwise `false`.
 */
function studentInSession(name, session) {
  for (let i = 1; i <= 10; i++) {
    if (session[`student_${i}`] === name) {
      return true;
    }
  }
  return false;
}

/**
 * Returns a list of session strings the student is in.
 * @param {string} name The name of the student to search for.
 * @param {object[]} sessions Array of session objects that contain session database data.
 * @returns {string[]} Array of strings with session date and time. Ex: `Monday (9:00 - 9:30)`
 */
function retrieveStudentSessions(name, sessions) {
  const studentSessions = [];
  sessions.forEach(session => {
    if (studentInSession(name, session)) {
      const endTime = getEndTime(session.end);
      studentSessions.push(`${session.day} (${session.start_time} - ${endTime})`);
    }
  });

  if (studentSessions.length !== 0) {
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Sort the array
    studentSessions.sort((a, b) => {
      // Extract the base day from each string
      const dayA = dayOrder.find(day => a.startsWith(day));
      const dayB = dayOrder.find(day => b.startsWith(day));

      // Compare their positions in the custom order
      return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB);
    });
  }

  return studentSessions;
}

/**
 * Adds/updates student info to the database when the save button is clicked.
 * @param {Database} db Database instance to run database queries.
 * @param {number} id Student id field in the database. 0 if adding new student.
 */
async function saveButtonClick(db, id) {
  // Verify student name is not empty
  const studentName = document.getElementById("student-name").value.trim();

  if (studentName !== "") {
    // Get modal fields
    const iepDate = document.getElementById("iep").value.trim();
    const grade = document.getElementById("grade").value.trim();
    const gender = document.getElementById("gender").value.trim();
    const teacher = document.getElementById("teacher").value.trim();
    const goals = document.querySelectorAll(".goal");

    // Retrieve all non-empty student input values
    const goalValues = Array.from(goals)
      .map(goal => goal.value.trim()) // Get the trimmed value of each input
      .filter(value => value !== ""); // Keep only non-empty strings

    if (id > 0) {
      while (goalValues.length < 10) {
        goalValues.push("");
      }
    }

    const studentData = {
      id,
      studentName,
      iepDate,
      grade,
      gender,
      teacher,
      goalValues,
    };

    try {
      if (id === 0) {
        const message = await addStudent(db, studentData);
        console.log(message);
      } else if (id > 0) {
        const message = await updateStudent(db, studentData);
        console.log(message);
      }
    } catch (error) {
      console.error(error);
    }

    // Reload the page
    window.location.reload();
  } else {
    const errorText = document.getElementById("name-error");
    errorText.classList.remove("hidden");
  }
}

/**
 * Displays the add/edit student modal.
 * @param {Database} db Database instance to run database queries.
 * @param {number} id Student id field in the database. Default 0 if adding new student.
 */
function openModal(db, id = 0) {
  // Get the modal
  const modal = document.getElementById("modal");

  // Get the save button element
  const saveButton = document.getElementById("save-button");

  // Change modal title to Edit Student when directed by clicking on the Edit button
  // Change modal title to Add Student when directed by clicking on Add button
  const modalTitle = document.querySelector(".modal h2");

  if (id === 0) {
    modalTitle.textContent = "Add Student";
    saveButton.textContent = "Save";
  } else {
    modalTitle.textContent = "Edit Student";
    saveButton.textContent = "Update";
  }

  // Display the modal by changing display from hidden to flex
  modal.style.display = "flex";

  // Set save button click to function. Cannot use eventlistener since eventlistener will be
  // added everytime modal is opened.
  saveButton.onclick = () => {
    saveButtonClick(db, id);
  };
}

/**
 * Creates html student containers and displays all students in the database.
 * @param {Database} db Database instance to run database queries.
 * @param {object[]} sessions Array of session objects that contain session database data.
 * @param {object[]} students Array of student objects that contain student database data.
 */
function displayStudents(db, sessions, students) {
  const listContainer = document.querySelector(".student-list");

  students.forEach(student => {
    const studentContainer = document.createElement("div");
    studentContainer.classList.add("student-container");
    studentContainer.dataset.id = student.id;

    const containerTop = document.createElement("div");
    containerTop.classList.add("student-row-top");

    // Create divs for student details
    const nameContainer = document.createElement("div");
    nameContainer.textContent = student.name;
    nameContainer.style.fontWeight = "bold";
    const iepContainer = document.createElement("div");
    iepContainer.textContent = student.iep;
    const gradeContainer = document.createElement("div");
    gradeContainer.textContent = student.grade;
    const genderContainer = document.createElement("div");
    genderContainer.textContent = student.gender;
    const teacherContainer = document.createElement("div");
    teacherContainer.textContent = student.teacher;
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");

    // Create buttons to edit student and show goals
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    const goalsButton = document.createElement("button");
    goalsButton.textContent = "Show Goals";

    containerTop.appendChild(nameContainer);
    containerTop.appendChild(iepContainer);
    containerTop.appendChild(gradeContainer);
    containerTop.appendChild(genderContainer);
    containerTop.appendChild(teacherContainer);
    containerTop.appendChild(editButton);

    // Create div for session data
    const containerMiddle = document.createElement("div");
    containerMiddle.classList.add("student-row-middle");
    const sessionInfo = document.createElement("div");
    sessionInfo.textContent = `Sessions: ${retrieveStudentSessions(student.name, sessions)}`;
    containerMiddle.appendChild(sessionInfo);
    containerMiddle.appendChild(goalsButton);

    // Create divs to contain student goals
    const containerBottom = document.createElement("div");
    containerBottom.classList.add("student-row-bottom");
    containerBottom.classList.add("hidden");
    const bottomLabel = document.createElement("div");
    bottomLabel.classList.add("goal-label");
    const bottomGoals = document.createElement("div");
    bottomGoals.classList.add("goal-list");

    containerBottom.appendChild(bottomLabel);
    containerBottom.appendChild(bottomGoals);

    // Create textareas for goals
    let numGoals = 0;
    for (let i = 1; i <= 10; i++) {
      if (student[`goal_${i}`] !== null && student[`goal_${i}`] !== "") {
        const goalInfo = document.createElement("textarea");
        goalInfo.classList.add("student-goal");
        goalInfo.value = student[`goal_${i}`];
        goalInfo.rows = "5";
        goalInfo.disabled = true;
        bottomGoals.appendChild(goalInfo);
        numGoals++;
      }
    }
    bottomLabel.textContent = `Goals: ${numGoals}`;

    studentContainer.appendChild(containerTop);
    studentContainer.appendChild(containerMiddle);
    studentContainer.appendChild(containerBottom);

    listContainer.appendChild(studentContainer);

    // Add event listener to the Show Goals button
    goalsButton.addEventListener("click", () => {
      if (goalsButton.textContent === "Show Goals") {
        goalsButton.textContent = "Hide Goals";
        containerBottom.classList.remove("hidden");
      } else if (goalsButton.textContent === "Hide Goals") {
        goalsButton.textContent = "Show Goals";
        containerBottom.classList.add("hidden");
      }
    });

    // Add eventlistener for when edit button is clicked. Displays modal with student info
    editButton.addEventListener("click", () => {
      const studentName = document.getElementById("student-name");
      const iepDate = document.getElementById("iep");
      const grade = document.getElementById("grade");
      const gender = document.getElementById("gender");
      const teacher = document.getElementById("teacher");
      const studentGoals = document.getElementById("student-goals");

      openModal(db, student.id);
      studentName.value = student.name;
      iepDate.value = student.iep;
      grade.value = student.grade;
      gender.value = student.gender;
      teacher.value = student.teacher;

      for (let i = 1; i <= numGoals; i++) {
        if (student[`goal_${i}`] !== null && student[`goal_${i}`] !== "") {
          if (i === 1) {
            const firstGoalInput = document.querySelector(".goal");
            firstGoalInput.value = student["goal_1"];
          } else {
            const newGoalInput = document.createElement("div");
            newGoalInput.classList.add("goal-input");

            // Create input and remove button
            const goalInput = document.createElement("textarea");
            goalInput.classList.add("goal");
            goalInput.name = "goals[]";
            goalInput.rows = "3";
            goalInput.placeholder = "Student's Goal";
            goalInput.value = student[`goal_${i}`];

            const removeButton = document.createElement("button");
            removeButton.innerHTML = "&times;";
            removeButton.classList.add("remove-goal");

            // Remove button event listener
            removeButton.addEventListener("click", () => {
              studentGoals.removeChild(newGoalInput);
            });

            newGoalInput.appendChild(goalInput);
            newGoalInput.appendChild(removeButton);
            studentGoals.appendChild(newGoalInput);
          }
        }
      }
    });
  });
}

/**
 * Runs visual and database functions when the DOM is loaded.
 */
document.addEventListener("DOMContentLoaded", async () => {
  let db;
  let students;
  let sessions;

  // Database connection and fetch sessions
  try {
    db = await connectToDatabase();
    students = await fetchStudents(db);
    sessions = await fetchSessions(db);
    console.log("Fetched data");
    displayStudents(db, sessions, students);
  } catch (error) {
    console.error(error);
  }

  // Get the modal
  const modal = document.getElementById("modal");

  // Get the button that opens the modal
  const addButton = document.querySelector(".add");

  // Get the <span> element that closes the modal
  const closeButton = document.getElementById("close");

  // Get the buttons and student goals field
  const studentGoals = document.getElementById("student-goals");
  const addGoalsButton = document.getElementById("add-goal");
  const showAllButton = document.querySelector(".show-all");

  // Add student button event listener
  addButton.addEventListener("click", () => openModal(db));

  // Show All button event listener
  showAllButton.addEventListener("click", () => {
    if (showAllButton.textContent === "Show All") {
      showAllButton.textContent = "Hide All";
      const goalsContainer = document.querySelectorAll(".student-row-bottom");
      goalsContainer.forEach(container => {
        container.classList.remove("hidden");
      });
    } else if (showAllButton.textContent === "Hide All") {
      showAllButton.textContent = "Show All";
      const goalsContainer = document.querySelectorAll(".student-row-bottom");
      goalsContainer.forEach(container => {
        container.classList.add("hidden");
      });
    }
  });

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

    // Remove extra student input fields
    const extraGoalInput = document.querySelectorAll(".goal-input");
    if (extraGoalInput.length !== 0) {
      extraGoalInput.forEach(input => {
        studentGoals.removeChild(input);
      });
    }

    // Reset first goal textarea field
    const firstGoalInput = document.querySelector(".goal");
    firstGoalInput.value = "";
  });

  // Add goal button event listener. Adds input for another goal
  addGoalsButton.addEventListener("click", () => {
    // Prevent modal from having more than 10 student input fields
    if (studentGoals.children.length >= 10) {
      return;
    }

    const newGoalInput = document.createElement("div");
    newGoalInput.classList.add("goal-input");

    // Create input and remove button
    const goalInput = document.createElement("textarea");
    goalInput.classList.add("goal");
    goalInput.name = "goals[]";
    goalInput.rows = "3";
    goalInput.placeholder = "Student's Goal";

    const removeButton = document.createElement("button");
    removeButton.innerHTML = "&times;";
    removeButton.classList.add("remove-goal");

    // Remove button event listener
    removeButton.addEventListener("click", () => {
      studentGoals.removeChild(newGoalInput);
    });

    newGoalInput.appendChild(goalInput);
    newGoalInput.appendChild(removeButton);
    studentGoals.appendChild(newGoalInput);
  });
});
