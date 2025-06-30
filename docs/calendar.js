document.addEventListener('DOMContentLoaded', async function () {
  const calendarEl = document.getElementById('calendar');
  const slotList = document.getElementById('slot-list');
  const selectedDateEl = document.getElementById('selected-date');
  const timeSlotBox = document.getElementById('timeslots');

  let bookableDays = {}; // Will be filled by backend
  // 🔁 Fetch availability data from backend
  async function loadAvailability() {
  try {
    const res = await fetch('https://private2-uzol.onrender.com/api/availability', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer von-UDBNdsjf-4nfd!f9'
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Fetch error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    console.log('Availability data received:', data);

    // Group slots by date
    const grouped = {};
    data.forEach(item => {
      // Defensive: make sure item.start exists and is a string
      if (item.start && typeof item.start === 'string') {
        const date = item.start.split("T")[0];
        const time = new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(time);
      } else {
        console.warn('Invalid item.start:', item.start);
      }
    });

    // Assign to shared/global variable so other functions can use it
    bookableDays = grouped;

    // Instead of recreating the calendar, ideally update events on existing calendar
    loadCalendar();

  } catch (err) {
    console.error('Error loading availability:', err);
  }
}

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
              console.log(dateStr);
              console.log(slot);
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

    // On page load, restore tick mark if date was already selected
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

  // 🚀 Fetch data and kick off rendering
  await loadAvailability();
});
