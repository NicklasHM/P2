// Globale variabler
let projects = [];
let employees = [];
let machines = [];
let bookingCalendar;
let editMode = false; // Tilføj editMode som global variabel

// Dummy-data til test (inden integration med Business Central)
const dummyProjects = [
  {
    id: 1,
    title: "Skibsreparation - Maersk Containerskib",
    description:
      "Omfattende reparation af motorkomponenter og skrogskader på containerskib. Inkluderer udskiftning af 3 propelaksler og fornyelse af bundmaling.",
    startDate: "2025-03-01",
    deadline: "2025-04-30",
    price: 450000,
    contributionMargin: 55,
    expectedHours: 240,
    status: "ongoing",
    isClassProject: true,
    isInNewProjects: false,
    employees: [1, 3],
    inspections: {
      firstInspection: {
        selected: true,
        completed: true,
        date: "2025-03-05",
      },
      wpsWpqr: {
        selected: true,
        completed: true,
        date: "2025-03-12",
      },
      ndt: {
        selected: true,
        completed: false,
        date: "",
      },
      finalInspection: {
        selected: false,
        completed: false,
        date: "",
      },
      report: {
        selected: false,
        completed: false,
        date: "",
      },
    },
  },
  {
    id: 2,
    title: "Vedligeholdelse - DFDS Ferry",
    description:
      "Rutineeftersyn og vedligeholdelse af fremdrivningssystem. Omfatter kalibrering af styresystemer og kontrol af hydrauliske komponenter.",
    startDate: "2025-04-10",
    deadline: "2025-05-15",
    price: 280000,
    contributionMargin: 42,
    expectedHours: 180,
    status: "not-started",
    isClassProject: false,
    isInNewProjects: true,
    employees: [],
    inspections: {},
  },
  {
    id: 3,
    title: "Motorudskiftning - Fiskekutter",
    description:
      "Komplet udskiftning af hovedmotor på 15m fiskekutter. Inkluderer installering, test og certificering.",
    startDate: "2025-02-01",
    deadline: "2025-03-01",
    price: 120000,
    contributionMargin: 38,
    expectedHours: 90,
    status: "completed",
    isClassProject: false,
    isInNewProjects: false,
    employees: [2],
    inspections: {},
  },
  {
    id: 4,
    title: "Årlig inspektion - Offshore Platform",
    description:
      "Lovpligtig inspektion af sikkerhedssystemer og kritiske komponenter på boreplatform. Omfatter NDT-test og certificering.",
    startDate: "2025-02-15",
    deadline: "2025-04-15",
    price: 350000,
    contributionMargin: 28,
    expectedHours: 200,
    status: "ongoing",
    isClassProject: true,
    isInNewProjects: false,
    employees: [1, 2, 3],
    inspections: {
      firstInspection: {
        selected: true,
        completed: true,
        date: "2025-02-20",
      },
      wpsWpqr: {
        selected: true,
        completed: true,
        date: "2025-03-01",
      },
      ndt: {
        selected: true,
        completed: true,
        date: "2025-03-10",
      },
      finalInspection: {
        selected: true,
        completed: false,
        date: "",
      },
      report: {
        selected: true,
        completed: false,
        date: "",
      },
    },
  },
];

const dummyEmployees = [
  {
    id: 1,
    name: "Anders Jensen",
    employeeCode: "AJ2023",
    skills: ["Svejsning", "Motorinstallation", "Hydraulik"],
  },
  {
    id: 2,
    name: "Mette Nielsen",
    employeeCode: "MN2023",
    skills: ["Elektronik", "PLC-programmering", "Kabeltrækning"],
  },
  {
    id: 3,
    name: "Lars Petersen",
    employeeCode: "LP2023",
    skills: ["Svejsning", "NDT-inspektion", "Kvalitetskontrol"],
  },
];

// Indlæs dummydata når siden indlæses
document.addEventListener("DOMContentLoaded", () => {
  // Indlæs dummy-data (i virkeligheden ville dette være fra Business Central API)
  projects = [...dummyProjects];
  employees = [...dummyEmployees];
  machines = []; // Initialiser som tomt array

  // Opdater projektstatus baseret på datoer (kun for ikke afsluttede projekter)
  projects.forEach((project) => {
    if (project.status !== "completed") {
      project.status = calculateProjectStatus(
        project.startDate,
        project.deadline
      );
    }
  });

  // Indstil event listeners
  setupEventListeners();

  // Initialiser kalender
  initCalendar();

  // Indlæs den første visning
  renderProjects();
  renderEmployees();
  renderMachines();
});

// Initialiser kalender
function initCalendar() {
  // Brug BookingCalendar klassen fra calendar.js
  bookingCalendar = new BookingCalendar("booking-calendar", machines, projects);
}

// Opsætning af event listeners
function setupEventListeners() {
  // Navigation
  const navLinks = document.querySelectorAll(".nav-links a");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetPage = link.getAttribute("data-page");
      showPage(targetPage);

      // Render kalenderen når vi går til maskinbooking
      if (targetPage === "maskinbooking" && bookingCalendar) {
        bookingCalendar.render();
      }

      // Opdater aktiv navigation
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // Projekt filtrering
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-filter");
      filterProjects(filter);

      // Opdater aktiv filter
      filterButtons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
    });
  });

  // Import knap
  document
    .getElementById("import-btn")
    .addEventListener("click", importFromBusinessCentral);

  // Tilføj maskine knap
  document
    .getElementById("add-machine-btn")
    .addEventListener("click", addNewMachine);

  // Opret maskine knap
  document
    .getElementById("create-machine-btn")
    .addEventListener("click", createNewMachine);

  // Tilføj medarbejder knap
  document
    .getElementById("add-employee-btn")
    .addEventListener("click", addNewEmployee);

  // Luk-knapper til modaler
  document.querySelectorAll(".close-modal").forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      modal.style.display = "none";
    });
  });

  // Klik udenfor modal lukker den
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      hideModal(e.target.id);
    }
  });
}

// Vis specifik side
function showPage(pageId) {
  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => {
    page.classList.remove("active");
  });
  document.getElementById(pageId).classList.add("active");
}

// Vis modal
function showModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

// Skjul modal
function hideModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Filtrer projekter baseret på status
function filterProjects(filter) {
  const projectsGrid = document.querySelector(
    "#projektoversigt .projects-grid"
  );
  projectsGrid.innerHTML = "";

  let filteredProjects;
  if (filter === "all") {
    filteredProjects = projects.filter(
      (project) =>
        (project.status === "ongoing" || project.status === "not-started") &&
        !project.isInNewProjects
    );
  } else {
    filteredProjects = projects.filter(
      (project) => project.status === filter && !project.isInNewProjects
    );
  }

  filteredProjects.forEach((project) => {
    projectsGrid.appendChild(createProjectCard(project));
  });
}

// Render projekter
function renderProjects() {
  // Render nye projekter
  const newProjectsList = document.querySelector(
    "#nye-projekter .projects-list"
  );
  newProjectsList.innerHTML = "";

  // Vis projekter der er markeret som "nye projekter"
  const newProjects = projects.filter(
    (project) => project.status === "not-started" && project.isInNewProjects
  );

  newProjects.forEach((project) => {
    const projectCard = createProjectCard(project);
    newProjectsList.appendChild(projectCard);
  });

  // Render projektoversigt
  const projectsGrid = document.querySelector(
    "#projektoversigt .projects-grid"
  );
  projectsGrid.innerHTML = "";

  const activeProjects = projects.filter(
    (project) => project.status === "ongoing" && !project.isInNewProjects
  );

  activeProjects.forEach((project) => {
    projectsGrid.appendChild(createProjectCard(project));
  });

  // Render afsluttede projekter
  const completedGrid = document.querySelector(
    "#afsluttede-projekter .projects-grid"
  );
  completedGrid.innerHTML = "";

  const completedProjects = projects.filter(
    (project) => project.status === "completed" && !project.isInNewProjects
  );

  completedProjects.forEach((project) => {
    completedGrid.appendChild(createProjectCard(project));
  });
}

