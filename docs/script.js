const cartItemsKey = 'yonceCartItems';

let cartItems = [];
let selectedServiceName = '';
let selectedServiceTime = '';
let selectedServicePrice = '';

const cartCountElement = document.getElementById('cart-count');

document.addEventListener('DOMContentLoaded', () => {
  cartItems = loadCartItems();
  updateCartCount();

  document.getElementById('confirm-add').addEventListener('click', confirmAddToCart);
  document.getElementById('cancel-add').addEventListener('click', closePopup);

  setupCarousels();
});

function loadCartItems() {
  const itemsJSON = localStorage.getItem(cartItemsKey);
  return itemsJSON ? JSON.parse(itemsJSON) : [];
}

function saveCartItems(items) {
  localStorage.setItem(cartItemsKey, JSON.stringify(items));
}

function updateCartCount() {
  cartCountElement.textContent = cartItems.length;
}

function showPopup() {
  document.getElementById('cart-popup').style.display = 'block';
  document.getElementById('popup-overlay').style.display = 'block';
}

function closePopup() {
  document.getElementById('cart-popup').style.display = 'none';
  document.getElementById('popup-overlay').style.display = 'none';
}

function confirmAddToCart() {
  addToCart(selectedServiceName, selectedServiceTime, selectedServicePrice);
  closePopup();
}

function addToCart(serviceName, serviceTime, servicePrice) {
  cartItems.push({ name: serviceName, time: serviceTime, price: servicePrice });
  saveCartItems(cartItems);
  updateCartCount();

  cartCountElement.classList.add('animate');
  setTimeout(() => cartCountElement.classList.remove('animate'), 300);

  console.log(`Added "${serviceName}" (${serviceTime}, £${servicePrice}) to cart.`);
}

function setupCarousels() {
  document.querySelectorAll('.carousel-container').forEach(container => {
    const nextBtn = container.querySelector('.next');
    const prevBtn = container.querySelector('.prev');
    const cards = container.querySelectorAll('.service');
    const len = cards.length;
    let active = 0;

    function loadShow() {
      cards.forEach(card => {
        card.style.transition = '0.5s';
        card.style.transform = '';
        card.style.zIndex = '';
        card.style.filter = '';
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
      });

      const current = cards[active];
      current.style.transform = `none`;
      current.style.zIndex = 2;
      current.style.opacity = 1;
      current.style.filter = `none`;
      current.style.pointerEvents = `auto`;

      const nextIndex = (active + 1) % len;
      const nextCard = cards[nextIndex];
      nextCard.style.transform = `translateX(120px) scale(0.8) perspective(16px) rotateY(-1deg)`;
      nextCard.style.zIndex = 1;
      nextCard.style.opacity = 0.6;
      nextCard.style.filter = `blur(2px)`;

      const prevIndex = (active - 1 + len) % len;
      const prevCard = cards[prevIndex];
      prevCard.style.transform = `translateX(-120px) scale(0.8) perspective(16px) rotateY(1deg)`;
      prevCard.style.zIndex = 1;
      prevCard.style.opacity = 0.6;
      prevCard.style.filter = `blur(2px)`;
    }

    nextBtn.addEventListener('click', () => {
      active = (active + 1) % len;
      loadShow();
    });

    prevBtn.addEventListener('click', () => {
      active = (active - 1 + len) % len;
      loadShow();
    });

    // Add click listeners to each card
    cards.forEach(card => {
      card.addEventListener('click', () => {
        selectedServiceName = card.dataset.name;
        selectedServiceTime = card.dataset.time || 'N/A';
        selectedServicePrice = card.dataset.price || '0';
        if (selectedServiceName) {
          showPopup();
        }
      });
    });

    // Swipe/drag support
    let isDragging = false;
    let startX = 0;
    let dragMoved = false;

    function handleSwipe(deltaX) {
      const threshold = 50;
      if (deltaX > threshold) {
        active = (active - 1 + len) % len;
        loadShow();
      } else if (deltaX < -threshold) {
        active = (active + 1) % len;
        loadShow();
      }
    }

    container.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.clientX;
      dragMoved = false;
      container.classList.add('noselect');
    });

    container.addEventListener('mousemove', e => {
      if (isDragging && Math.abs(e.clientX - startX) > 5) {
        dragMoved = true;
      }
    });

    container.addEventListener('mouseup', e => {
      if (!isDragging) return;
      isDragging = false;
      container.classList.remove('noselect');

      if (dragMoved) {
        handleSwipe(e.clientX - startX);
      } else {
        const clickedCard = e.target.closest('.service');
        if (clickedCard) {
          selectedServiceName = clickedCard.dataset.name;
          selectedServiceTime = clickedCard.dataset.time || 'N/A';
          selectedServicePrice = clickedCard.dataset.price || '0';
          if (selectedServiceName) {
            showPopup();
          }
        }
      }
    });

    container.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false;
        container.classList.remove('noselect');
      }
    });

    // Touch support
    let touchStartX = 0;
    container.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    });

    container.addEventListener('touchend', e => {
      const touchEndX = e.changedTouches[0].clientX;
      handleSwipe(touchEndX - touchStartX);
    });

    loadShow();
  });
}
