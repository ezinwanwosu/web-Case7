from flask import Flask, request, jsonify
import stripe
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import sys

logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler(sys.stdout)])

logging.info("hello world")

app = Flask(__name__)

# Stripe config
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

# Email config (Brevo SMTP)
EMAIL_ADDRESS = os.getenv('EMAIL_ADDRESS')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')

# Simple in-memory storage (use a DB like Redis or SQLite for production)
booking_cache = {}

@app.route('/')
def home():
    return "<h1>Booking Confirmation is sent if the payment was successful.</p>"

@app.route('/store-booking', methods=['POST'])
def store_booking():
    data = request.get_json()
    appointment_date = data.get('appointment_date')
    # Save the appointment info using email as key
    booking_cache['2'] = appointment_date
    logging.info(f"Stored booking: {appointment_date}")
    return jsonify({'status': 'stored'}), 200

@app.route('/webhook', methods=['POST'])
def stripe_webhook():
    logging.info("webhook hit")
    payload = request.get_data(as_text=True)
    logging.info(f"payload: {payload}")
    sig_header = request.headers.get('stripe-signature')
    logging.info("📨 Webhook triggered!")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        logging.info(f"✅ Stripe Event: {event['type']}")
    except Exception as e:
        logging.info(f"❌ Webhook error: {e}")
        return jsonify({'error': str(e)}), 400

    if event['type'] == 'checkout.session.completed':
        logging.info("💸 Payment confirmed!")
        session_obj = event['data']['object']
        customer_email = session_obj.get('customer_email') or session_obj.get('customer_details', {}).get('email')

        logging.info(f"📧 Customer email: {customer_email}")

        appointment_date = booking_cache.get('2', "Unknown Date")
        logging.info(f"📅 Appointment: {appointment_date}")

        if customer_email:
            send_confirmation_email(customer_email, appointment_date)
        else:
            send_confirmation_email("yoncesacrylics@gmail.com", appointment_date)

    return jsonify({'status': 'success'}), 200

def send_confirmation_email(to_email, appointment_date):
    cc_email = "yoncesacrylics@gmail.com"
    subject = "Appointment Confirmation for Yonce's Acrylics"
    body = f"""
    <p>Thank you for your payment!</p>
    <p>Your appointment is confirmed for <strong>{appointment_date}</strong>.</p>
    """

    msg = MIMEMultipart()
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = to_email
    msg['Cc'] = cc_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    recipients = [to_email] + [cc_email]

    try:
        with smtplib.SMTP('smtp-relay.brevo.com', 587) as server:
            server.ehlo()
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, recipients, msg.as_string())

        logging.info(f"✅ Confirmation email sent to {to_email}")
    except Exception as e:
        logging.info(f"Failed to send email: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)