// Opret projektkort
function createProjectCard(project) {
  const projectCard = document.createElement("div");
  projectCard.className = "project-card";
  projectCard.dataset.id = project.id;

  // Bestem status bar farve baseret på dækningsbidrag
  let statusBarClass = "";
  if (project.contributionMargin >= 50) {
    statusBarClass = "status-green";
  } else if (project.contributionMargin >= 30) {
    statusBarClass = "status-yellow";
  } else {
    statusBarClass = "status-red";
  }

  // Beregn valgte og gennemførte inspektioner for klasseprojekter
  let inspectionHtml = "";
  if (project.isClassProject) {
    // Få alle inspektionstyper
    const inspectionTypes = [
      "firstInspection",
      "wpsWpqr",
      "ndt",
      "finalInspection",
      "report",
    ];
    const inspections = project.inspections || {};

    // Tæl valgte og gennemførte inspektioner
    let selectedCount = 0;
    let completedCount = 0;
    const selectedInspections = [];

    inspectionTypes.forEach((type, index) => {
      if (inspections[type] && inspections[type].selected) {
        selectedCount++;
        selectedInspections.push({
          type: type,
          completed: inspections[type].completed,
        });
        if (inspections[type].completed) {
          completedCount++;
        }
      }
    });

    // Kun vis inspektionsflow hvis der er valgte inspektioner
    if (selectedCount > 0) {
      inspectionHtml = `
        <div class="inspection-label">Inspektioner: ${completedCount}/${selectedCount}</div>
        <div class="inspection-flow">
      `;

      // Tilføj trin for hver valgt inspektion
      selectedInspections.forEach((inspection, index) => {
        inspectionHtml += `
          <div class="inspection-step ${
            inspection.completed ? "completed" : "pending"
          }">
            <div class="step-number">${index + 1}</div>
            ${
              index < selectedInspections.length - 1
                ? '<div class="step-line"></div>'
                : ""
            }
          </div>
        `;
      });

      inspectionHtml += "</div>";
    }
  }

  // Opret statusbar baseret på dækningsbidrag
  projectCard.innerHTML = `
    <div class="project-title">${project.title}</div>
    <div class="project-id">Projekt-ID: ${project.id}</div>
    <div class="project-dates">
      <span class="date-label">Start:</span> ${formatDate(project.startDate)}
      <span class="date-label">Deadline:</span> ${formatDate(project.deadline)}
    </div>
    <div class="project-details">
      <div class="contribution-margin">
        <span>Dækningsbidrag:</span> ${project.contributionMargin}%
      </div>
    </div>
    <div class="status-bar-container">
      <div class="status-bar ${statusBarClass}" style="width: ${
    project.contributionMargin
  }%"></div>
    </div>
    ${inspectionHtml}
  `;

  // Tilføj event listener for at vise detaljer
  projectCard.addEventListener("click", () => {
    showProjectDetails(project.id);
  });

  return projectCard;
}

