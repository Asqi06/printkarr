
# Printkarr All-in-One Web App PRD

Below is a **build-ready PRD** for a single Printkarr web app with three role-based experiences:

1. **Customer**
2. **Rider**
3. **Printer/Admin (you)**

The first version should use **demo logins**, mock data, and simulated workflows so the complete product can be tested before connecting real WhatsApp, payments, printers, maps, or databases. Because apparently even printing needs a control tower now.

---

# 1. Product Overview

### Product Name

**Printkarr**

### Product Type

Hyperlocal print + stationery ordering and delivery platform.

### Core Promise

> **Upload your document. Choose how you want it printed. We print it and deliver it to you.**

### Initial Target

* Students
* Colleges
* Hostels
* PGs
* Schools
* Offices/workplaces
* Nearby residents

### Initial Service Area

* Vapi
* Sarigam
* Bhilad

### Core Pricing

| Service               |   Demo Price |
| --------------------- | -----------: |
| B&W                   |      ₹2/page |
| Color                 |      ₹5/page |
| Delivery              | Starting ₹15 |
| Special student B&W   |   ₹1.75/page |
| Special student Color |      ₹4/page |

The pricing should be configurable from Admin rather than hardcoded.

---

# 2. Roles

The app has three primary roles.

```text
                    PRINTKARR
                        │
          ┌─────────────┼─────────────┐
          │             │             │
      CUSTOMER        RIDER        ADMIN/PRINTER
          │             │             │
       Orders        Delivery       Operations
       Wallet        Earnings        Printing
       Tracking      Tasks           Riders
       Profile       Status          Customers
```

---

# 3. Demo Login System

The very first screen should be a **role-selection/login page**.

## Login screen

```text
        PRINTKARR

   Print. Deliver. Done.

 ┌──────────────────────────────┐
 │       Choose your role       │
 │                              │
 │  👤 Customer                 │
 │  🛵 Rider                    │
 │  🖨️ Printer / Admin          │
 │                              │
 └──────────────────────────────┘
```

Then show demo accounts.

### Demo Customer

```text
Email:
customer@demo.printkarr.in

Password:
customer123
```

### Demo Rider

```text
Email:
rider@demo.printkarr.in

Password:
rider123
```

### Demo Admin/Printer

```text
Email:
admin@demo.printkarr.in

Password:
admin123
```

The login should be **fully functional**, but initially authenticate against demo/mock data.

### Important

The UI should clearly display:

> **Demo Mode**

No real payments, printer jobs or deliveries should occur.

---

# 4. Global Application Structure

Use a shared application shell.

### Desktop

```text
┌─────────────────────────────────────────────┐
│ PRINTKARR                    Notifications │
├──────────────┬──────────────────────────────┤
│ Sidebar      │                              │
│              │        Main Content          │
│ Dashboard    │                              │
│ Orders       │                              │
│ Messages     │                              │
│ Wallet       │                              │
│ Profile      │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

### Mobile

Bottom navigation:

```text
Home | Orders | + Order | Wallet | Profile
```

Rider and Admin get role-specific navigation.

---

# 5. CUSTOMER APP

## Customer Dashboard

The customer should immediately see:

### Header

> Good afternoon, Ani

### Main CTA

**+ New Print Order**

Large, obvious button.

### Current order

```text
ORDER #PK1024

Printing
████████░░ 80%

Estimated delivery
Today, 6:30 PM
```

### Quick actions

* New Order
* Order History
* Wallet
* Saved Addresses
* Help

### Promotional banner

Example:

> **Student Special**
>
> B&W prints from ₹1.75/page

---

# 6. Customer: Create Order

This is the most important flow.

## Step 1: Upload document

```text
Create New Order

Upload your document

┌─────────────────────────┐
│       ↑                 │
│   Upload PDF            │
│                         │
│ PDF up to 50 MB         │
└─────────────────────────┘
```

Support initially:

* PDF

Later:

* DOCX
* JPG
* PNG
* PPTX

Show uploaded file:

```text
📄 assignment.pdf
24 pages
```

---

# 7. Document Preview

After upload:

```text
assignment.pdf

