from flask import Flask, request, jsonify, session, redirect, url_for, render_template_string
import stripe
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = 'your-very-secret-key'

# Stripe setup
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

# Email credentials (Brevo SMTP)
EMAIL_ADDRESS = os.getenv('EMAIL_ADDRESS')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')

# === Replace this with your success HTML path or URL ===
YOUR_FRONTEND_URL = "https://yourdomain.com/success"

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = request.json
    email = data.get('email')
    appointment_date = data.get('appointment_date')

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': 'price_xyz',  # Replace with your actual Stripe price ID
                'quantity': 1,
            }],
            mode='payment',
            customer_email=email,
            success_url=url_for('success', _external=True),
            cancel_url=YOUR_FRONTEND_URL + '/cancel',
            metadata={
                'appointment_date': appointment_date
            }
        )
        return jsonify({'id': checkout_session.id})
    except Exception as e:
        return jsonify(error=str(e)), 400

@app.route('/webhook', methods=['POST'])
def webhook():
    payload = request.data
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except Exception as e:
        return str(e), 400

    if event['type'] == 'checkout.session.completed':
        session_obj = event['data']['object']
        customer_email = session_obj.get('customer_email')
        appointment_date = session_obj['metadata'].get('appointment_date')

        # Send confirmation email
        send_confirmation_email(customer_email, appointment_date)

        # Mark session as paid (for demo)
        session['paid'] = True

    return jsonify({'status': 'success'}), 200

def send_confirmation_email(to_email, appointment_date):
    subject = "Appointment Confirmation"
    body = f"""
    <p>Thank you for your booking!</p>
    <p>Your appointment is scheduled for <strong>{appointment_date}</strong>.</p>
    """

    msg = MIMEMultipart()
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        # Brevo (Sendinblue) SMTP
        with smtplib.SMTP_SSL('smtp-relay.sendinblue.com', 465) as server:
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())
        print("✅ Email sent.")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

@app.route('/success')
def success():
    if session.get('paid'):
        return render_template_string("""
            <h1>Payment Successful!</h1>
            <p>Thank you for your payment. Your appointment is confirmed.</p>
        """)
    else:
        return redirect(url_for('unauthorized'))

@app.route('/unauthorized')
def unauthorized():
    return "<h1>Unauthorized</h1><p>You cannot access this page directly without payment.</p>", 403

if __name__ == '__main__':
    app.run(debug=True)