// Vis projektdetaljer
function showProjectDetails(projectId) {
  const project = projects.find((p) => p.id === parseInt(projectId));
  const modal = document.getElementById("project-modal");

  // Nulstil editMode når vi viser projektdetaljer
  editMode = false;

  // Sikr at projekt har en inspections-egenskab
  if (!project.inspections) {
    project.inspections = {};
  }

  // Sikr at project har en employees-egenskab
  if (!project.employees) {
    project.employees = [];
  }

  // Opbyg liste af tilknyttede medarbejdere
  let assignedEmployees = "";
  if (project.employees.length > 0) {
    const employeeNames = project.employees.map((empId) => {
      const employee = employees.find((e) => e.id === empId);
      return employee ? employee.name : "Ukendt medarbejder";
    });

    assignedEmployees = employeeNames.join(", ");
  } else {
    assignedEmployees = "Ingen medarbejdere tilknyttet dette projekt";
  }

  // Opbyg dropdown liste af alle medarbejdere
  let employeeOptions = '<option value="">Vælg medarbejder</option>';
  employees.forEach((emp) => {
    employeeOptions += `<option value="${emp.id}">${emp.name}</option>`;
  });

  // Opret inspektions-HTML med datofelter, vælg og gennemført checkboxes
  let inspectionsHtml = `
    <div id="inspections-container" class="${
      project.isClassProject ? "" : "hidden"
    }">
      <div class="inspections">
        <h4>Inspektioner</h4>
        <div class="inspection-header">
          <div class="inspection-name">Inspektionstype</div>
          <div class="inspection-select">Vælg</div>
          <div class="inspection-complete">Gennemført</div>
          <div class="inspection-date-header">Dato</div>
        </div>
        <div class="inspection-item">
          <div class="inspection-name">Første inspektion</div>
          <div class="inspection-select">
            <input type="checkbox" id="select-firstInspection" 
              ${
                project.inspections.firstInspection?.selected ? "checked" : ""
              } disabled>
          </div>
          <div class="inspection-complete">
            <input type="checkbox" id="complete-firstInspection" 
              ${
                project.inspections.firstInspection?.completed ? "checked" : ""
              } disabled>
          </div>
          <div class="inspection-date-field">
            <input type="date" id="date-firstInspection" class="inspection-date" 
              value="${
                project.inspections.firstInspection?.date || ""
              }" disabled>
          </div>
        </div>
        <div class="inspection-item">
          <div class="inspection-name">WPS/WPQR</div>
          <div class="inspection-select">
            <input type="checkbox" id="select-wpsWpqr" 
              ${
                project.inspections.wpsWpqr?.selected ? "checked" : ""
              } disabled>
          </div>
          <div class="inspection-complete">
            <input type="checkbox" id="complete-wpsWpqr" 
              ${
                project.inspections.wpsWpqr?.completed ? "checked" : ""
              } disabled>
          </div>
          <div class="inspection-date-field">
            <input type="date" id="date-wpsWpqr" class="inspection-date" 
              value="${project.inspections.wpsWpqr?.date || ""}" disabled>
          </div>
        </div>
        <div class="inspection-item">
          <div class="inspection-name">NDT</div>
          <div class="inspection-select">
            <input type="checkbox" id="select-ndt" 
              ${project.inspections.ndt?.selected ? "checked" : ""} disabled>
          </div>
          <div class="inspection-complete">
            <input type="checkbox" id="complete-ndt" 
              ${project.inspections.ndt?.completed ? "checked" : ""} disabled>
          </div>
          <div class="inspection-date-field">
            <input type="date" id="date-ndt" class="inspection-date" 
              value="${project.inspections.ndt?.date || ""}" disabled>
          </div>
        </div>
        <div class="inspection-item">
          <div class="inspection-name">Endelig inspektion</div>
          <div class="inspection-select">
            <input type="checkbox" id="select-finalInspection" 
              ${
                project.inspections.finalInspection?.selected ? "checked" : ""
              } disabled>
          </div>
          <div class="inspection-complete">
            <input type="checkbox" id="complete-finalInspection" 
              ${
                project.inspections.finalInspection?.completed ? "checked" : ""
              } disabled>
          </div>
          <div class="inspection-date-field">
            <input type="date" id="date-finalInspection" class="inspection-date" 
              value="${
                project.inspections.finalInspection?.date || ""
              }" disabled>
          </div>
        </div>
        <div class="inspection-item">
          <div class="inspection-name">Rapport</div>
          <div class="inspection-select">
            <input type="checkbox" id="select-report" 
              ${project.inspections.report?.selected ? "checked" : ""} disabled>
          </div>
          <div class="inspection-complete">
            <input type="checkbox" id="complete-report" 
              ${
                project.inspections.report?.completed ? "checked" : ""
              } disabled>
          </div>
          <div class="inspection-date-field">
            <input type="date" id="date-report" class="inspection-date" 
              value="${project.inspections.report?.date || ""}" disabled>
          </div>
        </div>
      </div>
    </div>
  `;

  // Byg HTML-indhold
  const modalContent = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <div class="project-details">
        <div class="project-header">
          <h2>Projektdetaljer</h2>
          <div>
            <button id="edit-project-button" class="button">Rediger</button>
            <button id="approve-project-button" class="button secondary ${
              project.status === "not-started" && !project.isInNewProjects
                ? ""
                : "hidden"
            }">Godkend</button>
            <button id="complete-project-button" class="button secondary ${
              project.status === "ongoing" ? "" : "hidden"
            }">Marker som afsluttet</button>
            <button id="transfer-project-button" class="button secondary ${
              project.status === "not-started" && project.isInNewProjects
                ? ""
                : "hidden"
            }">Overfør til projektoversigt</button>
          </div>
        </div>
        <div id="project-form">
          <div class="form-group">
            <label for="project-title">Projekttitel</label>
            <input type="text" id="project-title" value="${
              project.title
            }" readonly>
          </div>
          <div class="form-group">
            <label for="project-id">Projekt-ID</label>
            <input type="text" id="project-id" value="${
              project.id
            }" readonly disabled>
          </div>
          <div class="form-group">
            <label for="project-description">Beskrivelse</label>
            <textarea id="project-description" readonly>${
              project.description || ""
            }</textarea>
          </div>
          <div class="form-group">
            <label for="project-employees">Tilknyttede medarbejdere</label>
            <div id="assigned-employees" class="assigned-employees">
              ${assignedEmployees}
            </div>
          </div>
          <div class="form-group employee-manager hidden">
            <label for="employee-select">Tilføj/Fjern medarbejdere</label>
            <div class="employee-select-container">
              <select id="employee-select" class="employee-select">
                ${employeeOptions}
              </select>
              <button id="add-employee-to-project" class="button secondary">Tilføj</button>
            </div>
            <div id="project-employee-list" class="project-employee-list">
              ${project.employees
                .map((empId) => {
                  const emp = employees.find((e) => e.id === empId);
                  if (!emp) return "";
                  return `
                  <div class="project-employee-item">
                    <span>${emp.name}</span>
                    <button class="remove-employee-btn" data-id="${emp.id}">Fjern</button>
                  </div>
                `;
                })
                .join("")}
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="project-start-date">Startdato</label>
              <input type="date" id="project-start-date" value="${
                project.startDate
              }" readonly>
            </div>
            <div class="form-group">
              <label for="project-deadline">Deadline</label>
              <input type="date" id="project-deadline" value="${
                project.deadline
              }" readonly>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="project-price">Pris (DKK)</label>
              <input type="number" id="project-price" value="${
                project.price
              }" readonly>
            </div>
            <div class="form-group">
              <label for="project-contribution-margin">Dækningsbidrag (%)</label>
              <input type="number" id="project-contribution-margin" value="${
                project.contributionMargin
              }" readonly>
            </div>
          </div>
          <div class="form-group">
            <label for="project-expected-hours">Forventede timer</label>
            <input type="number" id="project-expected-hours" value="${
              project.expectedHours
            }" readonly>
          </div>
          <div class="form-group class-project-group">
            <label class="class-project-label">
              <input type="checkbox" id="project-class-project" ${
                project.isClassProject ? "checked" : ""
              } disabled>
              Klasseprojekt
            </label>
          </div>
          ${inspectionsHtml}
          <div class="form-buttons hidden" id="save-cancel-buttons">
            <button id="save-project-button" class="button primary">Gem</button>
            <button id="cancel-edit-button" class="button secondary">Annuller</button>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.innerHTML = modalContent;
  modal.style.display = "block";

  // Tilføj event listeners
  document.querySelector(".close").addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Edit mode
  document
    .getElementById("edit-project-button")
    .addEventListener("click", function () {
      editMode = true; // Sæt editMode til true når vi går i redigeringstilstand
      const formElements = document.querySelectorAll(
        '#project-form input:not([type="checkbox"]), #project-form textarea'
      );
      formElements.forEach((element) => {
        element.removeAttribute("readonly");
      });

      // Fjern "disabled" fra checkboksen for klasseprojekt
      document
        .getElementById("project-class-project")
        .removeAttribute("disabled");

      // Vis medarbejder administration
      document.querySelector(".employee-manager").classList.remove("hidden");
      document.getElementById("assigned-employees").classList.add("hidden");

      // Tilføj event listener til knappen "Tilføj medarbejder"
      document
        .getElementById("add-employee-to-project")
        .addEventListener("click", function () {
          const selectElement = document.getElementById("employee-select");
          const selectedEmployeeId = parseInt(selectElement.value);

          if (
            selectedEmployeeId &&
            !project.employees.includes(selectedEmployeeId)
          ) {
            // Tilføj medarbejder til projekt
            project.employees.push(selectedEmployeeId);

            // Find medarbejderen
            const employee = employees.find((e) => e.id === selectedEmployeeId);

            // Opdater medarbejderlisten
            const employeeList = document.getElementById(
              "project-employee-list"
            );
            const employeeItem = document.createElement("div");
            employeeItem.className = "project-employee-item";
            employeeItem.innerHTML = `
            <span>${employee.name}</span>
            <button class="remove-employee-btn" data-id="${employee.id}">Fjern</button>
          `;
            employeeList.appendChild(employeeItem);

            // Tilføj event listener til "Fjern" knappen
            employeeItem
              .querySelector(".remove-employee-btn")
              .addEventListener("click", function () {
                removeEmployeeFromProject(project.id, employee.id);
                employeeItem.remove();
              });

            // Nulstil dropdown
            selectElement.selectedIndex = 0;
          }
        });

      // Tilføj event listeners til "Fjern" knapper
      document.querySelectorAll(".remove-employee-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          const employeeId = parseInt(this.getAttribute("data-id"));
          removeEmployeeFromProject(project.id, employeeId);
          this.closest(".project-employee-item").remove();
        });
      });

      // Aktivér alle inspektionscheckboxes og datofelter
      const selectCheckboxes = document.querySelectorAll(
        'input[id^="select-"]'
      );
      const completeCheckboxes = document.querySelectorAll(
        'input[id^="complete-"]'
      );
      const dateInputs = document.querySelectorAll('input[id^="date-"]');

      selectCheckboxes.forEach((checkbox) => {
        checkbox.removeAttribute("disabled");
      });

      // Aktivér kun gennemført-checkboxes og datofelter for valgte inspektioner
      if (document.getElementById("select-firstInspection").checked) {
        document
          .getElementById("complete-firstInspection")
          .removeAttribute("disabled");
        document
          .getElementById("date-firstInspection")
          .removeAttribute("disabled");
      }
      if (document.getElementById("select-wpsWpqr").checked) {
        document.getElementById("complete-wpsWpqr").removeAttribute("disabled");
        document.getElementById("date-wpsWpqr").removeAttribute("disabled");
      }
      if (document.getElementById("select-ndt").checked) {
        document.getElementById("complete-ndt").removeAttribute("disabled");
        document.getElementById("date-ndt").removeAttribute("disabled");
      }
      if (document.getElementById("select-finalInspection").checked) {
        document
          .getElementById("complete-finalInspection")
          .removeAttribute("disabled");
        document
          .getElementById("date-finalInspection")
          .removeAttribute("disabled");
      }
      if (document.getElementById("select-report").checked) {
        document.getElementById("complete-report").removeAttribute("disabled");
        document.getElementById("date-report").removeAttribute("disabled");
      }

      // Tilføj event listeners til inspektionscheckboxes for "Vælg" for at aktivere/deaktivere tilsvarende gennemført-checkboxes
      document
        .getElementById("select-firstInspection")
        .addEventListener("change", function () {
          const completeCheckbox = document.getElementById(
            "complete-firstInspection"
          );
          const dateInput = document.getElementById("date-firstInspection");

          if (this.checked) {
            completeCheckbox.removeAttribute("disabled");
            dateInput.removeAttribute("disabled");
          } else {
            completeCheckbox.setAttribute("disabled", "disabled");
            completeCheckbox.checked = false;
            dateInput.setAttribute("disabled", "disabled");
            dateInput.value = "";
          }

          // Opdater downstream inspektioner
          updateDownstreamInspections();
        });

      document
        .getElementById("select-wpsWpqr")
        .addEventListener("change", function () {
          const completeCheckbox = document.getElementById("complete-wpsWpqr");
          const dateInput = document.getElementById("date-wpsWpqr");

          if (this.checked) {
            completeCheckbox.removeAttribute("disabled");
            dateInput.removeAttribute("disabled");
          } else {
            completeCheckbox.setAttribute("disabled", "disabled");
            completeCheckbox.checked = false;
            dateInput.setAttribute("disabled", "disabled");
            dateInput.value = "";
          }

          // Opdater downstream inspektioner
          updateDownstreamInspections();
        });

      document
        .getElementById("select-ndt")
        .addEventListener("change", function () {
          const completeCheckbox = document.getElementById("complete-ndt");
          const dateInput = document.getElementById("date-ndt");

          if (this.checked) {
            completeCheckbox.removeAttribute("disabled");
            dateInput.removeAttribute("disabled");
          } else {
            completeCheckbox.setAttribute("disabled", "disabled");
            completeCheckbox.checked = false;
            dateInput.setAttribute("disabled", "disabled");
            dateInput.value = "";
          }

          // Opdater downstream inspektioner
          updateDownstreamInspections();
        });

      document
        .getElementById("select-finalInspection")
        .addEventListener("change", function () {
          const completeCheckbox = document.getElementById(
            "complete-finalInspection"
          );
          const dateInput = document.getElementById("date-finalInspection");

          if (this.checked) {
            completeCheckbox.removeAttribute("disabled");
            dateInput.removeAttribute("disabled");
          } else {
            completeCheckbox.setAttribute("disabled", "disabled");
            completeCheckbox.checked = false;
            dateInput.setAttribute("disabled", "disabled");
            dateInput.value = "";
          }

          // Opdater downstream inspektioner
          updateDownstreamInspections();
        });

      document
        .getElementById("select-report")
        .addEventListener("change", function () {
          const completeCheckbox = document.getElementById("complete-report");
          const dateInput = document.getElementById("date-report");

          if (this.checked) {
            completeCheckbox.removeAttribute("disabled");
            dateInput.removeAttribute("disabled");
          } else {
            completeCheckbox.setAttribute("disabled", "disabled");
            completeCheckbox.checked = false;
            dateInput.setAttribute("disabled", "disabled");
            dateInput.value = "";
          }
        });

      // Funktion til at opdatere downstream inspektioner baseret på rækkefølgen
      function updateDownstreamInspections() {
        // I den opdaterede logik skal alle inspektioner kunne vælges uafhængigt af hinanden,
        // så vi skal ikke længere deaktivere nogen checkbokse baseret på rækkefølge

        // Fjern eventuelle disabled attributter fra alle select checkbokse
        document
          .getElementById("select-firstInspection")
          .removeAttribute("disabled");
        document.getElementById("select-wpsWpqr").removeAttribute("disabled");
        document.getElementById("select-ndt").removeAttribute("disabled");
        document
          .getElementById("select-finalInspection")
          .removeAttribute("disabled");
        document.getElementById("select-report").removeAttribute("disabled");
      }

      // Kald funktionen for at sætte initial state
      updateDownstreamInspections();

      // Tilføj validering af dato-rækkefølge
      const inspectionDates = [
        document.getElementById("date-firstInspection"),
        document.getElementById("date-wpsWpqr"),
        document.getElementById("date-ndt"),
        document.getElementById("date-finalInspection"),
        document.getElementById("date-report"),
      ];

      // Funktion til at validere at datoerne er i kronologisk rækkefølge
      function validateDates() {
        const inspectionTypes = [
          "firstInspection",
          "wpsWpqr",
          "ndt",
          "finalInspection",
          "report",
        ];

        // Sorter udvalgte inspektioner med datoer efter dato
        const selectedDates = [];

        // Indsaml alle valgte inspektioner med datoer
        for (let i = 0; i < inspectionTypes.length; i++) {
          const type = inspectionTypes[i];
          const isSelected = document.getElementById(`select-${type}`).checked;
          const dateInput = document.getElementById(`date-${type}`);

          if (isSelected && dateInput.value) {
            selectedDates.push({
              type: type,
              dateInput: dateInput,
              date: new Date(dateInput.value),
            });
          }
        }

        // Sorter datoer kronologisk
        selectedDates.sort((a, b) => a.date - b.date);

        // Kontroller at inspektionerne er i den korrekte rækkefølge i forhold til inspectionTypes
        let isValid = true;

        for (let i = 1; i < selectedDates.length; i++) {
          const currentTypeIndex = inspectionTypes.indexOf(
            selectedDates[i].type
          );
          const prevTypeIndex = inspectionTypes.indexOf(
            selectedDates[i - 1].type
          );

          // Hvis en inspektion med senere type har en tidligere dato
          if (currentTypeIndex < prevTypeIndex) {
            selectedDates[i].dateInput.setCustomValidity(
              "Inspektionsdatoer skal være i kronologisk rækkefølge"
            );
            isValid = false;
            break;
          } else {
            selectedDates[i].dateInput.setCustomValidity("");
          }
        }

        // Nulstil alle fejlmeddelelser hvis gyldig
        if (isValid) {
          inspectionTypes.forEach((type) => {
            document.getElementById(`date-${type}`).setCustomValidity("");
          });
        }

        return isValid;
      }

      // Tilføj event listeners til alle datofelterne
      inspectionDates.forEach((dateInput) => {
        dateInput.addEventListener("change", validateDates);
      });

      document.getElementById("save-cancel-buttons").classList.remove("hidden");
      this.classList.add("hidden");
      document.getElementById("approve-project-button").classList.add("hidden");
      document
        .getElementById("complete-project-button")
        .classList.add("hidden");

      // Tilføj event listener til klasseprojekt checkboxen
      const classProjectCheckbox = document.getElementById(
        "project-class-project"
      );
      const inspectionsContainer = document.getElementById(
        "inspections-container"
      );

      classProjectCheckbox.addEventListener("change", function () {
        if (this.checked) {
          // Vis inspektioner
          inspectionsContainer.classList.remove("hidden");

          // Initialiser inspektionsdata hvis de ikke findes
          if (
            !project.inspections ||
            Object.keys(project.inspections).length === 0
          ) {
            // Opret tomme inspektioner
            project.inspections = {
              firstInspection: { selected: false, completed: false, date: "" },
              wpsWpqr: { selected: false, completed: false, date: "" },
              ndt: { selected: false, completed: false, date: "" },
              finalInspection: { selected: false, completed: false, date: "" },
              report: { selected: false, completed: false, date: "" },
            };

            // Opdater downstream inspektioner
            updateDownstreamInspections();
          }
        } else {
          // Skjul inspektioner
          inspectionsContainer.classList.add("hidden");
        }
      });
    });

  // Cancel edit
  document
    .getElementById("cancel-edit-button")
    .addEventListener("click", () => {
      if (editMode) {
        // Hvis vi er i redigeringstilstand, nulstil ændringer
        editMode = false;
        showProjectDetails(project.id);
      } else {
        // Hvis vi ikke er i redigeringstilstand, luk overlayet
        document.getElementById("project-modal").style.display = "none";
      }
    });

  // Save project changes
  document
    .getElementById("save-project-button")
    .addEventListener("click", () => {
      saveProjectChanges(project.id);
    });

  // Approve project
  if (document.getElementById("approve-project-button")) {
    document
      .getElementById("approve-project-button")
      .addEventListener("click", () => {
        approveProject(project.id);
      });
  }

  // Complete project
  if (document.getElementById("complete-project-button")) {
    document
      .getElementById("complete-project-button")
      .addEventListener("click", () => {
        completeProject(project.id);
      });
  }

  // Transfer project to project overview
  if (document.getElementById("transfer-project-button")) {
    document
      .getElementById("transfer-project-button")
      .addEventListener("click", () => {
        transferToProjectOverview(project.id);
      });
  }
}