Pages: 24

[Preview]

Page thumbnails
1  2  3  4  5 ...
```

Allow:

* Preview
* Page count
* Optional page range

Example:

> Print pages: `1-12, 15-20`

---

# 8. Printing Options

## Color

```text
Print Type

○ Black & White
○ Color
```

## Sides

```text
Printing

○ Single-sided
○ Double-sided
```

## Copies

```text
Copies

[ − ]  1  [ + ]
```

## Paper

Initially:

```text
A4
```

Later:

* A3
* Photo
* Glossy
* Colored paper

---

# 9. Additional Options

Optional:

### Orientation

* Portrait
* Landscape
* Auto

### Binding

* None
* Staple
* Spiral binding

### Notes

Example:

> “Please staple after page 10.”

These can be disabled in the initial demo if necessary.

---

# 10. Delivery Address

Customer can:

### Use current address

or select:

* Home
* Hostel
* College
* PG
* Office

### Address form

```text
Name
Phone
Address
Area
Landmark
PIN
```

Allow saved addresses.

---

# 11. Delivery Time

Options:

```text
Delivery

○ ASAP
○ Today
○ Schedule
```

For demo:

```text
Today

5:00 PM
5:30 PM
6:00 PM
6:30 PM
7:00 PM
```

Later this should become dynamic based on actual printer/rider capacity.

---

# 12. Order Summary

Before confirmation:

```text
ORDER SUMMARY

assignment.pdf
24 pages × 1

B&W
Double-sided

Printing              ₹48
Delivery              ₹15
────────────────────────
Total                  ₹63

[ Confirm Order ]
```

If special student pricing applies:

```text
Student discount
-₹6
```

---

# 13. Payment

Demo version should provide:

```text
Payment Method

○ UPI
○ Wallet
○ Cash on Delivery
```

For demo:

**Simulate Payment**

Button:

> Pay ₹63

Then:

> Payment Successful

Real UPI/payment integration comes later.

---

# 14. Order Tracking

This should feel like delivery tracking.

```text
ORDER #PK1024

✓ Order received
✓ Payment confirmed
✓ Printing
○ Quality check
○ Rider assigned
○ Out for delivery
○ Delivered
```

Timeline with timestamps.

---

# 15. Customer Orders

Tabs:

* Active
* Completed
* Cancelled

Each order card:

```text
#PK1024

assignment.pdf
24 pages
B&W
₹63

Printing

[View Details]
```

---

# 16. Reorder

Completed orders should have:

> **Reorder**

This should recreate the previous order settings.

Extremely useful for students printing the same notes repeatedly.

---

# 17. Customer Wallet

Dashboard:

```text
PRINTKARR WALLET

₹240

[ + Add Money ]

Recent transactions

+ ₹500     Added
- ₹63      Order #PK1024
- ₹35      Order #PK1019
```

Later support:

* Wallet bonuses
* Referral credits
* Semester plans
* Refunds
* Promotional credits

---

# 18. Customer Profile

Include:

* Name
* Phone
* Email
* Profile picture
* Saved addresses
* Default address
* Order history
* Wallet
* Notifications
* Help

---

# 19. Customer Notifications

Examples:

> Your order #PK1024 has started printing.

> Your order is ready for pickup.

> Rider Rahul has picked up your order.

> Your order is out for delivery.

> Your order has been delivered.

---

# 20. RIDER APP

Rider login leads to a completely different dashboard.

## Rider Dashboard

```text
GOOD AFTERNOON, RAHUL

Today's deliveries

8
Completed

3
Pending

₹420
Today's earnings
```

Main card:

```text
NEXT DELIVERY

Order #PK1024

Customer:
Ani

Location:
Laxmi Institute Hostel

Status:
READY FOR PICKUP

[ Navigate ]
[ Pickup Order ]
```

---

# 21. Rider Orders

Tabs:

* Assigned
* Active
* Completed

Order:

```text
#PK1024

Pickup:
Printkarr Hub

Drop:
LIT Hostel

Customer:
Ani

