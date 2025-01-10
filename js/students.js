import { connectToDatabase, fetchStudents, addStudent } from "./database.js";

/**
 * Creates student containers and displays all students in the database.
 */
function displayStudents(students) {
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
    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(goalsButton);

    containerTop.appendChild(nameContainer);
    containerTop.appendChild(iepContainer);
    containerTop.appendChild(gradeContainer);
    containerTop.appendChild(genderContainer);
    containerTop.appendChild(teacherContainer);
    containerTop.appendChild(buttonContainer);

    // Create divs to contain student goals
    const containerBottom = document.createElement("div");
    containerBottom.classList.add("student-row-bottom");
    containerBottom.classList.add("hidden");
    const bottomLabel = document.createElement("div");
    bottomLabel.classList.add("goal-label");
    bottomLabel.textContent = "Goals:";
    const bottomGoals = document.createElement("div");
    bottomGoals.classList.add("goal-list");

    containerBottom.appendChild(bottomLabel);
    containerBottom.appendChild(bottomGoals);

    // Create textareas for goals
    for (let i = 1; i <= 10; i++) {
      if (student[`goal_${i}`] !== null && student[`goal_${i}`] !== "") {
        const goalInfo = document.createElement("textarea");
        goalInfo.classList.add("student-goal");
        goalInfo.value = student[`goal_${i}`];
        goalInfo.rows = "5";
        bottomGoals.appendChild(goalInfo);
      }
    }

    studentContainer.appendChild(containerTop);
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
  });
}

/**
 * Run visual and database functions when the DOM is loaded.
 */
document.addEventListener("DOMContentLoaded", async () => {
  let db;
  let students;

  // Database connection and fetch sessions
  try {
    db = await connectToDatabase();
    students = await fetchStudents(db);
    console.log("Fetched data");
    displayStudents(students);
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
      const gender = document.getElementById("gender").value.trim();
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
        gender,
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