// Funktion til at fjerne en medarbejder fra et projekt
function removeEmployeeFromProject(projectId, employeeId) {
  const project = projects.find((p) => p.id === projectId);
  if (project && project.employees) {
    project.employees = project.employees.filter((id) => id !== employeeId);
  }
}

// Opdater saveProjectChanges funktionen for at gemme medarbejderændringer permanent
function saveProjectChanges(projectId) {
  const project = projects.find((p) => p.id === parseInt(projectId));
  if (!project) return;

  // Gem tidligere værdier til sammenligning
  const prevTitle = project.title;

  // Opdater projektets egenskaber
  project.title = document.getElementById("project-title").value;
  project.description = document.getElementById("project-description").value;
  project.startDate = document.getElementById("project-start-date").value;
  project.deadline = document.getElementById("project-deadline").value;
  project.price = parseFloat(document.getElementById("project-price").value);
  project.contributionMargin = parseFloat(
    document.getElementById("project-contribution-margin").value
  );
  project.expectedHours = parseFloat(
    document.getElementById("project-expected-hours").value
  );

  // Bevar isInNewProjects status hvis det er et nyt projekt
  const isInNewProjectsSection = project.isInNewProjects;

  // Opdater status automatisk baseret på datoer hvis projektet ikke er afsluttet
  // og ikke er i Nye projekter sektionen
  if (project.status !== "completed" && !isInNewProjectsSection) {
    project.status = calculateProjectStatus(
      project.startDate,
      project.deadline
    );
  }

  // Opdater om projektet er et klasseprojekt
  const wasClassProject = project.isClassProject;
  project.isClassProject = document.getElementById(
    "project-class-project"
  ).checked;

  // Hvis det ikke var et klasseprojekt før, men nu er, initialiser inspektioner
  if (!wasClassProject && project.isClassProject) {
    project.inspections = {
      firstInspection: {
        selected: false,
        completed: false,
        date: "",
      },
      wpsWpqr: {
        selected: false,
        completed: false,
        date: "",
      },
      ndt: {
        selected: false,
        completed: false,
        date: "",
      },
      finalInspection: {
        selected: false,
        completed: false,
        date: "",
      },
      report: {
        selected: false,
        completed: false,
        date: "",
      },
    };
  }
  // Hvis det var et klasseprojekt, men ikke længere er, nulstil inspektioner
  else if (wasClassProject && !project.isClassProject) {
    project.inspections = {};
  }

  // Opdater inspektioner hvis det er et klasseprojekt
  if (project.isClassProject) {
    // Sikr at inspections objektet eksisterer
    if (!project.inspections) {
      project.inspections = {};
    }

    // Opdater inspektionsdata med valgt og gennemført status
    const inspectionTypes = [
      "firstInspection",
      "wpsWpqr",
      "ndt",
      "finalInspection",
      "report",
    ];

    inspectionTypes.forEach((type) => {
      if (!project.inspections[type]) {
        project.inspections[type] = {
          selected: false,
          completed: false,
          date: "",
        };
      }

      project.inspections[type].selected = document.getElementById(
        `select-${type}`
      ).checked;
      project.inspections[type].completed = document.getElementById(
        `complete-${type}`
      ).checked;
      project.inspections[type].date = document.getElementById(
        `date-${type}`
      ).value;
    });
  }

  // Hvis titlen er ændret, opdater alle relaterede bookinger
  if (prevTitle !== project.title) {
    machines.forEach((machine) => {
      machine.bookings.forEach((booking) => {
        if (booking.projectId === project.id) {
          booking.projectTitle = project.title;
        }
      });
    });
  }

  // Opdater UI for både projekter og medarbejdere
  renderProjects();
  renderEmployees();

  // Luk modal og vis succesmeddelelse
  document.getElementById("project-modal").style.display = "none";
  showNotification("Projektet er blevet opdateret", "success");
}