Amount:
₹63

[View]
```

---

# 22. Rider Delivery Workflow

Rider statuses:

```text
ASSIGNED
   ↓
ACCEPTED
   ↓
AT PICKUP
   ↓
PICKED UP
   ↓
OUT FOR DELIVERY
   ↓
ARRIVED
   ↓
DELIVERED
```

Each status should be triggered by a button.

Example:

> **Mark as Picked Up**

Then:

> **Start Delivery**

Then:

> **Mark Delivered**

---

# 23. Navigation

For demo, clicking:

> **Navigate**

can open a simulated map screen.

Later integrate:

* Google Maps
* Mapbox
* OpenStreetMap

The rider should see:

* Pickup
* Destination
* Distance
* Estimated time
* Customer contact

---

# 24. Delivery Proof

When delivered:

```text
Confirm Delivery

○ Customer received
○ Delivered to security/reception

Optional:
[Upload photo]

[ Confirm Delivery ]
```

Later:

* OTP verification
* Signature
* Photo proof

---

# 25. Rider Earnings

```text
MY EARNINGS

Today
₹420

This week
₹2,840

Completed deliveries
38
```

Breakdown:

```text
Delivery #PK1024      ₹15
Delivery #PK1021      ₹20
Delivery #PK1019      ₹15
```

---

# 26. PRINTER / ADMIN APP

This is your command centre.

The Admin dashboard should be considerably more powerful.

## Admin Dashboard

```text
PRINTKARR CONTROL CENTER

Today's Orders        27
Printing              6
Ready                 4
Out for Delivery      5
Delivered             12

Revenue               ₹2,480

Pages Printed         1,240
```

---

# 27. Admin Order Queue

This is one of the most important screens.

### Columns

| Order  | Customer | Pages | Type  | Status   | Rider | Total |
| ------ | -------- | ----: | ----- | -------- | ----- | ----: |
| PK1024 | Ani      |    24 | B&W   | Printing | Rahul |   ₹63 |
| PK1025 | Riya     |    12 | Color | Ready    | Amit  |   ₹75 |

Filters:

* All
* New
* Printing
* Ready
* Assigned
* Delivery
* Completed
* Cancelled

---

# 28. Print Queue

Dedicated printer workflow.

```text
PRINT QUEUE

#PK1024
assignment.pdf

24 pages
B&W
Double-sided
1 copy

[Download PDF]
[Start Printing]
[Mark Printed]
```

The system should make it very obvious what needs to be physically printed.

---

# 29. Printer Job Screen

Clicking an order opens:

```text
PRINT JOB

Customer:
Ani

File:
assignment.pdf

Pages:
24

Copies:
1

Color:
B&W

Sides:
Double

Paper:
A4

Notes:
Staple at end

[Open File]
[Start Print]
[Mark Complete]
```

---

# 30. Printer Status

Show:

```text
PRINTER STATUS

Epson L3250

● Online

Ink
████████░░

Paper
███████░░░

Current job
PK1024
```

For demo these values can be simulated.

Later they can come from printer/network monitoring.

---

# 31. Rider Management

Admin can see:

```text
RIDERS

Rahul
● Online
3 active orders

Amit
● Offline
0 active orders
```

Actions:

* Add rider
* Edit rider
* Activate/deactivate
* Assign orders
* View earnings
* View delivery history

---

# 32. Manual Rider Assignment

When order becomes ready:

```text
ORDER #PK1024

Ready for delivery

Available riders:

Rahul     1.2 km
Amit      2.1 km
Vikas     3.4 km

[Assign Rahul]
```

Later this can become automated.

---

# 33. Customer Management

Admin can see:

```text
CUSTOMERS

Ani
Orders: 12
Spent: ₹640
Wallet: ₹240

Riya
Orders: 4
Spent: ₹220
Wallet: ₹50
```

Actions:

* View customer
* Order history
* Wallet
* Addresses
* Discounts
* Account status

---

# 34. Pricing Management

Do **not** hardcode pricing.

Admin should have:

```text
PRICING

B&W
₹2 / page

Color
₹5 / page

