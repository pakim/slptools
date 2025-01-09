import {
  connectToDatabase,
  fetchStudents,
  addStudent,
} from "./database.js";

/**
 * Database setup and functions.
 */
// const sqlite3 = require("sqlite3").verbose();
// const path = require("path");

// // Adjust path for production
// const isDev = true;
// const dbPath = isDev
//   ? path.join(__dirname, "./../data/data.db") // In development
//   : path.join(process.resourcesPath, "./app.asar.unpacked/data/data.db"); // In production

// /**
//  * Connects to the SQLite database.
//  */
// function connectToDatabase() {
//   return new Promise((resolve, reject) => {
//     const db = new sqlite3.Database(dbPath, err => {
//       if (err) {
//         reject("Error connecting to the database:", err.message);
//       } else {
//         console.log("Connected to the database.");
//         resolve(db);
//       }
//     });
//   });
// }

// /**
//  * Fetches all students from the database.
//  */
// function fetchStudents(db) {
//   return new Promise((resolve, reject) => {
//     db.all("SELECT * from students", (err, rows) => {
//       if (err) {
//         reject("Error fetching data:", err.message);
//       } else {
//         resolve(rows);
//       }
//     });
//   });
// }

// /**
//  * Adds a new student to the database.
//  */
// function addStudent(db, studentData) {
//   return new Promise((resolve, reject) => {
//     const {
//       studentName,
//       iepDate,
//       grade,
//       teacher,
//       goalValues = [], // Default to an empty array if no students are provided
//     } = studentData;

//     // Dynamically build the columns and placeholders for the students
//     const goalColumns = goalValues.map((_, index) => `goal_${index + 1}`).join(", ");
//     const goalPlaceholders = goalValues.map(() => "?").join(", ");

//     // Construct the SQL query dynamically
//     const sql = `
//       INSERT INTO students (name, iep, grade, teacher${goalColumns ? `, ${goalColumns}` : ""}) 
//       VALUES (?, ?, ?, ?${goalPlaceholders ? `, ${goalPlaceholders}` : ""})
//     `;

//     // Combine all values for placeholders
//     const values = [studentName, iepDate, grade, teacher, ...goalValues];

//     // Execute the query
//     db.run(sql, values, err => {
//       if (err) {
//         reject("Error inserting data:", err.message);
//       } else {
//         resolve("Insert student successful");
//       }
//     });
//   });
// }

document.addEventListener("DOMContentLoaded", async () => {
  let db;
  let students;

  // Database connection and fetch sessions
  try {
    db = await connectToDatabase();
    students = await fetchStudents(db);
    console.log("Fetched data");
  } catch (error) {
    console.error(error);
  }

  // Get the modal
  const modal = document.getElementById("modal");

  // Get the button that opens the modal
  const addButton = document.querySelector(".add");

  // Get the <span> element that closes the modal
  const closeButton = document.getElementById("close");

  // Get the buttons
  const studentGoals = document.getElementById("student-goals");
  const addGoalsButton = document.getElementById("add-goal");

  const saveButton = document.getElementById("save-button"); // Save button

  // Add student button event listener
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
    goalInput.type = "text";
    goalInput.classList.add("goal");
    goalInput.name = "goals[]";
    goalInput.rows = "3";
    goalInput.placeholder = "Student's Goal";

    const removeButton = document.createElement("button");
    removeButton.innerHTML = "&times;";
    removeButton.classList.add("remove-goal");

    // Prevent removal of the first student input
    removeButton.addEventListener("click", () => {
      if (studentGoals.children.length > 1) {
        studentGoals.removeChild(newGoalInput);
      }
    });

    newGoalInput.appendChild(goalInput);
    newGoalInput.appendChild(removeButton);
    studentGoals.appendChild(newGoalInput);
  });

  // Save button event listener
  saveButton.addEventListener("click", async () => {
    // Verify student name is not empty
    const studentName = document.getElementById("student-name").value.trim();

    if (studentName !== "") {
      // Get modal fields
      const iepDate = document.getElementById("iep").value.trim();
      const grade = document.getElementById("grade").value.trim();
      const teacher = document.getElementById("teacher").value.trim();
      const goals = document.querySelectorAll(".goal");

      // Retrieve all non-empty student input values
      const goalValues = Array.from(goals)
        .map(goal => goal.value.trim()) // Get the trimmed value of each input
        .filter(value => value !== ""); // Keep only non-empty strings

      const studentData = {
        studentName,
        iepDate,
        grade,
        teacher,
        goalValues,
      };

      try {
        const message = await addStudent(db, studentData);
        console.log(message);
      } catch (error) {
        console.error(error);
      }

      // Reload the page
      window.location.reload();
    } else {
      const errorText = document.getElementById("name-error");
      errorText.classList.remove("hidden");
    }
  });
});
