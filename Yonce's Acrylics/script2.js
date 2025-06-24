const cartList = document.getElementById('cart-list');
const emptyMsg = document.getElementById('empty-msg');
const checkoutBtn = document.getElementById('checkout-btn');
const appointmentDateEl = document.getElementById('appointment-date');
const totalTimeEl = document.getElementById('total-time');

const cartItemsKey = 'yonceCartItems';
const selectedDateKey = 'selectedDate';

// Load from localStorage
function loadCartItems() {
  const items = localStorage.getItem(cartItemsKey);
  return items ? JSON.parse(items) : [];
}

function saveCartItems(items) {
  localStorage.setItem(cartItemsKey, JSON.stringify(items));
}

function loadSelectedDate() {
  return localStorage.getItem(selectedDateKey) || '';
}

// Display appointment date
function renderAppointmentDate() {
  const date = loadSelectedDate();
  if (date) {
    appointmentDateEl.textContent = `Appointment Date: ${date}`;
    appointmentDateEl.style.display = 'block';
  } else {
    appointmentDateEl.style.display = 'none';
  }
}

// Parse time like "1h 30m" into minutes
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const hourMatch = timeStr.match(/(\d+)h/);
  const minuteMatch = timeStr.match(/(\d+)\s*m/);
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  return hours * 60 + minutes;
}

// Format minutes into readable time
function formatMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm' : ''}`.trim();
}

// Display total appointment time
function renderTotalTime() {
  const cartItems = loadCartItems();
  const totalMinutes = cartItems.reduce((sum, service) => {
    if (typeof service === 'object' && service.time) {
      return sum + parseTimeToMinutes(service.time);
    }
    return sum;
  }, 0);

  if (totalMinutes > 0) {
    totalTimeEl.textContent = `Total Time: ${formatMinutes(totalMinutes)}`;
    totalTimeEl.style.display = 'block';
  } else {
    totalTimeEl.style.display = 'none';
  }
}

// Render cart UI
function renderCart() {
  const cartItems = loadCartItems();
  cartList.innerHTML = '';

  if (cartItems.length === 0) {
    emptyMsg.style.display = 'block';
    checkoutBtn.disabled = true;
  } else {
    emptyMsg.style.display = 'none';
    checkoutBtn.disabled = false;

    cartItems.forEach((service, index) => {
      const li = document.createElement('li');
      if (typeof service === 'string') {
        li.textContent = service;
      } else if (service.name) {
        li.textContent = `${service.name} (${service.time || 'N/A'})`;
      } else {
        li.textContent = JSON.stringify(service);
      }

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.classList.add('remove-btn');
      removeBtn.addEventListener('click', () => {
        removeFromCart(index);
      });

      li.appendChild(removeBtn);
      cartList.appendChild(li);
    });
  }

  renderTotalTime();
}

// Remove service from cart
function removeFromCart(index) {
  const cartItems = loadCartItems();
  cartItems.splice(index, 1);
  saveCartItems(cartItems);
  renderCart();
}

// Checkout handler
checkoutBtn.addEventListener('click', () => {
  alert('Thank you! You will be redirected to the deposit payment process.');
  localStorage.removeItem(cartItemsKey);       // Clear cart
  localStorage.removeItem(selectedDateKey);    // Clear date
  renderCart();
  renderAppointmentDate();
  renderTotalTime();
});

// Initial render
renderCart();
renderAppointmentDate();