Delivery
₹15 starting

Student B&W
₹1.75 / page

Student Color
₹4 / page
```

Edit button.

---

# 35. Coupons & Offers

Admin can create:

```text
CREATE OFFER

Code:
WELCOME50

Type:
Percentage / Fixed

Discount:
20%

Minimum order:
₹100

Expiry:
30 Sept 2026

[Create]
```

Potential offers:

* First order
* Student discount
* Referral
* Hostel campaign
* Festival campaign

---

# 36. Analytics

Admin dashboard should eventually show:

### Sales

* Daily sales
* Weekly sales
* Monthly sales

### Orders

* Total orders
* Completed
* Cancelled
* Failed

### Printing

* Pages printed
* B&W pages
* Color pages

### Customers

* New customers
* Repeat customers
* Active customers

### Delivery

* Average delivery time
* Orders/rider
* Failed deliveries

---

# 37. Admin Settings

Include:

### Business

* Business name
* Phone
* Email
* Address

### Service zones

* Vapi
* Sarigam
* Bhilad

### Pricing

All print/delivery prices.

### Operating hours

Example:

```text
Mon-Sun
8:00 AM – 10:00 PM
```

### Order settings

* Minimum order
* Maximum file size
* Maximum pages
* Delivery radius

---

# 38. Order State Machine

This should be explicitly implemented.

```text
CREATED
   ↓
PAYMENT_PENDING
   ↓
CONFIRMED
   ↓
PRINT_QUEUE
   ↓
PRINTING
   ↓
PRINTED
   ↓
READY_FOR_PICKUP
   ↓
RIDER_ASSIGNED
   ↓
PICKED_UP
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED
```

Alternative failure states:

```text
CANCELLED
PAYMENT_FAILED
PRINT_FAILED
DELIVERY_FAILED
REFUNDED
```

This state machine will prevent your database from eventually becoming a bowl of spaghetti with timestamps.

---

# 39. Database Models

Eventually create these primary entities:

```text
User
CustomerProfile
RiderProfile
AdminProfile

Order
OrderItem
Document

Payment
Wallet
WalletTransaction

Delivery
Address

Printer
PrintJob

Coupon
Notification
SupportTicket
```

---

# 40. Order Database Structure

Example:

```json
{
  "orderId": "PK1024",
  "customerId": "CUS001",
  "document": "assignment.pdf",
  "pages": 24,
  "copies": 1,
  "printType": "bw",
  "sides": "double",
  "paper": "A4",
  "subtotal": 48,
  "deliveryFee": 15,
  "discount": 0,
  "total": 63,
  "paymentStatus": "paid",
  "orderStatus": "printing",
  "riderId": null
}
```

---

# 41. Notifications Architecture

Every major state change triggers a notification.

```text
Order Confirmed
      ↓
Notification

Printing Started
      ↓
Notification

Printing Completed
      ↓
Notification

Rider Assigned
      ↓
Notification

Out for Delivery
      ↓
Notification

Delivered
      ↓
