# KTV Management System

This repository contains the frontend and backend for a KTV Management System.

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- MongoDB running locally or a reachable MongoDB connection string

## Quick Start

1. Set up the backend:

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

2. Set up the frontend in a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

3. Open the frontend URL shown by Vite, usually `http://localhost:5173`.

4. Verify the backend health endpoint at `http://localhost:5000/api/health`.

## Environment Files

- [backend/.env.example](./backend/.env.example) contains every backend variable currently read by `src/config/env.js`
- [frontend/.env.example](./frontend/.env.example) contains every frontend runtime variable currently read by `src/services/apiClient.js`
- copy each example to `.env` before starting the app

## Frontend Setup

1. Open a terminal in [frontend](./frontend).
2. Install dependencies:

```bash
npm install
```

3. Create an environment file from the example:

```bash
cp .env.example .env
```

If you are using PowerShell:

```powershell
Copy-Item .env.example .env
```

4. Update `VITE_API_BASE_URL` in `.env` if your backend is not running on `http://localhost:5000/api`.
5. Start the frontend:

```bash
npm run dev
```

6. Open the Vite local URL shown in the terminal, typically:

```text
http://localhost:5173
```

Frontend architecture notes:

- React Router handles page routing
- Axios services handle HTTP only
- React Context exposes feature ViewModels
- pages stay thin and call ViewModel actions rather than owning async business logic or manual bootstrapping fetches
- auth bootstrap uses the stored JWT for `/auth/me` on app load
- protected routing is handled centrally, with optional role checks for restricted screens
- report filters support daily, monthly, and custom date-range revenue queries

Frontend structure:

```text
frontend/
  src/
    contexts/
    hooks/
    layouts/
    models/
    routes/
    services/
    utils/
    viewmodels/
    views/
      components/
      pages/
```

## Backend Setup

1. Open a terminal in [backend](./backend).
2. Install dependencies:

```bash
npm install
```

3. Create an environment file from the example:

```bash
cp .env.example .env
```

If you are using PowerShell:

```powershell
Copy-Item .env.example .env
```

4. Update `MONGODB_URI` and any other environment values in `.env`.
5. Start the backend in development mode:

```bash
npm run dev
```

6. Verify the service is running:

```text
GET http://localhost:5000/api/health
```

Expected response shape:

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "service": "KTV Management System API",
    "environment": "development",
    "uptimeSeconds": 12,
    "timestamp": "2026-04-21T00:00:00.000Z",
    "database": {
      "status": "connected"
    }
  },
  "meta": null
}
```

## Backend Structure

```text
backend/
  src/
    config/
    controllers/
    middlewares/
    models/
    routes/
    services/
    utils/
```

The backend is set up with:

- Express application bootstrap in `src/app.js`
- Server startup in `src/server.js`
- Environment-based configuration in `src/config/env.js`
- MongoDB connection with Mongoose in `src/config/db.js`
- Centralized error handling in `src/middlewares/error.middleware.js`
- Consistent success responses through `src/utils/apiResponse.js`
- business rules enforced in services rather than controllers
- database constraints backing critical invariants such as one open session per room and one invoice per session

## Verification Commands

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run build
```

## Development Login

When the backend starts and the `users` collection is empty, it automatically seeds:

- Admin user:
  `username: admin`
  `password: admin123`
- Receptionist user:
  `username: reception`
  `password: reception123`

These defaults can be changed in [backend/.env.example](./backend/.env.example) by setting:

