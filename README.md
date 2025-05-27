Bitespeed Identity Reconciliation API

A backend service that consolidates user identities across multiple contact entries using phone number and email address.

🔧 Stack
Node.js
Express.js
PostgreSQL (via Prisma ORM)
Render (for deployment)
Thunder Client / Postman (for API testing)

🧠 Problem Statement
You are given multiple user contact records with overlapping identifiers (email or phone number).
The goal is to reconcile identities into a single primary contact and link all related ones as secondary contacts.

📍 API Endpoint
POST /identify
Request Body:

json
Copy code
{
  "email": "doc@flux.com",
  "phoneNumber": "1234567890"
}
Response Body:

json
Copy code
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["doc@flux.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": []
  }
}
🌐 Hosted API Endpoint
📌 POST https://bitespeed-identity-fjhh.onrender.com/identify