// Godkend projekt (start projekt)
function approveProject(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  // Opdater projektstatus til igangværende
  project.status = "ongoing";

  // Genindlæs projekter
  renderProjects();

  // Genindlæs medarbejdere for at opdatere aktive projekter
  renderEmployees();

  // Luk modal
  hideModal("project-modal");
}

// Afslut projekt
function completeProject(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  // Opdater projektstatus til afsluttet
  project.status = "completed";

  // Genindlæs projekter
  renderProjects();

  // Genindlæs medarbejdere for at opdatere aktive projekter
  renderEmployees();

  // Luk modal
  hideModal("project-modal");
}

// Beregn projektets status baseret på datoer
function calculateProjectStatus(startDate, deadline) {
  const today = new Date();
  const projectStart = new Date(startDate);
  const projectDeadline = new Date(deadline);

  // Konverter til dato uden tidspunkt for korrekt sammenligning
  today.setHours(0, 0, 0, 0);
  projectStart.setHours(0, 0, 0, 0);
  projectDeadline.setHours(0, 0, 0, 0);

  if (today < projectStart) {
    return "not-started";
  } else if (today >= projectStart && today <= projectDeadline) {
    return "ongoing";
  } else {
    // Hvis deadline er overskredet, men projektet ikke er markeret som afsluttet,
    // forbliver det "ongoing" (dette kan ændres efter kundekrav)
    return "ongoing";
  }
}

// Render medarbejdere
function renderEmployees() {
  const employeesGrid = document.querySelector(
    "#medarbejderoversigt .employees-grid"
  );
  employeesGrid.innerHTML = "";

  employees.forEach((employee) => {
    employeesGrid.appendChild(createEmployeeCard(employee));
  });
}

// Opret medarbejderkort
function createEmployeeCard(employee) {
  const employeeCard = document.createElement("div");
  employeeCard.className = "employee-card";
  employeeCard.setAttribute("data-id", employee.id);

  // Find igangværende projekter for medarbejderen
  const activeProjects = getEmployeeProjects(employee.id, false);
  let projectsHtml = "";

  if (activeProjects.length > 0) {
    projectsHtml = `
      <div class="employee-projects">
        <h4>Aktive projekter:</h4>
        <ul class="employee-project-list">
          ${activeProjects
            .map((project) => `<li>${project.title}</li>`)
            .join("")}
        </ul>
      </div>
    `;
  }

  employeeCard.innerHTML = `
    <div class="employee-img">
      <span>${employee.name.charAt(0)}</span>
    </div>
    <h3>${employee.name}</h3>
    <p class="employee-code">Kode: ${
      employee.employeeCode || "Ikke tildelt"
    }</p>
    ${projectsHtml}
  `;

  employeeCard.addEventListener("click", () => {
    showEmployeeDetails(employee);
  });

  return employeeCard;
}

