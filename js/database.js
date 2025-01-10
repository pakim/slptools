/**
 * Database setup and functions.
 */
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

/**
 * Connects to the SQLite database.
 */
export function connectToDatabase() {
  // Adjust path for production
  const isDev = true;
  const dbPath = isDev
    ? path.join(__dirname, "./../data/data.db") // In development
    : path.join(process.resourcesPath, "./app.asar.unpacked/data/data.db"); // In production

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, err => {
      if (err) {
        reject("Error connecting to the database:", err);
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
export function fetchSessions(db) {
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
 * Fetches all students from the database.
 */
export function fetchStudents(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * from students ORDER BY name ASC", (err, rows) => {
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
export function addSession(db, sessionData) {
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
    const values = [
      selectedDay,
      startTime,
      sessionLength,
      start,
      end,
      roomNumber,
      ...studentValues,
    ];

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
 * Adds a new student to the database.
 */
export function addStudent(db, studentData) {
  return new Promise((resolve, reject) => {
    const {
      studentName,
      iepDate,
      grade,
      gender,
      teacher,
      goalValues = [], // Default to an empty array if no students are provided
    } = studentData;

    // Dynamically build the columns and placeholders for the students
    const goalColumns = goalValues.map((_, index) => `goal_${index + 1}`).join(", ");
    const goalPlaceholders = goalValues.map(() => "?").join(", ");

    // Construct the SQL query dynamically
    const sql = `
      INSERT INTO students (name, iep, grade, gender, teacher${goalColumns ? `, ${goalColumns}` : ""}) 
      VALUES (?, ?, ?, ?, ?${goalPlaceholders ? `, ${goalPlaceholders}` : ""})
    `;

    // Combine all values for placeholders
    const values = [studentName, iepDate, grade, gender, teacher, ...goalValues];

    // Execute the query
    db.run(sql, values, err => {
      if (err) {
        reject("Error inserting data:", err.message);
      } else {
        resolve("Insert student successful");
      }
    });
  });
}