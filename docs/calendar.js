document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  const slotList = document.getElementById('slot-list');
  const selectedDateEl = document.getElementById('selected-date');
  const timeSlotBox = document.getElementById('timeslots');

  // 📅 Static availability (replace with your actual data)
const bookableDays = {
  "2025-08-02": ["09:00", "10:00", "12:00", "16:00", "18:00"], // Saturday
  "2025-08-07": ["09:00", "10:00", "12:00", "16:00", "18:00"], // Thursday
  "2025-08-09": ["09:00", "10:00", "12:00", "16:00", "18:00"], // Saturday
  "2025-08-14": ["09:00", "10:00", "12:00", "16:00", "18:00"], // Thursday
  "2025-08-15": ["09:00", "10:00", "12:00", "16:00", "18:00"], // Friday
  "2025-08-16": ["09:00", "10:00", "12:00", "16:00", "18:00"], // Saturday
  "2025-08-21": ["09:00", "10:00", "12:00", "16:00", "18:00"], // Thursday
  "2025-08-22": ["09:00", "10:00", "12:00", "16:00", "18:00"], // Friday
  "2025-08-23": ["09:00", "10:00", "12:00", "16:00", "18:00"], // Saturday
  "2025-08-28": ["09:00", "10:00", "12:00", "16:00", "18:00"], // Thursday
  "2025-08-29": ["09:00", "10:00", "12:00", "16:00", "18:00"], // Friday
  "2025-08-30": ["09:00", "10:00", "12:00", "16:00", "18:00"]  // Saturday
};


  loadCalendar();

  function loadCalendar() {
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      selectable: true,
      showNonCurrentDates: false,
      dateClick: function (info) {
        const dateStr = info.dateStr;

        if (bookableDays[dateStr]) {
          selectedDateEl.textContent = `Selected Date: ${dateStr}`;
          timeSlotBox.style.display = 'block';
          slotList.innerHTML = '';
          bookableDays[dateStr].forEach(slot => {
            const li = document.createElement('li');
            li.textContent = slot;
            li.classList.add('timeslot');
            li.addEventListener('click', () => {
              localStorage.setItem('selectedDate', dateStr);
              localStorage.setItem('selectedTime', slot);
              markDateWithTick(dateStr);
            });
            slotList.appendChild(li);
          });
        } else {
          timeSlotBox.style.display = 'none';
        }
      },
      events: Object.keys(bookableDays).map(date => ({
        title: '',
        start: date,
        display: 'background',
        backgroundColor: '#FFA4EE'
      }))
    });

    calendar.render();

    // Restore previously selected date from localStorage
    const savedDate = localStorage.getItem('selectedDate');
    calendar.on('datesSet', function () {
      if (savedDate) {
        markDateWithTick(savedDate);
        selectedDateEl.textContent = `Selected Date: ${savedDate}`;
        timeSlotBox.style.display = 'none';
      }
    });
  }

  function markDateWithTick(dateStr) {
    setTimeout(() => {
      document.querySelectorAll('.fc-daygrid-day .tick-mark').forEach(t => t.remove());
      const dayCell = calendarEl.querySelector(`[data-date="${dateStr}"]`);
      if (dayCell) {
        const tick = document.createElement('div');
        tick.classList.add('tick-mark');
        tick.textContent = '✓';
        tick.style.position = 'absolute';
        tick.style.top = '15px';
        tick.style.right = '15px';
        tick.style.fontSize = '2.5rem';
        tick.style.color = 'white';
        dayCell.style.position = 'relative';
        dayCell.appendChild(tick);
      }
    }, 10);
    timeSlotBox.style.display = 'none';
  }
});
