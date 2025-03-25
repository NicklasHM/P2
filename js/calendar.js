/**
 * Kalender komponent til maskinbooking
 * Denne fil implementerer en kalender til maskinbooking med mulighed for specifikke tidspunkter
 */

class BookingCalendar {
  constructor(containerId, machines, projects) {
    this.containerId = containerId;
    this.machines = machines;
    this.projects = projects || [];
    this.bookings = [];
    this.currentDate = new Date();
    this.selectedMachine = null;
    this.timeSlots = [];

    // Generer tidspunkter fra 6:00 til 18:00 med 30 min intervaller
    for (let hour = 6; hour <= 18; hour++) {
      this.timeSlots.push(`${hour}:00`);
      if (hour < 18) this.timeSlots.push(`${hour}:30`);
    }
  }

  // Opdater projektlisten
  updateProjects(projects) {
    this.projects = projects || [];
  }

  // Indlæs kalenderen
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Hent eksisterende bookinger for at vise dem i kalenderen
    this.collectAllBookings();

    // Opret kalenderen
    const calendarHTML = this.createCalendarHTML();
    container.innerHTML = calendarHTML;

    // Tilføj event listeners til kalenderen
    this.addEventListeners();
  }

  // Opsaml alle bookinger fra maskinerne
  collectAllBookings() {
    this.bookings = [];
    this.machines.forEach((machine) => {
      machine.bookings.forEach((booking) => {
        this.bookings.push({
          machineId: machine.id,
          id: booking.id,
          machineName: machine.name,
          projectId: booking.projectId,
          projectTitle:
            booking.projectTitle || this.getProjectTitle(booking.projectId),
          description: booking.description || "",
          startDate: booking.startDate,
          endDate: booking.endDate,
          startTime: booking.startTime || "8:00",
          endTime: booking.endTime || "16:00",
        });
      });
    });
  }

  // Find projekttitel ud fra projektets ID
  getProjectTitle(projectId) {
    if (!projectId) return "";
    const project = this.projects.find((p) => p.id === projectId);
    return project ? project.title : "";
  }

  // Opret kalender HTML
  createCalendarHTML() {
    const daysInMonth = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      0
    ).getDate();

    const firstDayOfMonth = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1
    ).getDay();

    const monthNames = [
      "Januar",
      "Februar",
      "Marts",
      "April",
      "Maj",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "December",
    ];

    // Opret kalender header med korrekt markering af valgt maskine i dropdown
    let html = `
      <div class="calendar-header">
        <div class="calendar-nav">
          <button id="prev-month">&lt;</button>
          <h3>${
            monthNames[this.currentDate.getMonth()]
          } ${this.currentDate.getFullYear()}</h3>
          <button id="next-month">&gt;</button>
        </div>
        <div class="machine-selector">
          <label for="machine-select">Vælg maskine:</label>
          <select id="machine-select">
            <option value="" ${
              !this.selectedMachine ? "selected" : ""
            }>Alle maskiner</option>
            ${this.machines
              .map(
                (m) =>
                  `<option value="${m.id}" ${
                    this.selectedMachine === m.id ? "selected" : ""
                  }>${m.name}</option>`
              )
              .join("")}
          </select>
        </div>
      </div>
      <div class="calendar-body">
        <div class="calendar-weekdays">
          <div>Man</div>
          <div>Tir</div>
          <div>Ons</div>
          <div>Tor</div>
          <div>Fre</div>
          <div>Lør</div>
          <div>Søn</div>
        </div>
        <div class="calendar-days">
    `;

    // Juster startdagen (0 = søndag i JavaScript, vi vil have mandag som første dag)
    let adjustedFirstDay = firstDayOfMonth - 1;
    if (adjustedFirstDay < 0) adjustedFirstDay = 6; // Søndag bliver til den sidste dag

    // Tilføj tomme felter for dage før måneden starter
    for (let i = 0; i < adjustedFirstDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // Tilføj dage i måneden
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        day
      );
      const dateStr = this.formatDateForData(date);
      const bookingsForDay = this.getBookingsForDate(dateStr);

      let bookingsList = "";
      if (bookingsForDay.length > 0) {
        bookingsList = '<div class="day-bookings">';
        bookingsForDay.forEach((booking) => {
          const isService =
            booking.description &&
            booking.description.toLowerCase().includes("service");

          const isMultiDay = booking.startDate !== booking.endDate;

          // Bestem korrekt klasse baseret på flerdagesbooking og service type
          let bookingClass = "booking-item";
          if (isMultiDay) bookingClass += " multiday";
          if (isService) bookingClass += " service";

          bookingsList += `
            <div class="${bookingClass}" data-machine-id="${
            booking.machineId
          }" data-booking-id="${booking.id}" style="background-color: ${
            booking.color
          }">
              ${booking.machineName}: ${booking.startTime} - ${booking.endTime}
              ${
                booking.projectTitle
                  ? `<span class="booking-project">${booking.projectTitle}</span>`
                  : ""
              }
              ${
                isMultiDay
                  ? `<span class="multiday-indicator">${this.formatShortDate(
                      new Date(booking.startDate)
                    )} - ${this.formatShortDate(
                      new Date(booking.endDate)
                    )}</span>`
                  : ""
              }
            </div>
          `;
        });
        bookingsList += "</div>";
      }

      html += `
        <div class="calendar-day" data-date="${dateStr}">
          <div class="day-number">${day}</div>
          ${bookingsList}
          <button class="add-booking-btn" data-date="${dateStr}">+</button>
        </div>
      `;
    }

    html += `
        </div>
      </div>
      <div id="booking-modal" class="booking-time-modal">
        <div class="booking-modal-content">
          <span class="close-booking-modal">&times;</span>
          <h4>Book maskintid</h4>
          <div class="booking-form-container">
            <div class="booking-form-group">
              <label>Maskine</label>
              <select id="booking-machine">
                ${this.machines
                  .map((m) => `<option value="${m.id}">${m.name}</option>`)
                  .join("")}
              </select>
            </div>
            <div class="booking-form-group">
              <label>Projekt</label>
              <select id="booking-project">
                <option value="">Intet projekt (f.eks. service)</option>
                ${this.projects
                  .filter((p) => p.status !== "completed")
                  .map((p) => `<option value="${p.id}">${p.title}</option>`)
                  .join("")}
              </select>
            </div>
            <div class="booking-form-group">
              <label>Startdato</label>
              <input type="date" id="booking-date">
            </div>
            <div class="booking-form-group">
              <label>Slutdato</label>
              <input type="date" id="booking-end-date">
            </div>
            <div class="booking-form-group">
              <label>Starttidspunkt</label>
              <select id="booking-start-time">
                ${this.timeSlots
                  .map((time) => `<option value="${time}">${time}</option>`)
                  .join("")}
              </select>
            </div>
            <div class="booking-form-group">
              <label>Sluttidspunkt</label>
              <select id="booking-end-time">
                ${this.timeSlots
                  .map((time) => `<option value="${time}">${time}</option>`)
                  .join("")}
              </select>
            </div>
            <div class="booking-form-group">
              <label>Beskrivelse (f.eks. service, vedligehold)</label>
              <textarea id="booking-description" rows="3"></textarea>
            </div>
            <div class="booking-form-actions">
              <button id="save-booking" class="primary-btn">Gem booking</button>
            </div>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  // Find alle bookinger for en bestemt dato
  getBookingsForDate(dateStr) {
    let bookings = this.bookings.filter((booking) => {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const date = new Date(dateStr);

      return date >= startDate && date <= endDate;
    });

    // Filter baseret på valgt maskine hvis det er sat
    if (this.selectedMachine) {
      bookings = bookings.filter(
        (booking) => booking.machineId === this.selectedMachine
      );
    }

    // Tilføj maskinfarven til hver booking
    bookings = bookings.map((booking) => {
      const machine = this.machines.find((m) => m.id === booking.machineId);
      return {
        ...booking,
        color: machine?.color || "#3498db", // Default blå farve hvis ingen farve er defineret
      };
    });

    return bookings;
  }

  // Tilføj event listeners til kalenderen
  addEventListeners() {
    const container = document.getElementById(this.containerId);

    // Navigation mellem måneder
    const prevMonthBtn = container.querySelector("#prev-month");
    const nextMonthBtn = container.querySelector("#next-month");

    prevMonthBtn.addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
    });

    nextMonthBtn.addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
    });

    // Maskinfiltrering
    const machineSelect = container.querySelector("#machine-select");
    machineSelect.addEventListener("change", (e) => {
      this.selectedMachine = e.target.value ? parseInt(e.target.value) : null;
      this.render();
    });

    // Åbn booking-modal når der klikkes på "+" knappen
    const addBookingBtns = container.querySelectorAll(".add-booking-btn");
    addBookingBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const date = e.target.getAttribute("data-date");
        this.openBookingModal(date);
      });
    });

    // Booking modal lukkeknap
    const closeModalBtn = container.querySelector(".close-booking-modal");
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => {
        this.closeBookingModal();
      });
    }

    // Gem booking knap
    const saveBookingBtn = container.querySelector("#save-booking");
    if (saveBookingBtn) {
      saveBookingBtn.addEventListener("click", () => {
        this.saveBooking();
      });
    }

    // Klik på en eksisterende booking for at se detaljer eller slette
    const bookingItems = container.querySelectorAll(".booking-item");
    bookingItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const machineId = parseInt(item.getAttribute("data-machine-id"));
        const bookingId = parseInt(item.getAttribute("data-booking-id"));
        this.showBookingDetails(machineId, bookingId);
      });
    });
  }

  // Åbn booking modal
  openBookingModal(date) {
    const modal = document.getElementById("booking-modal");
    const dateInput = document.getElementById("booking-date");
    const endDateInput = document.getElementById("booking-end-date");
    const startTimeSelect = document.getElementById("booking-start-time");
    const endTimeSelect = document.getElementById("booking-end-time");

    // Indstil standardværdier
    dateInput.value = date;
    endDateInput.value = date; // Som standard samme dag
    startTimeSelect.value = "8:00";
    endTimeSelect.value = "16:00";

    // Hvis der er valgt en maskine i filtreringen, vælg den som standard
    if (this.selectedMachine) {
      const machineSelect = document.getElementById("booking-machine");
      machineSelect.value = this.selectedMachine;
    }

    modal.style.display = "block";
  }

  // Luk booking modal
  closeBookingModal() {
    const modal = document.getElementById("booking-modal");
    modal.style.display = "none";
  }

  // Gem booking
  saveBooking() {
    const machineId = parseInt(
      document.getElementById("booking-machine").value
    );
    const projectId = document.getElementById("booking-project").value
      ? parseInt(document.getElementById("booking-project").value)
      : null;
    const startDate = document.getElementById("booking-date").value;
    const endDate =
      document.getElementById("booking-end-date").value || startDate;
    const startTime = document.getElementById("booking-start-time").value;
    const endTime = document.getElementById("booking-end-time").value;
    const description = document
      .getElementById("booking-description")
      .value.trim();

    // Validering
    if (!machineId || !startDate || !startTime || !endTime) {
      alert("Udfyld venligst maskine, dato og tidspunkter");
      return;
    }

    // Tjek om slutdato er efter startdato
    if (new Date(endDate) < new Date(startDate)) {
      alert("Slutdato skal være efter eller samme som startdato");
      return;
    }

    // Konverter tidspunkter til minutter for korrekt sammenligning
    // Men kun tjek for overlap hvis start- og slutdato er ens
    const startTimeValue = this.convertTimeToMinutes(startTime);
    const endTimeValue = this.convertTimeToMinutes(endTime);

    // Kun tjek tidspunktsoverlap hvis det er på samme dag
    if (startDate === endDate && startTimeValue >= endTimeValue) {
      alert("Starttidspunktet skal være før sluttidspunktet på samme dag");
      return;
    }

    // Find maskinen
    const machine = this.machines.find((m) => m.id === machineId);
    if (!machine) return;

    // Find projekttitlen hvis der er valgt et projekt
    let projectTitle = "";
    if (projectId) {
      const project = this.projects.find((p) => p.id === projectId);
      if (project) {
        projectTitle = project.title;
      }
    }

    // Tjek om der er overlap med eksisterende bookinger
    const hasOverlap = this.checkForDateRangeOverlap(
      machineId,
      startDate,
      endDate,
      startTime,
      endTime
    );
    if (hasOverlap) {
      alert("Der er allerede en booking på denne maskine i det valgte tidsrum");
      return;
    }

    // Opret ny booking
    const newBooking = {
      id: machine.bookings.length + 1,
      projectId: projectId,
      projectTitle: projectTitle,
      description: description,
      startDate: startDate,
      endDate: endDate,
      startTime: startTime,
      endTime: endTime,
    };

    // Tilføj booking til maskinen
    machine.bookings.push(newBooking);

    // Luk modal og genrender kalenderen
    this.closeBookingModal();
    this.render();
  }

  // Konverter tidspunkt til minutter for nemmere sammenligning
  convertTimeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }

  // Tjek for tidsmæssigt overlap mellem bookinger over dato-intervaller
  checkForDateRangeOverlap(machineId, startDate, endDate, startTime, endTime) {
    const machine = this.machines.find((m) => m.id === machineId);
    if (!machine) return false;

    // Konverter til Date objekter for sammenligning
    const bookingStart = new Date(startDate);
    const bookingEnd = new Date(endDate);

    // Konverter tidspunkter til minutter
    const startTimeValue = this.convertTimeToMinutes(startTime);
    const endTimeValue = this.convertTimeToMinutes(endTime);

    return machine.bookings.some((booking) => {
      const existingStart = new Date(booking.startDate);
      const existingEnd = new Date(booking.endDate);

      // Konverter eksisterende tidspunkter
      const existingStartTime = this.convertTimeToMinutes(booking.startTime);
      const existingEndTime = this.convertTimeToMinutes(booking.endTime);

      // Tjek for datooverlap (om perioderne overlapper)
      const dateRangeOverlap =
        bookingStart <= existingEnd && bookingEnd >= existingStart;

      if (!dateRangeOverlap) {
        return false; // Ingen datooverlap
      }

      // Hvis startdato er samme som eksisterende booking's startdato
      if (bookingStart.getTime() === existingStart.getTime()) {
        // Tjek for tidsoverlap på samme startdato
        return (
          (startTimeValue >= existingStartTime &&
            startTimeValue < existingEndTime) ||
          (endTimeValue > existingStartTime &&
            endTimeValue <= existingEndTime) ||
          (startTimeValue <= existingStartTime &&
            endTimeValue >= existingEndTime)
        );
      }

      // Hvis slutdato er samme som eksisterende booking's slutdato
      if (bookingEnd.getTime() === existingEnd.getTime()) {
        // Tjek for tidsoverlap på samme slutdato
        return (
          (startTimeValue >= existingStartTime &&
            startTimeValue < existingEndTime) ||
          (endTimeValue > existingStartTime &&
            endTimeValue <= existingEndTime) ||
          (startTimeValue <= existingStartTime &&
            endTimeValue >= existingEndTime)
        );
      }

      // Hvis datoerne overlapper men ikke er ens, betragtes det som overlap
      // Dette håndterer booking over flere dage
      return true;
    });
  }

  // Tjek for tidsmæssigt overlap mellem bookinger (erstattes af checkForDateRangeOverlap)
  checkForTimeOverlap(machineId, date, startTime, endTime) {
    return this.checkForDateRangeOverlap(
      machineId,
      date,
      date,
      startTime,
      endTime
    );
  }

  // Vis detaljer om en eksisterende booking
  showBookingDetails(machineId, bookingId) {
    const machine = this.machines.find((m) => m.id === machineId);
    if (!machine) return;

    const booking = machine.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // Find projekttitel hvis der er tilknyttet et projekt
    let projectInfo = "";
    if (booking.projectId) {
      const project = this.projects.find((p) => p.id === booking.projectId);
      if (project) {
        projectInfo = `\nProjekt: ${project.title}`;
      }
    }

    // Vis dialog med booking detaljer
    const descriptionInfo = booking.description
      ? `\nBeskrivelse: ${booking.description}`
      : "";

    const isMultiDay = booking.startDate !== booking.endDate;
    const dateInfo = isMultiDay
      ? `${this.formatDateForDisplay(
          new Date(booking.startDate)
        )} - ${this.formatDateForDisplay(new Date(booking.endDate))}`
      : this.formatDateForDisplay(new Date(booking.startDate));
    const daysInfo = isMultiDay
      ? `\nAntal dage: ${this.calculateDays(
          booking.startDate,
          booking.endDate
        )}`
      : "";

    const confirmDelete = confirm(`
      Maskinbooking detaljer:
      
      Maskine: ${machine.name}
      Dato: ${dateInfo}${daysInfo}
      Tid: ${booking.startTime} - ${booking.endTime}${projectInfo}${descriptionInfo}
      
      Vil du slette denne booking?
    `);

    if (confirmDelete) {
      this.deleteBooking(machineId, bookingId);
    }
  }

  // Slet booking
  deleteBooking(machineId, bookingId) {
    const machine = this.machines.find((m) => m.id === machineId);
    if (!machine) return;

    machine.bookings = machine.bookings.filter((b) => b.id !== bookingId);
    this.render();
  }

  // Tilføj booking fra det eksterne API
  addBooking(
    machineId,
    startDate,
    endDate,
    startTime = "8:00",
    endTime = "16:00",
    projectId = null,
    description = ""
  ) {
    const machine = this.machines.find((m) => m.id === machineId);
    if (!machine) return;

    // Find projekttitlen hvis der er angivet et projektID
    let projectTitle = "";
    if (projectId) {
      const project = this.projects.find((p) => p.id === projectId);
      if (project) {
        projectTitle = project.title;
      }
    }

    this.bookings.push({
      machineId,
      id: machine.bookings.length + 1,
      machineName: machine.name,
      projectId,
      projectTitle,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
    });

    this.render();
  }

  // Fjern booking fra kalenderen
  removeBooking(machineId, bookingId) {
    this.bookings = this.bookings.filter(
      (booking) =>
        !(booking.machineId === machineId && booking.id === bookingId)
    );
    this.render();
  }

  // Hjælpefunktioner til datoformatering
  formatDateForData(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  formatDateForDisplay(date) {
    return date.toLocaleDateString("da-DK", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  // Beregn antal dage mellem to datoer (inklusive)
  calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 for at inkludere både start- og slutdato
  }

  // Formater dato til kort visning (D/M)
  formatShortDate(date) {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }
}

// Eksportér kalenderklassen til brug i app.js
// export { BookingCalendar };