- `DEFAULT_ADMIN_USERNAME`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_NAME`
- `DEFAULT_RECEPTIONIST_USERNAME`
- `DEFAULT_RECEPTIONIST_PASSWORD`
- `DEFAULT_RECEPTIONIST_NAME`

Login endpoint:

```text
POST http://localhost:5000/api/auth/login
```

Request body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Authenticated user endpoint:

```text
GET http://localhost:5000/api/auth/me
Authorization: Bearer <jwt-token>
```

## Room API

Protected endpoints:

- `GET /api/rooms`
- `GET /api/rooms/:id`
- `POST /api/rooms`
- `PUT /api/rooms/:id`
- `PATCH /api/rooms/:id/status`

Authorization rules:

- `admin` and `receptionist` can list rooms, get room details, and update room status
- only `admin` can create rooms or update room master data

Sample create room request:

```json
{
  "code": "A101",
  "name": "Room A101",
  "type": "standard",
  "capacity": 6,
  "status": "available",
  "hourlyRate": 300,
  "isActive": true,
  "notes": ""
}
```

Sample create room response:

```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "room": {
      "id": "6805f0fe7db7a0f4b3d53c10",
      "code": "A101",
      "name": "Room A101",
      "type": "standard",
      "capacity": 6,
      "status": "available",
      "hourlyRate": 300,
      "isActive": true,
      "notes": "",
      "currentSessionId": null,
      "activeReservationId": null,
      "createdAt": "2026-04-21T12:00:00.000Z",
      "updatedAt": "2026-04-21T12:00:00.000Z"
    }
  },
  "meta": null
}
```

Sample update room status request:

```json
{
  "status": "occupied",
  "currentSessionId": "6805f0fe7db7a0f4b3d53c20"
}
```

Sample update room status response:

```json
{
  "success": true,
  "message": "Room status updated successfully",
  "data": {
    "room": {
      "id": "6805f0fe7db7a0f4b3d53c10",
      "code": "A101",
      "name": "Room A101",
      "type": "standard",
      "capacity": 6,
      "status": "occupied",
      "hourlyRate": 300,
      "isActive": true,
      "notes": "",
      "currentSessionId": "6805f0fe7db7a0f4b3d53c20",
      "activeReservationId": null,
      "createdAt": "2026-04-21T12:00:00.000Z",
      "updatedAt": "2026-04-21T12:10:00.000Z"
    }
  },
  "meta": null
}
```

## Reservation API

Protected endpoints:

- `GET /api/reservations`
- `GET /api/reservations/:id`
- `POST /api/reservations`
- `PUT /api/reservations/:id`
- `PATCH /api/reservations/:id/cancel`
- `PATCH /api/reservations/:id/check-in`

Reservation rules:

- room bookings are checked with time-range overlap detection
- cancelled reservations do not block future bookings
- check-in prepares a `sessionDraft` handoff payload for later session creation
- room documents keep only current operational links such as `activeReservationId`

Sample create reservation request:

```json
{
  "customerName": "Somchai",
  "customerPhone": "0812345678",
  "roomId": "6805f0fe7db7a0f4b3d53c10",
  "reservedStartTime": "2026-04-21T18:00:00.000Z",
  "expectedDuration": 120,
  "depositAmount": 500,
  "status": "confirmed",
  "notes": "Birthday booking"
}
```

Sample create reservation response:

```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "reservation": {
      "id": "6805f4d37db7a0f4b3d53c55",
      "customerName": "Somchai",
      "customerPhone": "0812345678",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservedStartTime": "2026-04-21T18:00:00.000Z",
      "expectedDuration": 120,
      "reservedEndTime": "2026-04-21T20:00:00.000Z",
      "depositAmount": 500,
      "status": "confirmed",
      "notes": "Birthday booking",
      "roomSnapshot": {
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "code": "A101",
        "name": "Room A101",
        "type": "standard",
        "hourlyRate": 300
      },
      "reservedBy": "6805eff97db7a0f4b3d53bf0",
      "checkedInAt": null,
      "createdAt": "2026-04-21T12:30:00.000Z",
      "updatedAt": "2026-04-21T12:30:00.000Z"
    }
  },
  "meta": null
}
```

Sample check-in response:

```json
{
  "success": true,
  "message": "Reservation checked in successfully",
  "data": {
    "reservation": {
      "id": "6805f4d37db7a0f4b3d53c55",
      "status": "checked_in",
      "checkedInAt": "2026-04-21T18:02:00.000Z"
    },
    "sessionDraft": {
      "reservationId": "6805f4d37db7a0f4b3d53c55",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "customerName": "Somchai",
      "customerPhone": "0812345678",
      "roomSnapshot": {
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "code": "A101",
        "name": "Room A101",
        "type": "standard",
        "hourlyRate": 300
      },
      "openedAt": "2026-04-21T18:02:00.000Z"
    }
  },
  "meta": null
}
```

## Session API

Protected endpoints:

- `POST /api/sessions/walk-in`
- `POST /api/sessions/from-reservation/:reservationId`
- `GET /api/sessions/active`
- `GET /api/sessions/:id`
- `PATCH /api/sessions/:id/items`
- `PATCH /api/sessions/:id/close`

Session behavior:

- a room can have only one active session at a time
- walk-in sessions snapshot the room rate at the moment the session starts
- reservation sessions can only be created from reservations already in `checked_in`
- open sessions mark the room as `occupied`
- adding ordered items deducts stock automatically and records `sale` stock movements
- ordered items snapshot the product price at the moment they are added to the session
- closing a session clears `currentSessionId` and returns the room to `available`
- closed sessions are read-only in this module because there are no edit endpoints

Sample walk-in session request:

```json
{
  "roomId": "6805f0fe7db7a0f4b3d53c10",
  "customerName": "Somchai",
  "customerPhone": "0812345678",
  "startTime": "2026-04-21T19:00:00.000Z",
  "notes": "Walk-in customer"
}
```

Sample walk-in session response:

```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "session": {
      "id": "680603527db7a0f4b3d53cb0",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservationId": null,
      "customerName": "Somchai",
      "customerPhone": "0812345678",
      "startTime": "2026-04-21T19:00:00.000Z",
      "endTime": null,
      "roomRateSnapshot": {
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "code": "A101",
        "name": "Room A101",
        "type": "standard",
        "hourlyRate": 300
      },
      "orderedItems": [],
      "status": "open",
      "notes": "Walk-in customer",
      "openedBy": "6805eff97db7a0f4b3d53bf0",
      "closedBy": null,
      "invoiceId": null,
      "createdAt": "2026-04-21T19:00:01.000Z",
      "updatedAt": "2026-04-21T19:00:01.000Z"
    }
  },
  "meta": null
}
```

Sample add session items request:

```json
{
  "items": [
    {
      "productId": "68060a6f7db7a0f4b3d53cf1",
      "quantity": 2
    },
    {
      "productId": "68060ab17db7a0f4b3d53d01",
      "quantity": 1
    }
  ]
}
```

Sample add session items response:

```json
{
  "success": true,
  "message": "Items added to session successfully",
  "data": {
    "session": {
      "id": "680603527db7a0f4b3d53cb0",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservationId": null,
      "customerName": "Somchai",
      "customerPhone": "0812345678",
      "startTime": "2026-04-21T19:00:00.000Z",
      "endTime": null,
      "roomRateSnapshot": {
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "code": "A101",
        "name": "Room A101",
        "type": "standard",
        "hourlyRate": 300
      },
      "orderedItems": [
        {
          "productId": "68060a6f7db7a0f4b3d53cf1",
          "productName": "Coca-Cola 330ml",
          "unitPrice": 35,
          "quantity": 2,
          "lineTotal": 70,
          "addedAt": "2026-04-21T19:30:00.000Z"
        }
      ],
      "itemsSubtotal": 70,
      "totalAmount": 70,
      "status": "open",
      "notes": "Walk-in customer",
      "openedBy": "6805eff97db7a0f4b3d53bf0",
      "closedBy": null,
      "invoiceId": null,
      "createdAt": "2026-04-21T19:00:01.000Z",
      "updatedAt": "2026-04-21T19:30:00.000Z"
    }
  },
  "meta": null
}
```

Sample close session response:

```json
{
  "success": true,
  "message": "Session closed successfully",
  "data": {
    "session": {
      "id": "680603527db7a0f4b3d53cb0",
      "status": "closed",
      "endTime": "2026-04-21T21:15:00.000Z",
      "closedBy": "6805eff97db7a0f4b3d53bf0"
    }
  },
  "meta": null
}
```

## Invoice API

Protected endpoints:

- `POST /api/invoices/checkout/:sessionId`
- `GET /api/invoices/:id`

Checkout behavior:

- checkout is the point where an active session becomes closed and an invoice is generated
- room charges are calculated from actual duration and `roomRateSnapshot.hourlyRate`
- product charges are calculated from session `orderedItems`
- invoice totals use `subtotal`, `discountAmount`, `taxAmount`, and `grandTotal`
- `paidAt` is only set when `paymentStatus` is `paid`
- invoices are the source of truth for future revenue reporting
- after checkout, the room moves to `cleaning` in the current design

Sample checkout request:

```json
{
  "paymentStatus": "paid",
  "paymentMethod": "qr",
  "discountAmount": 50,
  "taxAmount": 45.5,
  "checkoutTime": "2026-04-21T21:15:00.000Z",
  "notes": "Paid in full"
}
```

Sample invoice response:

```json
{
  "success": true,
  "message": "Session checked out successfully",
  "data": {
    "invoice": {
      "id": "680612867db7a0f4b3d53d40",
      "sessionId": "680603527db7a0f4b3d53cb0",
      "invoiceNumber": "INV-20260421131500-0421",
      "paymentStatus": "paid",
      "paymentMethod": "qr",
      "paidAt": "2026-04-21T21:15:00.000Z",
      "paidBy": "6805eff97db7a0f4b3d53bf0",
      "lines": [
        {
          "lineType": "room",
          "referenceId": "6805f0fe7db7a0f4b3d53c10",
          "code": "A101",
          "description": "Room A101 room charge",
          "quantity": 135,
          "unitPrice": 5,
          "lineTotal": 675
        },
        {
          "lineType": "product",
          "referenceId": "68060a6f7db7a0f4b3d53cf1",
          "code": "",
          "description": "Coca-Cola 330ml",
          "quantity": 2,
          "unitPrice": 35,
          "lineTotal": 70
        }
      ],
      "roomCharge": 675,
      "productCharge": 70,
      "subtotal": 745,
      "discountAmount": 50,
      "taxAmount": 45.5,
      "grandTotal": 740.5,
      "notes": "Paid in full",
      "createdAt": "2026-04-21T21:15:01.000Z",
      "updatedAt": "2026-04-21T21:15:01.000Z"
    }
  },
  "meta": null
}
```

## Report API

Protected endpoints:

- `GET /api/reports/revenue/daily?date=2026-04-21`
- `GET /api/reports/revenue/monthly?year=2026&month=4`
- `GET /api/reports/revenue/range?startDate=2026-04-01&endDate=2026-04-21`

Report behavior:

- reports aggregate invoices only
- only invoices with `paymentStatus = paid` are included
- revenue date filtering uses `paidAt`, never `createdAt`
- every report includes total revenue, number of paid invoices, payment method breakdown, and total sessions
- monthly reports also include a daily series breakdown for charting

Sample daily report response:

```json
{
  "success": true,
  "message": "Daily revenue report retrieved successfully",
  "data": {
    "report": {
      "period": "daily",
      "range": {
        "startDate": "2026-04-21",
        "endDateExclusive": "2026-04-22"
      },
      "totalRevenue": 1540,
      "paidInvoiceCount": 3,
      "totalSessions": 3,
      "paymentMethodBreakdown": [
        {
          "paymentMethod": "cash",
          "totalRevenue": 1000,
          "paidInvoiceCount": 2,
          "totalSessions": 2
        },
        {
          "paymentMethod": "card",
          "totalRevenue": 0,
          "paidInvoiceCount": 0,
          "totalSessions": 0
        },
        {
          "paymentMethod": "qr",
          "totalRevenue": 540,
          "paidInvoiceCount": 1,
          "totalSessions": 1
        },
        {
          "paymentMethod": "unknown",
          "totalRevenue": 0,
          "paidInvoiceCount": 0,
          "totalSessions": 0
        }
      ]
    }
  },
  "meta": null
}
```

Sample monthly report response:

```json
{
  "success": true,
  "message": "Monthly revenue report retrieved successfully",
  "data": {
    "report": {
      "period": "monthly",
      "range": {
        "startDate": "2026-04-01",
        "endDateExclusive": "2026-05-01"
      },
      "totalRevenue": 18450,
      "paidInvoiceCount": 41,
      "totalSessions": 41,
      "paymentMethodBreakdown": [
        {
          "paymentMethod": "cash",
          "totalRevenue": 8200,
          "paidInvoiceCount": 18,
          "totalSessions": 18
        },
        {
          "paymentMethod": "card",
          "totalRevenue": 4300,
          "paidInvoiceCount": 10,
          "totalSessions": 10
        },
        {
          "paymentMethod": "qr",
          "totalRevenue": 5950,
          "paidInvoiceCount": 13,
          "totalSessions": 13
        },
        {
          "paymentMethod": "unknown",
          "totalRevenue": 0,
          "paidInvoiceCount": 0,
          "totalSessions": 0
        }
      ],
      "dailyBreakdown": [
        {
          "date": "2026-04-01",
          "totalRevenue": 1200,
          "paidInvoiceCount": 3,
          "totalSessions": 3
        },
        {
          "date": "2026-04-02",
          "totalRevenue": 980,
          "paidInvoiceCount": 2,
          "totalSessions": 2
        }
      ]
    }
  },
  "meta": null
}
```

## Product API

Protected endpoints:

- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products/:id/stock-movements`
- `POST /api/products`
- `PUT /api/products/:id`
- `PATCH /api/products/:id/stock-in`
- `PATCH /api/products/:id/stock-adjustment`