// Vis medarbejderdetaljer
function showEmployeeDetails(employee) {
  // Find alle projekter for medarbejderen
  const allProjects = getEmployeeProjects(employee.id, true);

  // Opdel projekter efter status
  const ongoingProjects = allProjects.filter((p) => p.status === "ongoing");
  const completedProjects = allProjects.filter((p) => p.status === "completed");
  const notStartedProjects = allProjects.filter(
    (p) => p.status === "not-started"
  );

  // Opbyg HTML for projektlisten
  let projectsHtml = "";
  if (allProjects.length > 0) {
    projectsHtml = `
      <div class="form-group">
        <label>Tilknyttede projekter</label>
        <div class="employee-projects-detail">
          ${
            ongoingProjects.length > 0
              ? `
            <h4>Igangværende projekter</h4>
            <table class="employee-projects-table">
              <thead>
                <tr>
                  <th>Projekt</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                ${ongoingProjects
                  .map(
                    (project) => `
                  <tr data-project-id="${project.id}">
                    <td>${project.title}</td>
                    <td><span class="status-pill ${getStatusClass(
                      project.status
                    )}">${getStatusDisplayText(project.status)}</span></td>
                    <td>${formatDate(project.deadline)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : ""
          }
          
          ${
            completedProjects.length > 0
              ? `
            <h4 class="mt-4">Afsluttede projekter</h4>
            <table class="employee-projects-table">
              <thead>
                <tr>
                  <th>Projekt</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                ${completedProjects
                  .map(
                    (project) => `
                  <tr data-project-id="${project.id}">
                    <td>${project.title}</td>
                    <td><span class="status-pill ${getStatusClass(
                      project.status
                    )}">${getStatusDisplayText(project.status)}</span></td>
                    <td>${formatDate(project.deadline)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : ""
          }
          
          ${
            notStartedProjects.length > 0
              ? `
            <h4 class="mt-4">Ikke påbegyndte projekter</h4>
            <table class="employee-projects-table">
              <thead>
                <tr>
                  <th>Projekt</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                ${notStartedProjects
                  .map(
                    (project) => `
                  <tr data-project-id="${project.id}">
                    <td>${project.title}</td>
                    <td><span class="status-pill ${getStatusClass(
                      project.status
                    )}">${getStatusDisplayText(project.status)}</span></td>
                    <td>${formatDate(project.deadline)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : ""
          }
        </div>
      </div>
    `;
  } else {
    projectsHtml = `
      <div class="form-group">
        <label>Tilknyttede projekter</label>
        <p class="no-projects">Ingen projekter tilknyttet denne medarbejder</p>
      </div>
    `;
  }

  const modalContent = document.querySelector(
    "#employee-modal .employee-details"
  );

  modalContent.innerHTML = `
    <div class="form-group">
      <label>Navn</label>
      <input type="text" id="employee-name" value="${employee.name}">
    </div>
    <div class="form-group">
      <label>Medarbejderkode</label>
      <input type="text" id="employee-code" value="${
        employee.employeeCode || ""
      }">
    </div>
    <div class="form-group">
      <label>Kompetencer</label>
      <textarea id="employee-skills">${employee.skills.join(", ")}</textarea>
    </div>
    ${projectsHtml}
    <div class="form-actions">
      <button class="primary-btn" id="save-employee" data-id="${
        employee.id
      }">Gem ændringer</button>
    </div>
  `;

  // Tilføj event listeners til gem-knappen
  document.getElementById("save-employee").addEventListener("click", () => {
    saveEmployeeChanges(employee.id);
  });

  // Tilføj event listeners til projekt-rækker
  document
    .querySelectorAll(".employee-projects-table tbody tr")
    .forEach((row) => {
      row.addEventListener("click", () => {
        const projectId = parseInt(row.getAttribute("data-project-id"));
        // Luk medarbejder-modalen
        hideModal("employee-modal");
        // Åbn projekt-detaljer
        showProjectDetails(projectId);
      });
    });

  // Vis modal
  showModal("employee-modal");
}

// Gem medarbejderændringer
function saveEmployeeChanges(employeeId) {
  const employee = employees.find((e) => e.id === employeeId);
  if (!employee) return;

  employee.name = document.getElementById("employee-name").value;
  employee.employeeCode = document.getElementById("employee-code").value;

  // Split kompetencerne ved komma og trim mellemrum
  const skillsText = document.getElementById("employee-skills").value;
  employee.skills = skillsText
    .split(",")
    .map((skill) => skill.trim())
    .filter((skill) => skill);

  // Genindlæs medarbejdere
  renderEmployees();

  // Luk modal
  hideModal("employee-modal");
}

// Render maskiner
function renderMachines() {
  const machinesGrid = document.querySelector("#maskinbooking .machines-grid");
  machinesGrid.innerHTML = "";

  machines.forEach((machine) => {
    const machineCard = document.createElement("div");
    machineCard.className = "machine-card";
    machineCard.setAttribute("data-id", machine.id);

    machineCard.innerHTML = `
            <h3>${machine.name}</h3>
            <p>${machine.type}</p>
        `;

    machineCard.addEventListener("click", () => {
      showMachineDetails(machine);
    });

    machinesGrid.appendChild(machineCard);
  });

  // Render kalenderen hvis den er initialiseret
  if (bookingCalendar) {
    bookingCalendar.render();
  }
}

// Tilføj ny maskine
function addNewMachine() {
  // Vis modalen til at tilføje ny maskine
  showModal("add-machine-modal");
}

// Opret ny maskine fra formularen
function createNewMachine() {
  const machineName = document.getElementById("new-machine-name").value.trim();
  const machineType = document.getElementById("new-machine-type").value.trim();
  const machineColor = document.getElementById("new-machine-color").value;

  // Valider input
  if (!machineName) {
    showNotification("Indtast venligst et navn på maskinen", "error");
    return;
  }

  // Opret ny maskine
  const newMachine = {
    id: machines.length + 1,
    name: machineName,
    type: machineType || "Ikke specificeret",
    color: machineColor,
    bookings: [],
  };

  // Tilføj til maskinlisten
  machines.push(newMachine);

  // Nulstil formularfelter
  document.getElementById("new-machine-name").value = "";
  document.getElementById("new-machine-type").value = "";

  // Opdater visningen
  renderMachines();

  // Luk modalen
  hideModal("add-machine-modal");

  // Vis succesbesked
  showNotification(`Maskinen '${machineName}' er blevet oprettet`, "success");
}

// Vis maskindetaljer og booking
function showMachineDetails(machine) {
  const modalContent = document.querySelector(
    "#machine-modal .machine-details"
  );

  let bookingsHTML =
    '<div class="machine-bookings"><h4>Eksisterende bookinger</h4>';

  if (machine.bookings.length === 0) {
    bookingsHTML += "<p>Ingen bookinger endnu</p>";
  } else {
    bookingsHTML += "<ul>";
    machine.bookings.forEach((booking) => {
      const timeInfo = booking.startTime
        ? `${booking.startTime} - ${booking.endTime}`
        : "Hele dagen";

      const projectInfo = booking.projectId
        ? `<span class="booking-project">${
            booking.projectTitle || getProjectTitle(booking.projectId)
          }</span>`
        : "";

      const descriptionInfo = booking.description
        ? `<span class="booking-description">${booking.description}</span>`
        : "";

      const isMultiDay = booking.startDate !== booking.endDate;
      const dateClass = isMultiDay ? "multiday-booking" : "";
      const dateInfo = isMultiDay
        ? `${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`
        : formatDate(booking.startDate);

      const daysCount = isMultiDay
        ? ` <span class="days-count">(${calculateDays(
            booking.startDate,
            booking.endDate
          )} dage)</span>`
        : "";

      bookingsHTML += `
        <li class="${dateClass}">
          <div>
            <span class="booking-date">${dateInfo}</span>${daysCount}
            <span class="booking-time">${timeInfo}</span>
            ${projectInfo} ${descriptionInfo}
          </div>
          <div class="booking-actions">
            <button class="edit-booking" data-machine="${machine.id}" data-booking="${booking.id}">Redigér</button>
            <button class="delete-booking" data-machine="${machine.id}" data-booking="${booking.id}">Slet</button>
          </div>
        </li>
      `;
    });
    bookingsHTML += "</ul>";
  }

  bookingsHTML += `
    <div class="booking-info-note">
      <p>Bookinger kan tilføjes via kalenderen. Klik på et dato i kalenderoversigten for at tilføje en ny booking.</p>
    </div>
  </div>`;

  modalContent.innerHTML = `
    <div class="form-group">
      <label>Maskinnavn</label>
      <input type="text" id="machine-name" value="${machine.name}">
    </div>
    <div class="form-group">
      <label>Type</label>
      <input type="text" id="machine-type" value="${machine.type}">
    </div>
    <div class="form-group">
      <label>Farve</label>
      <input type="color" id="machine-color" value="${
        machine.color || "#3498db"
      }">
      <small>Vælg en farve til visning i kalenderen</small>
    </div>
    ${bookingsHTML}
    <div class="form-actions">
      <button class="primary-btn" id="save-machine" data-id="${
        machine.id
      }">Gem ændringer</button>
    </div>
  `;

  // Tilføj event listeners til gem-knappen
  document.getElementById("save-machine").addEventListener("click", () => {
    saveMachineChanges(machine.id);
  });

  // Tilføj event listeners til slet-knapper for bookinger
  const deleteButtons = document.querySelectorAll(".delete-booking");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const machineId = parseInt(button.getAttribute("data-machine"));
      const bookingId = parseInt(button.getAttribute("data-booking"));
      deleteMachineBooking(machineId, bookingId);
    });
  });

  // Tilføj event listeners til redigér-knapper for bookinger
  const editButtons = document.querySelectorAll(".edit-booking");
  editButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const machineId = parseInt(button.getAttribute("data-machine"));
      const bookingId = parseInt(button.getAttribute("data-booking"));
      editMachineBooking(machineId, bookingId);
    });
  });

  // Vis modal
  showModal("machine-modal");
}

