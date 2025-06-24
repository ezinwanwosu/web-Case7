document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  const slotList = document.getElementById('slot-list');
  const selectedDateEl = document.getElementById('selected-date');
  const timeSlotBox = document.getElementById('timeslots');

  const bookableDays = {
    "2025-07-01": ["10:00 AM", "11:30 AM", "2:00 PM"],
    "2025-07-03": ["12:00 PM", "3:00 PM", "5:00 PM"],
    "2025-07-05": ["9:00 AM", "1:00 PM"]
    // Fetch from backend in future
  };

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    selectable: true,
    showNonCurrentDates: false,
    dateClick: function (info) {
      const dateStr = info.dateStr;

      if (bookableDays[dateStr]) {
        selectedDateEl.textContent = dateStr;
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
                markDateWithTick(dateStr)

    // You can also optionally redirect to checkout page here or update UI
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
      display: 'background',  // Important! This makes the event a background highlight
      backgroundColor: '#FFA4EE;', // pink background for entire cell
    })),
    eventDidMount: function(info) {
      // Optional: style
    }
  });

  calendar.render();

  function markDateWithTick(dateStr) {
    // Delay ensures calendar DOM is fully updated
    setTimeout(() => {
      // Remove any existing tick marks
      document.querySelectorAll('.fc-daygrid-day .tick-mark').forEach(t => t.remove());

      const dayCell = calendarEl.querySelector(`[data-date="${dateStr}"]`);
      if (dayCell) {
        const tick = document.createElement('div');
        tick.classList.add('tick-mark');
        tick.textContent = '✓';
        tick.style.position = 'absolute';
        tick.style.top = '15px';
        tick.style.right = '15px';
        tick.style.fontSize = '1.5rem';
        tick.style.color = 'white';
        dayCell.style.position = 'relative';
        dayCell.appendChild(tick);
      }
    }, 10);
    timeSlotBox.style.display = 'none';
  }

  // On page load, restore tick mark if date was already selected
  const savedDate = localStorage.getItem('selectedDate');
  if (savedDate) {
    markDateWithTick(savedDate);
    selectedDateEl.textContent = `Selected Date: ${savedDate}`;
    timeSlotBox.style.display = 'none';
    
  }
  calendar.render();
});
console.log(window.calendar);
