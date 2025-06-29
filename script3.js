emailjs.init("YOUR_PUBLIC_KEY");
emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
    to_email: clientEmail,
    appointment_date: localStorage.getItem('selectedDate'),
    appointment_time: localStorage.getItem('selectedTime'),
  }).then(() => {
    alert('Confirmation email sent! Thank you for your booking.');});