// Beregn antal dage mellem to datoer (inklusive)
function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 for at inkludere både start- og slutdato
}

// Gem maskinændringer
function saveMachineChanges(machineId) {
  const machine = machines.find((m) => m.id === machineId);
  if (!machine) return;

  machine.name = document.getElementById("machine-name").value;
  machine.type = document.getElementById("machine-type").value;
  machine.color = document.getElementById("machine-color").value;

  // Genindlæs maskiner
  renderMachines();

  // Luk modal
  hideModal("machine-modal");
}

// Slet en maskinbooking
function deleteMachineBooking(machineId, bookingId) {
  const machine = machines.find((m) => m.id === machineId);
  if (!machine) return;

  machine.bookings = machine.bookings.filter(
    (booking) => booking.id !== bookingId
  );

  // Opdater kalender hvis den er initialiseret
  if (bookingCalendar) {
    bookingCalendar.removeBooking(machineId, bookingId);
  }

  // Opdater modalens indhold uden den slettede booking
  showMachineDetails(machine);
}

// Redigér en maskinbooking
function editMachineBooking(machineId, bookingId) {
  const machine = machines.find((m) => m.id === machineId);
  if (!machine) return;

  const booking = machine.bookings.find((b) => b.id === bookingId);
  if (!booking) return;

  // Gem booking-data til senere reference
  const editModal = document.getElementById("edit-booking-modal");
  editModal.setAttribute("data-machine-id", machineId);
  editModal.setAttribute("data-booking-id", bookingId);

  // Udfyld formularen med de eksisterende data
  document.getElementById("edit-booking-start-date").value = booking.startDate;
  document.getElementById("edit-booking-end-date").value = booking.endDate;

  // Generer tidspunkter
  const startTimeSelect = document.getElementById("edit-booking-start-time");
  const endTimeSelect = document.getElementById("edit-booking-end-time");

  startTimeSelect.innerHTML = "";
  endTimeSelect.innerHTML = "";

  // Generer tidspunkter fra 6:00 til 18:00 med 30 min intervaller
  for (let hour = 6; hour <= 18; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const timeStr = `${hour}:${min === 0 ? "00" : min}`;

      const startOption = document.createElement("option");
      startOption.value = timeStr;
      startOption.textContent = timeStr;
      if (timeStr === booking.startTime) {
        startOption.selected = true;
      }
      startTimeSelect.appendChild(startOption);

      const endOption = document.createElement("option");
      endOption.value = timeStr;
      endOption.textContent = timeStr;
      if (timeStr === booking.endTime) {
        endOption.selected = true;
      }
      endTimeSelect.appendChild(endOption);
    }
  }

  // Udfyld projekter
  const projectSelect = document.getElementById("edit-booking-project");
  projectSelect.innerHTML = '<option value="">Vælg projekt (valgfrit)</option>';

  // Tilføj aktive projekter til dropdown
  const activeProjects = projects.filter((p) => p.status === "ongoing");
  activeProjects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.title;
    if (booking.projectId === project.id) {
      option.selected = true;
    }
    projectSelect.appendChild(option);
  });

  // Sæt beskrivelse
  document.getElementById("edit-booking-description").value =
    booking.description || "";

  // Tilføj event listener til opdater-knappen
  document
    .getElementById("update-booking-btn")
    .addEventListener("click", updateBooking);

  // Vis modalen
  showModal("edit-booking-modal");
}

