from flask import Flask, request, jsonify
import stripe
import os
import logging
import sys
from flask_cors import CORS
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from pprint import pprint

# Setup logging
logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler(sys.stdout)])

# Flask setup
app = Flask(__name__)
CORS(app)

# Stripe keys from Render env vars
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

# Brevo config from Render env vars
BREVO_API_KEY = os.getenv('BREVO_API_KEY')
SENDER_EMAIL = os.getenv('EMAIL_ADDRESS') or "yoncesacrylics@gmail.com"  # Must be verified in Brevo
SENDER_NAME = "Yonce's Acrylics"

# In-memory storage (you could switch to a database later)
booking_cache = {}

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'POST,GET,OPTIONS'
    return response

@app.route('/')
def home():
    return "<h1>Webhook + Email Confirmation Backend</h1>"

@app.route('/store-booking', methods=['POST'])
def store_booking():
    data = request.get_json()
    appointment_date = data.get('appointment_date')
    booking_cache['2'] = appointment_date
    logging.info(f"📦 Stored booking: {appointment_date}")
    return jsonify({'status': 'stored'}), 200

@app.route('/webhook', methods=['POST'])
def stripe_webhook():
    logging.info("📨 Webhook triggered!")
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        logging.info(f"✅ Stripe Event: {event['type']}")
    except Exception as e:
        logging.error(f"❌ Webhook signature error: {e}")
        return jsonify({'error': str(e)}), 400

    if event['type'] == 'checkout.session.completed':
        logging.info("💸 Payment confirmed!")
        session_obj = event['data']['object']
        customer_email = session_obj.get('customer_email') or session_obj.get('customer_details', {}).get('email')

        logging.info(f"📧 Customer email: {customer_email}")
        appointment_date = booking_cache.get('2', "Unknown Date")
        logging.info(f"📅 Appointment: {appointment_date}")

        send_confirmation_email(customer_email or "yoncesacrylics@gmail.com", appointment_date)

    return jsonify({'status': 'success'}), 200

def send_confirmation_email(to_email, appointment_date):
    # Configure Brevo API client
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY
    logging.info(f"API key {BREVO_API_KEY}")
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    email_content = f"""
    <html>
    <body>
        <p>Thank you for your payment!</p>
        <p>Your appointment is confirmed for <strong>{appointment_date}</strong>.</p>
    </body>
    </html>
    """
    logging.info(SENDER_EMAIL)
    email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to_email}],
        cc=[{"email": "yoncesacrylics@gmail.com"}],
        subject="Appointment Confirmation for Yonce's Acrylics",
        html_content=email_content,
        sender={"name": SENDER_NAME, "email": SENDER_EMAIL}
    )

    try:
        response = api_instance.send_transac_email(email)
        logging.info(f"✅ Email sent to {to_email}")
        pprint(response)
    except ApiException as e:
        logging.error(f"❌ Failed to send email: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
