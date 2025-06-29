from flask import Flask, request, jsonify, session, redirect, url_for, render_template_string
import stripe
import os
import sendgrid
from sendgrid.helpers.mail import Mail

app = Flask(__name__)
app.secret_key = 'your-very-secret-key'  # for sessions

# Set your Stripe secret key and webhook secret here
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')  # e.g. "sk_test_..."
endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')

# Replace this with your real front-end URL
YOUR_FRONTEND_URL = "templates/success.html"

# === Create checkout session ===
@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = request.json
    email = data.get('email')
    appointment_date = data.get('appointment_date')

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': 'price_xyz',  # Replace with your actual price ID
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

# === Stripe webhook for payment success ===
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

        # Mark session as paid - here, store info in memory or DB (simple example: save in-memory)
        # For demo, store in Flask session (not for prod)
        session['paid'] = True

    return jsonify({'status': 'success'}), 200

def send_confirmation_email(to_email, appointment_date):
    sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
    message = Mail(
        from_email='your-email@domain.com',
        to_emails=to_email,
        subject='Appointment Confirmation',
        html_content=f"<p>Thank you for your booking! Your appointment is scheduled for <b>{appointment_date}</b>.</p>"
    )
    try:
        sg.send(message)
    except Exception as e:
        print(f"Email sending failed: {e}")

# === Success page only accessible if paid ===
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
