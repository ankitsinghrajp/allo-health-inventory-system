# Inventory Reservation System

A full-stack inventory reservation system built with Next.js, Prisma, Neon PostgreSQL, and Redis.

The application prevents overselling of inventory by introducing temporary reservations during checkout. Products can be reserved for a limited time, confirmed after successful payment, or released if the user cancels or the reservation expires.

---

# Architecture

```text
Client (Next.js UI)
        |
        v
Next.js Route Handlers
        |
        +---- Prisma ORM ------> Neon PostgreSQL
        |
        +---- Redis -----------> Distributed Locks
```

The frontend communicates with Next.js API routes. Prisma handles database access, while Redis is used for distributed locking to prevent concurrent inventory modifications.

---

# Tech Stack

## Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS

## Backend

* Next.js Route Handlers
* Prisma ORM

## Database

* Neon PostgreSQL

## Caching / Concurrency Control

* Redis (Upstash)

---

# Features

## Product Listing

* View products across warehouses.
* View total stock, reserved stock, and available stock.
* Real-time stock updates using frontend polling.

## Inventory Reservation

Users can reserve inventory for 10 minutes.

During reservation:

* Available stock decreases.
* Reserved stock increases.
* Reservation status is set to `PENDING`.

If stock is unavailable, the API returns:

```http
409 Conflict
```

and the user sees the error on the UI.

---

## Reservation Confirmation

When payment succeeds:

* Reservation status becomes `CONFIRMED`.
* Reserved stock decreases.
* Total stock decreases permanently.

If the reservation has expired:

```http
410 Gone
```

is returned and displayed to the user.

---

## Reservation Release

When payment fails or the user cancels:

* Reservation status becomes `RELEASED`.
* Reserved stock is restored.
* Inventory becomes available to other users.

---

## Reservation Expiry

Reservations automatically expire after 10 minutes.

Expired reservations are released automatically through lazy cleanup.

Before reservation, confirmation, or release operations:

* Expired reservations are detected.
* Reserved stock is restored.
* Reservation status becomes `RELEASED`.

---

# Assumptions

* Inventory reservations expire after 10 minutes.
* Only `PENDING` reservations can be confirmed or released.
* Confirmed reservations permanently reduce inventory stock.
* Released reservations restore reserved inventory.
* Reservation cleanup is performed lazily during reservation-related requests.

---

# API Endpoints

## Products

### GET /api/products

Returns all products with inventory information.

Response includes:

* Product information
* Warehouse information
* Total stock
* Reserved stock
* Available stock

---

## Warehouses

### GET /api/warehouses

Returns all warehouses.

---

## Create Reservation

### POST /api/reservations

Creates a temporary reservation.

Request:

```json
{
  "inventoryId": "inventory-id",
  "quantity": 1
}
```

Possible responses:

```http
201 Created
```

```http
409 Conflict
```

```http
404 Not Found
```

---

## Confirm Reservation

### POST /api/reservations/:id/confirm

Confirms a reservation after successful payment.

Possible responses:

```http
200 OK
```

```http
410 Gone
```

```http
404 Not Found
```

---

## Release Reservation

### POST /api/reservations/:id/release

Releases a reservation.

Possible responses:

```http
200 OK
```

```http
404 Not Found
```

---

# Concurrency Handling

The main challenge of this assignment is preventing overselling.

Example:

Two users attempt to reserve the last unit of a product at the same time.

Without concurrency control:

* Both requests may read the same stock.
* Both reservations may succeed.
* Inventory becomes inconsistent.

## Solution

A Redis distributed lock is used for each inventory item.

Lock Key:

```text
lock:inventory:{inventoryId}
```

Reservation flow:

1. Acquire Redis lock.
2. Start Prisma transaction.
3. Read inventory.
4. Check available stock.
5. Create reservation.
6. Increment reserved stock.
7. Commit transaction.
8. Release lock.

This guarantees that only one reservation request can modify a specific inventory item at a time.

Result:

If two users try to reserve the last unit simultaneously:

* One request succeeds.
* One request fails.
* Overselling is prevented.

---

# Real-Time Updates

Frontend polling runs every 2 seconds.

This ensures:

* Inventory changes appear automatically.
* Out-of-stock products update without page refresh.
* Reservation status changes are reflected in real time.

---

# Database Models

## Product

Stores product information.

## Warehouse

Stores warehouse information.

## Inventory

Stores:

* Product
* Warehouse
* Total stock
* Reserved stock

Available stock is calculated as:

```text
availableStock = totalStock - reservedStock
```

## Reservation

Stores:

* Inventory reference
* Quantity
* Status
* Expiry time

Possible statuses:

```text
PENDING
CONFIRMED
RELEASED
```

---

# Running Locally

## 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-folder>
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env` file in the root directory and add:

```env
DATABASE_URL=

UPSTASH_REDIS_REST_URL=

UPSTASH_REDIS_REST_TOKEN=
```

## 4. Generate Prisma Client

```bash
npx prisma generate
```

## 5. Push Database Schema

```bash
npx prisma db push
```

## 6. Start Development Server

```bash
npm run dev
```

Application URL:

```text
http://localhost:3000
```

---

# Testing Performed

## Reservation Flow

* Create reservation
* Confirm reservation
* Release reservation

## Concurrency

* Simultaneous reservation requests for the last unit
* Verified that only one request succeeds

## Expiry

* Reservation expiration
* Confirm after expiration
* Release after expiration

## Real-Time Updates

* Inventory updates across multiple browser sessions
* Automatic out-of-stock updates without page refresh

---

# Trade-Offs

For this assignment, reservation expiry is handled using lazy cleanup before reservation-related operations.

Advantages:

* Simpler implementation
* No additional infrastructure required

Production improvements:

* Background workers
* Scheduled jobs
* Cron-based cleanup

Additionally, frontend updates use polling every 2 seconds for simplicity.

In production, this could be replaced with:

* WebSockets
* Server-Sent Events (SSE)

to provide more efficient real-time updates.

---

# Deployment

Frontend: Vercel

Database: Neon PostgreSQL

Caching / Locking: Upstash Redis