Notification
```

Initially these can simply appear inside the webapp.

Later:

* WhatsApp
* SMS
* Email
* Push notifications

---

# 42. Demo Mode

The first build should deliberately **not require external services**.

Everything should work with mock data.

### Simulated:

* Login
* Orders
* Payments
* Printer
* Rider
* Tracking
* Notifications
* Wallet
* Analytics

For example, clicking:

**Start Printing**

changes:

```text
CONFIRMED
```

to:

```text
PRINTING
```

Click:

**Mark Printed**

↓

```text
READY
```

Admin assigns rider.

Rider sees order.

Rider picks it up.

Rider marks delivered.

Customer sees:

```text
✓ Delivered
```

That complete loop is the most important demo.

---

# 43. Recommended Demo Data

Preload:

### Customers

* Ani
* Riya
* Dev
* Priya
* Karan

### Riders

* Rahul
* Amit
* Vikas

### Orders

Create at least **15–20 realistic orders** distributed across:

* New
* Confirmed
* Printing
* Ready
* Rider assigned
* Out for delivery
* Delivered
* Cancelled

This makes dashboards feel alive.

---

# 44. Search & Filtering

Every major dashboard should support:

* Search order ID
* Search customer
* Search rider
* Filter status
* Filter date
* Filter payment
* Filter print type

Admin needs this particularly badly once order count crosses the human brain's comfortable limit of approximately seven things.

---

# 45. Mobile Responsiveness

This is critical.

### Customer

**Mobile-first.**

Students will probably order from their phones.

### Rider

**Mobile-first.**

Rider interface should be extremely simple.

### Admin

Desktop-first but responsive.

---

# 46. Recommended Tech Stack

For the first implementation:

### Frontend

**Next.js + React + TypeScript**

### Styling

**Tailwind CSS**

### Components

**shadcn/ui**

### Backend

Next.js API routes initially.

Later:

Node.js backend if needed.

### Database

**PostgreSQL**

Use Prisma ORM.

### Authentication

Initially:

Mock/demo authentication.

Later:

Clerk/Auth.js/Supabase Auth.

### File storage

Initially:

Local/mock storage.

Production:

S3-compatible object storage.

### Maps

Later:

Mapbox or Google Maps.

### Payments

Later:

Razorpay.

### WhatsApp

Later:

WAHA initially, then potentially official WhatsApp Business API.

---

# 47. Main Routes

```text
/login

/customer
/customer/orders
/customer/orders/new
/customer/orders/[id]
/customer/wallet
/customer/profile
/customer/addresses

/rider
/rider/orders
/rider/orders/[id]
/rider/earnings
/rider/profile

/admin
/admin/orders
/admin/orders/[id]
/admin/print-queue
/admin/riders
/admin/customers
/admin/printers
/admin/pricing
/admin/coupons
/admin/analytics
/admin/settings
```

---

# 48. MVP Priority

## Phase 1: Demo

Build these first:

### Authentication

* Demo role selection
* Three accounts

### Customer

* Dashboard
* Upload PDF
* Configure print
* Address
* Pricing
* Order creation
* Tracking
* Order history

### Rider

* Dashboard
* Assigned orders
* Order details
* Pickup
* Delivery status
* Earnings

### Admin

* Dashboard
* Orders
* Print queue
* Print job management
* Rider assignment
* Customers
* Pricing

### System

* Mock database
* Notifications
* Complete order state machine

---

# 49. Phase 2: Real Infrastructure

After the demo works:

```text
Demo
 ↓
Real database
 ↓
Real authentication
 ↓
Real file storage
 ↓
Razorpay
 ↓
WAHA
 ↓
Printer integration
 ↓
Maps
 ↓
Rider tracking
```

---

# 50. Phase 3: Automation

Eventually:

### AI ordering

```text
WhatsApp
 ↓
AI
 ↓
Order extraction
 ↓
Printkarr API
 ↓
Order created
```

### Automatic printer queue

```text
Confirmed
 ↓
Print server
 ↓
Epson
```

### Automatic rider assignment

```text
Ready
 ↓
Nearby riders
 ↓
Distance/capacity
 ↓
Assignment
```

---

# 51. Final Product Architecture

The finished Printkarr ecosystem should look like:

```text
                         PRINTKARR
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
     CUSTOMER             RIDER               ADMIN
        │                   │                   │
        ▼                   ▼                   ▼
    Order UI           Delivery UI        Control Center
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                       PRINTKARR API
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       Database         File Storage       Payments
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                        n8n / AI
                            │
              ┌─────────────┼─────────────┐
              │             │             │
           WhatsApp       Printer       Maps
              │             │             │
             WAHA        Epson L3250    Routing
```

## The core MVP principle

**Don't start by building 70 screens.**

The first demo needs to prove one thing:

> **A customer can create an order → you can process/print it → assign a rider → rider delivers it → customer sees the completed delivery.**

Everything else should orbit that loop.

Once that loop is flawless, add payments, wallets, WhatsApp AI, automated printer control, routing, analytics, semester passes, stationery, and the other assorted ways humans have discovered to turn a ₹20 printout into a software company.
