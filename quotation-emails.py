import csv
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()  # Loads .env file into os.environ

# --- CONFIGURATION ---
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
APP_PASSWORD = os.getenv("APP_PASSWORD")  # Paste the 16-char App Password here (keep spaces or remove them, both work)

# Email Content
subject = "Inquiry regarding Makhana Roasting and Seasoning Machine"
body_template = """
Dear {name},

I am interested in purchasing a Makhana roasting and seasoning machine. 
Could you please share your product catalog and a price quotation?

Best regards,
Prateek Talesara
+91 - 9972687120
Mast Makhana
"""

# --- SENDING LOGIC ---
context = ssl.create_default_context()

try:
    # Connect to Gmail Server
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(SENDER_EMAIL, APP_PASSWORD)

        # Read vendors from CSV file
        with open("vendors.csv", "r") as file:
            reader = csv.DictReader(file)

            for row in reader:
                vendor_name = row["name"]
                vendor_email = row["email"]

                # Create the email
                msg = MIMEMultipart()
                msg["From"] = SENDER_EMAIL
                msg["To"] = vendor_email
                msg["Subject"] = subject

                # Customize body
                body = body_template.format(name=vendor_name)
                msg.attach(MIMEText(body, "plain"))

                # Send
                server.sendmail(SENDER_EMAIL, vendor_email, msg.as_string())
                print(f"Email sent to {vendor_name} ({vendor_email})")

    print("All emails sent successfully.")

except Exception as e:
    print(f"Error: {e}")