// Opdater en booking
function updateBooking() {
  const editModal = document.getElementById("edit-booking-modal");
  const machineId = parseInt(editModal.getAttribute("data-machine-id"));
  const bookingId = parseInt(editModal.getAttribute("data-booking-id"));

  const machine = machines.find((m) => m.id === machineId);
  if (!machine) return;

  const booking = machine.bookings.find((b) => b.id === bookingId);
  if (!booking) return;

  // Hent de opdaterede værdier
  const startDate = document.getElementById("edit-booking-start-date").value;
  const endDate = document.getElementById("edit-booking-end-date").value;
  const startTime = document.getElementById("edit-booking-start-time").value;
  const endTime = document.getElementById("edit-booking-end-time").value;
  const projectId = document.getElementById("edit-booking-project").value;
  const description = document.getElementById("edit-booking-description").value;

  // Valider input
  if (!startDate || !endDate || !startTime || !endTime) {
    showNotification("Alle dato- og tidsfelter skal udfyldes", "error");
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    showNotification("Startdato kan ikke være efter slutdato", "error");
    return;
  }

  // Tjek for overlappende bookninger (undtagen den nuværende booking)
  const overlappingBookings = machine.bookings.filter((b) => {
    // Spring den nuværende booking over i tjekket
    if (b.id === bookingId) return false;

    // Tjek for overlap
    const existingStart = new Date(`${b.startDate}T${b.startTime}`);
    const existingEnd = new Date(`${b.endDate}T${b.endTime}`);
    const newStart = new Date(`${startDate}T${startTime}`);
    const newEnd = new Date(`${endDate}T${endTime}`);

    return (
      (newStart <= existingEnd && newStart >= existingStart) ||
      (newEnd <= existingEnd && newEnd >= existingStart) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });

  if (overlappingBookings.length > 0) {
    showNotification("Der er allerede bookinger i det valgte tidsrum", "error");
    return;
  }

  // Opdater booking
  booking.startDate = startDate;
  booking.endDate = endDate;
  booking.startTime = startTime;
  booking.endTime = endTime;

  if (projectId) {
    booking.projectId = parseInt(projectId);
    booking.projectTitle =
      projects.find((p) => p.id === parseInt(projectId))?.title || "";
    booking.description = "";
  } else {
    booking.projectId = null;
    booking.projectTitle = "";
    booking.description = description;
  }

  // Luk modalen
  hideModal("edit-booking-modal");

  // Opdater UI
  if (bookingCalendar) {
    bookingCalendar.render();
  }

  // Vis maskindetaljer igen
  showMachineDetails(machine);

  // Vis succesbesked
  showNotification("Bookingen er blevet opdateret", "success");
}

// Render booking-kalender
function renderBookingCalendar() {
  // Dette er nu flyttet til BookingCalendar klassen i calendar.js
  if (bookingCalendar) {
    bookingCalendar.render();
  }
}

// Import fra Business Central (simuleret)
function importFromBusinessCentral() {
  showNotification("Forbinder til Business Central API...", "info");

  // Brug 24-03-2025 som reference dato
  const referenceDate = new Date(2025, 2, 24); // Bemærk: måneder er 0-indekseret, så 2 = marts

  // Start dato: 14 dage efter reference dato
  const startDate = new Date(referenceDate);
  startDate.setDate(referenceDate.getDate() + 14);

  // Deadline: 2 måneder efter start dato
  const deadline = new Date(startDate);
  deadline.setMonth(startDate.getMonth() + 2);

  // Simuler et nyt projekt fra Business Central
  const newProject = {
    id: projects.length + 1,
    title: "Nyt projekt fra Business Central",
    description:
      "Dette projekt blev importeret automatisk fra Business Central. Redigér beskrivelsen for at tilføje flere detaljer om projektets omfang og formål.",
    startDate: startDate.toISOString().slice(0, 10),
    deadline: deadline.toISOString().slice(0, 10),
    price: 325000,
    contributionMargin: 45,
    expectedHours: 160,
    status: "not-started",
    isClassProject: Math.random() > 0.5, // Tilfældigt
    isInNewProjects: true,
    employees: [], // Ingen medarbejdere tilknyttet ved import
    inspections: {},
  };

  // Hvis det er et klasseprojekt, initialiser inspections
  if (newProject.isClassProject) {
    newProject.inspections = {
      firstInspection: {
        selected: false,
        completed: false,
        date: "",
      },
      wpsWpqr: {
        selected: false,
        completed: false,
        date: "",
      },
      ndt: {
        selected: false,
        completed: false,
        date: "",
      },
      finalInspection: {
        selected: false,
        completed: false,
        date: "",
      },
      report: {
        selected: false,
        completed: false,
        date: "",
      },
    };
  }

  projects.push(newProject);
  renderProjects();

  showNotification("Nyt projekt importeret: " + newProject.title, "success");
}

// Hjælpefunktioner
function formatDate(dateString) {
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Date(dateString).toLocaleDateString("da-DK", options);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("da-DK").format(amount);
}

// Find projekttitel ud fra projektets ID
function getProjectTitle(projectId) {
  if (!projectId) return "";
  const project = projects.find((p) => p.id === projectId);
  return project ? project.title : "";
}

// Efter et projekt er ændret, opdater tilknyttede bookinger
function updateBookingsAfterProjectChange(projectId, newTitle) {
  // Opdater alle maskinbookinger der refererer til dette projekt
  machines.forEach((machine) => {
    machine.bookings.forEach((booking) => {
      if (booking.projectId === projectId) {
        booking.projectTitle = newTitle;
      }
    });
  });

  // Hvis kalenderen er initialiseret, opdater projektlisten
  if (bookingCalendar) {
    bookingCalendar.updateProjects(projects);
    bookingCalendar.render();
  }
}

// Tilføj ny medarbejder
function addNewEmployee() {
  const modalContent = document.querySelector(
    "#employee-modal .employee-details"
  );

  modalContent.innerHTML = `
    <div class="form-group">
      <label>Navn</label>
      <input type="text" id="employee-name" placeholder="Indtast medarbejdernavn">
    </div>
    <div class="form-group">
      <label>Medarbejderkode</label>
      <input type="text" id="employee-code" placeholder="Indtast medarbejderkode">
      <div class="help-text">F.eks.: AJ2023 (initialer + årstal)</div>
    </div>
    <div class="form-group">
      <label>Kompetencer</label>
      <textarea id="employee-skills" placeholder="Indtast kompetencer, adskilt af komma"></textarea>
      <div class="help-text">F.eks.: Svejsning, Motorinstallation, Hydraulik</div>
    </div>
    <div class="form-actions">
      <button class="primary-btn" id="create-employee">Opret medarbejder</button>
    </div>
  `;

  // Tilføj event listener til opret-knappen
  document.getElementById("create-employee").addEventListener("click", () => {
    createNewEmployee();
  });

  // Vis modal
  showModal("employee-modal");
}

// Opret ny medarbejder
function createNewEmployee() {
  const name = document.getElementById("employee-name").value.trim();
  const employeeCode = document.getElementById("employee-code").value.trim();
  const skillsText = document.getElementById("employee-skills").value;

  // Valider input
  if (!name) {
    alert("Indtast venligst et navn på medarbejderen");
    return;
  }

  // Generer automatisk medarbejderkode hvis der ikke er angivet én
  let finalEmployeeCode = employeeCode;
  if (!finalEmployeeCode) {
    // Tag de første bogstaver fra for- og efternavn + år
    const nameParts = name.split(" ");
    const initials = nameParts.map((part) => part.charAt(0)).join("");
    const year = new Date().getFullYear();
    finalEmployeeCode = `${initials}${year}`;
  }

  // Split kompetencerne ved komma og trim mellemrum
  const skills = skillsText
    .split(",")
    .map((skill) => skill.trim())
    .filter((skill) => skill);

  // Opret ny medarbejder
  const newEmployee = {
    id: employees.length + 1,
    name: name,
    employeeCode: finalEmployeeCode,
    skills: skills,
  };

  // Tilføj til medarbejderlisten
  employees.push(newEmployee);

  // Genindlæs medarbejdere
  renderEmployees();

  // Luk modal
  hideModal("employee-modal");
}

// Hjælpefunktion til at få medarbejdernavne for et projekt
function getProjectEmployees(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project || !project.employees || project.employees.length === 0) {
    return [];
  }

  return project.employees
    .map((employeeId) => {
      const employee = employees.find((e) => e.id === employeeId);
      return employee ? employee.name : null;
    })
    .filter((name) => name !== null);
}

// Hjælpefunktion til at få aktive projekter for en medarbejder
function getEmployeeProjects(employeeId, includeAllStatuses = false) {
  return projects.filter((project) => {
    // Kontroller om medarbejder-ID findes i projektets employees array
    const isAssigned =
      project.employees && project.employees.includes(employeeId);

    // Filtrer projekter baseret på status og om medarbejderen er tilknyttet
    if (!isAssigned) return false;

    // Hvis vi skal inkludere alle statusser
    if (includeAllStatuses) {
      return true;
    }

    // Ellers returner kun igangværende projekter
    return project.status === "ongoing";
  });
}

// Hjælpefunktion til at få status-visningstekst
function getStatusDisplayText(status) {
  switch (status) {
    case "not-started":
      return "Ikke påbegyndt";
    case "ongoing":
      return "Igangværende";
    case "completed":
      return "Afsluttet";
    default:
      return "Ukendt";
  }
}

// Hjælpefunktion til at få CSS-klasse for status
function getStatusClass(status) {
  switch (status) {
    case "not-started":
      return "status-not-started";
    case "ongoing":
      return "status-ongoing";
    case "completed":
      return "status-completed";
    default:
      return "";
  }
}

// Overfør projekt til projektoversigt
function transferToProjectOverview(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  // Marker projektet som ikke længere nyt
  project.isInNewProjects = false;

  // Sæt status til ongoing så det vises i projektoversigten
  project.status = "ongoing";

  // Genindlæs projekter
  renderProjects();

  // Genindlæs medarbejdere for at opdatere projekt-relationer
  renderEmployees();

  // Luk modal
  hideModal("project-modal");

  // Vis succesmeddelelse
  showNotification(
    "Projektet er blevet overført til projektoversigten",
    "success"
  );
}

// Vis notifikation
function showNotification(message, type = "info") {
  // Opret notifikations-element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Tilføj notifikation til DOM
  const notificationsContainer = document.getElementById("notifications");

  // Hvis container ikke findes, opret den
  if (!notificationsContainer) {
    const newContainer = document.createElement("div");
    newContainer.id = "notifications";
    document.body.appendChild(newContainer);
    newContainer.appendChild(notification);
  } else {
    notificationsContainer.appendChild(notification);
  }

  // Fjern notifikation efter 3 sekunder
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}