Product behavior:

- `price` is the current product price only; historical session or invoice prices must come from their own snapshots
- every stock change writes a `stock_movements` record
- stock is never allowed to go below zero
- low stock can be filtered with `GET /api/products?lowStock=true`

Sample create product request:

```json
{
  "name": "Coca-Cola 330ml",
  "category": "drink",
  "price": 35,
  "stockQty": 24,
  "lowStockThreshold": 5,
  "isActive": true
}
```

Sample stock-in request:

```json
{
  "quantity": 12,
  "reason": "Weekly supplier delivery"
}
```

Sample stock adjustment request:

```json
{
  "newStockQty": 18,
  "reason": "Physical count correction"
}
```

Sample stock movement response shape:

```json
{
  "success": true,
  "message": "Product stock increased successfully",
  "data": {
    "product": {
      "id": "68060a6f7db7a0f4b3d53cf1",
      "name": "Coca-Cola 330ml",
      "category": "drink",
      "price": 35,
      "stockQty": 36,
      "lowStockThreshold": 5,
      "isActive": true,
      "isLowStock": false,
      "createdAt": "2026-04-21T20:00:00.000Z",
      "updatedAt": "2026-04-21T20:15:00.000Z"
    },
    "stockMovement": {
      "id": "68060a8a7db7a0f4b3d53cf5",
      "productId": "68060a6f7db7a0f4b3d53cf1",
      "movementType": "stock_in",
      "quantity": 12,
      "beforeQty": 24,
      "afterQty": 36,
      "reason": "Weekly supplier delivery",
      "createdBy": "6805eff97db7a0f4b3d53bf0",
      "sessionId": null,
      "invoiceId": null,
      "createdAt": "2026-04-21T20:15:00.000Z",
      "updatedAt": "2026-04-21T20:15:00.000Z"
    }
  },
  "meta": null
}
```
