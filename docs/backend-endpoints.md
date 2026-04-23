# Backend API Reference

Base API prefix: `/api`

Common success wrapper:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {},
  "meta": null
}
```

Common error wrapper:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": [
        {
          "field": "username",
          "message": "username must be at least 3 characters"
        }
      ]
    }
  }
}
```

Protected endpoints expect:

`Authorization: Bearer <JWT>`

Object IDs in this document are MongoDB ObjectId strings.

## Authentication

### POST /api/auth/login

Purpose:
Authenticate a user and return a JWT plus the sanitized user profile.

Auth:
No

Role restrictions:
None

Path params:
None

Query params:
None

Request body:
- `username` string, required, min length `3`
- `password` string, required, min length `6`

Example success response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example",
    "user": {
      "id": "6805eff97db7a0f4b3d53bf0",
      "username": "admin",
      "name": "System Admin",
      "role": "admin",
      "isActive": true,
      "lastLoginAt": "2026-04-23T03:10:00.000Z",
      "createdAt": "2026-04-21T09:00:00.000Z",
      "updatedAt": "2026-04-23T03:10:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Invalid username or password",
  "error": {
    "code": "INVALID_CREDENTIALS",
    "details": null
  }
}
```

### GET /api/auth/me

Purpose:
Return the currently authenticated user from the JWT payload and database.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
Any authenticated user

Path params:
None

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Authenticated user retrieved successfully",
  "data": {
    "user": {
      "id": "6805eff97db7a0f4b3d53bf0",
      "username": "reception",
      "name": "Front Desk",
      "role": "receptionist",
      "isActive": true,
      "lastLoginAt": "2026-04-23T02:55:00.000Z",
      "createdAt": "2026-04-21T09:00:00.000Z",
      "updatedAt": "2026-04-23T02:55:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Invalid or expired authentication token",
  "error": {
    "code": "INVALID_TOKEN",
    "details": null
  }
}
```

## Health

### GET /

Purpose:
Root service info endpoint. This is not under `/api` and is mainly operational.

Auth:
No

Role restrictions:
None

Path params:
None

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "KTV Management System API is running",
  "data": {
    "healthCheck": "/api/health"
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Route not found: GET /unknown",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  }
}
```

### GET /api/health

Purpose:
Return application and database connection health status.

Auth:
No

Role restrictions:
None

Path params:
None

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "service": "KTV Management System API",
    "environment": "development",
    "uptimeSeconds": 1482,
    "timestamp": "2026-04-23T03:12:00.000Z",
    "database": {
      "status": "connected"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Route not found: GET /api/healthz",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  }
}
```

## Rooms

### GET /api/rooms

Purpose:
List rooms with optional filtering by operational status and active flag.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
None

Query params:
- `status` optional, one of `available`, `reserved`, `occupied`, `cleaning`, `maintenance`
- `isActive` optional, `true` or `false`

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Rooms retrieved successfully",
  "data": {
    "rooms": [
      {
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
    ],
    "total": 1
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": [
        {
          "field": "status",
          "message": "status must be one of: available, reserved, occupied, cleaning, maintenance"
        }
      ]
    }
  }
}
```

### GET /api/rooms/:id

Purpose:
Get one room by id.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, room ObjectId

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Room retrieved successfully",
  "data": {
    "room": {
      "id": "6805f0fe7db7a0f4b3d53c10",
      "code": "A101",
      "name": "Room A101",
      "type": "standard",
      "capacity": 6,
      "status": "reserved",
      "hourlyRate": 300,
      "isActive": true,
      "notes": "",
      "currentSessionId": null,
      "activeReservationId": "680601117db7a0f4b3d53c50",
      "createdAt": "2026-04-21T12:00:00.000Z",
      "updatedAt": "2026-04-23T02:40:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Room not found",
  "error": {
    "code": "ROOM_NOT_FOUND",
    "details": null
  }
}
```

### POST /api/rooms

Purpose:
Create a room master record.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin` only

Path params:
None

Query params:
None

Request body:
- `code` string, required, `1-20` chars, saved uppercase
- `name` string, required, `1-100` chars
- `type` required, `standard` or `vip`
- `capacity` integer, required, `1-100`
- `hourlyRate` number, required, `>= 0`
- `status` optional, one of `available`, `reserved`, `occupied`, `cleaning`, `maintenance`
- `isActive` optional boolean
- `notes` optional string, max `500`
- `currentSessionId` optional ObjectId or `null`
- `activeReservationId` optional ObjectId or `null`

Example success response:

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

Example error response:

```json
{
  "success": false,
  "message": "Duplicate value detected",
  "error": {
    "code": "DUPLICATE_KEY",
    "details": {
      "fields": [
        "code"
      ]
    }
  }
}
```

### PUT /api/rooms/:id

Purpose:
Update room master data and, if included, enforce valid room status transitions and state invariants.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin` only

Path params:
- `id` required, room ObjectId

Query params:
None

Request body:
Any subset of:
- `code`
- `name`
- `type`
- `capacity`
- `hourlyRate`
- `status`
- `isActive`
- `notes`
- `currentSessionId`
- `activeReservationId`

Example success response:

```json
{
  "success": true,
  "message": "Room updated successfully",
  "data": {
    "room": {
      "id": "6805f0fe7db7a0f4b3d53c10",
      "code": "A101",
      "name": "Room A101 Deluxe",
      "type": "vip",
      "capacity": 8,
      "status": "maintenance",
      "hourlyRate": 450,
      "isActive": true,
      "notes": "Sound system upgrade",
      "currentSessionId": null,
      "activeReservationId": null,
      "createdAt": "2026-04-21T12:00:00.000Z",
      "updatedAt": "2026-04-23T03:00:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Invalid room status transition from occupied to available",
  "error": {
    "code": "INVALID_ROOM_STATUS_TRANSITION",
    "details": null
  }
}
```

### PATCH /api/rooms/:id/status

Purpose:
Update only the operational state of a room. This endpoint enforces room invariants such as not being both `occupied` and `available`, and requiring the correct linked session or reservation ids for `occupied` and `reserved` states.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, room ObjectId

Query params:
None

Request body:
- `status` required, one of `available`, `reserved`, `occupied`, `cleaning`, `maintenance`
- `currentSessionId` optional ObjectId or `null`
- `activeReservationId` optional ObjectId or `null`
- `notes` optional string, max `500`

Example success response:

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
      "currentSessionId": "680603527db7a0f4b3d53cb0",
      "activeReservationId": null,
      "createdAt": "2026-04-21T12:00:00.000Z",
      "updatedAt": "2026-04-23T03:05:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "occupied rooms must include currentSessionId",
  "error": {
    "code": "CURRENT_SESSION_REQUIRED",
    "details": null
  }
}
```

## Reservations

### GET /api/reservations

Purpose:
List reservations with optional filtering by status and room.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
None

Query params:
- `status` optional, one of `pending`, `confirmed`, `cancelled`, `checked_in`
- `roomId` optional, room ObjectId

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Reservations retrieved successfully",
  "data": {
    "reservations": [
      {
        "id": "680601117db7a0f4b3d53c50",
        "customerName": "Somchai",
        "customerPhone": "0812345678",
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "reservedStartTime": "2026-04-23T10:00:00.000Z",
        "expectedDuration": 120,
        "reservedEndTime": "2026-04-23T12:00:00.000Z",
        "depositAmount": 500,
        "status": "confirmed",
        "notes": "Birthday group",
        "roomSnapshot": {
          "roomId": "6805f0fe7db7a0f4b3d53c10",
          "code": "A101",
          "name": "Room A101",
          "type": "standard",
          "hourlyRate": 300
        },
        "reservedBy": "6805eff97db7a0f4b3d53bf0",
        "checkedInAt": null,
        "createdAt": "2026-04-22T16:30:00.000Z",
        "updatedAt": "2026-04-22T16:30:00.000Z"
      }
    ],
    "total": 1
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": [
        {
          "field": "roomId",
          "message": "roomId must be a valid ObjectId"
        }
      ]
    }
  }
}
```

### GET /api/reservations/:id

Purpose:
Get one reservation by id.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, reservation ObjectId

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Reservation retrieved successfully",
  "data": {
    "reservation": {
      "id": "680601117db7a0f4b3d53c50",
      "customerName": "Somchai",
      "customerPhone": "0812345678",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservedStartTime": "2026-04-23T10:00:00.000Z",
      "expectedDuration": 120,
      "reservedEndTime": "2026-04-23T12:00:00.000Z",
      "depositAmount": 500,
      "status": "confirmed",
      "notes": "Birthday group",
      "roomSnapshot": {
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "code": "A101",
        "name": "Room A101",
        "type": "standard",
        "hourlyRate": 300
      },
      "reservedBy": "6805eff97db7a0f4b3d53bf0",
      "checkedInAt": null,
      "createdAt": "2026-04-22T16:30:00.000Z",
      "updatedAt": "2026-04-22T16:30:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Reservation not found",
  "error": {
    "code": "RESERVATION_NOT_FOUND",
    "details": null
  }
}
```

### POST /api/reservations

Purpose:
Create a reservation. The service prevents room double-booking by checking time overlap against active reservations.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
None

Query params:
None

Request body:
- `customerName` string, required, `1-100` chars
- `customerPhone` string, required, `3-20` chars
- `roomId` required, room ObjectId
- `reservedStartTime` required, valid datetime string
- `expectedDuration` required, positive integer minutes
- `depositAmount` optional, number `>= 0`
- `status` optional, one of `pending`, `confirmed`, `cancelled`, `checked_in`
- `notes` optional string, max `500`

Example success response:

```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "reservation": {
      "id": "680601117db7a0f4b3d53c50",
      "customerName": "Somchai",
      "customerPhone": "0812345678",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservedStartTime": "2026-04-23T10:00:00.000Z",
      "expectedDuration": 120,
      "reservedEndTime": "2026-04-23T12:00:00.000Z",
      "depositAmount": 500,
      "status": "confirmed",
      "notes": "Birthday group",
      "roomSnapshot": {
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "code": "A101",
        "name": "Room A101",
        "type": "standard",
        "hourlyRate": 300
      },
      "reservedBy": "6805eff97db7a0f4b3d53bf0",
      "checkedInAt": null,
      "createdAt": "2026-04-22T16:30:00.000Z",
      "updatedAt": "2026-04-22T16:30:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Room is already booked for the requested time",
  "error": {
    "code": "ROOM_DOUBLE_BOOKING",
    "details": null
  }
}
```

### PUT /api/reservations/:id

Purpose:
Update a reservation before it is cancelled or checked in. This endpoint also re-checks room overlap conflicts.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, reservation ObjectId

Query params:
None

Request body:
Any subset of:
- `customerName`
- `customerPhone`
- `roomId`
- `reservedStartTime`
- `expectedDuration`
- `depositAmount`
- `status`
- `notes`

Important:
- Setting `status` to `cancelled` or `checked_in` here is blocked. Use the dedicated endpoints.
- Cancelled and checked-in reservations are not editable.

Example success response:

```json
{
  "success": true,
  "message": "Reservation updated successfully",
  "data": {
    "reservation": {
      "id": "680601117db7a0f4b3d53c50",
      "customerName": "Somchai Saetang",
      "customerPhone": "0812345678",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservedStartTime": "2026-04-23T10:30:00.000Z",
      "expectedDuration": 180,
      "reservedEndTime": "2026-04-23T13:30:00.000Z",
      "depositAmount": 700,
      "status": "confirmed",
      "notes": "Extended booking window",
      "roomSnapshot": {
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "code": "A101",
        "name": "Room A101",
        "type": "standard",
        "hourlyRate": 300
      },
      "reservedBy": "6805eff97db7a0f4b3d53bf0",
      "checkedInAt": null,
      "createdAt": "2026-04-22T16:30:00.000Z",
      "updatedAt": "2026-04-22T18:00:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Use the dedicated cancel or check-in endpoint for this status change",
  "error": {
    "code": "RESERVATION_STATUS_CHANGE_NOT_ALLOWED",
    "details": null
  }
}
```

### PATCH /api/reservations/:id/cancel

Purpose:
Cancel a reservation and release its room link when appropriate.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, reservation ObjectId

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Reservation cancelled successfully",
  "data": {
    "reservation": {
      "id": "680601117db7a0f4b3d53c50",
      "customerName": "Somchai",
      "customerPhone": "0812345678",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservedStartTime": "2026-04-23T10:00:00.000Z",
      "expectedDuration": 120,
      "reservedEndTime": "2026-04-23T12:00:00.000Z",
      "depositAmount": 500,
      "status": "cancelled",
      "notes": "Birthday group",
      "roomSnapshot": {
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "code": "A101",
        "name": "Room A101",
        "type": "standard",
        "hourlyRate": 300
      },
      "reservedBy": "6805eff97db7a0f4b3d53bf0",
      "checkedInAt": null,
      "createdAt": "2026-04-22T16:30:00.000Z",
      "updatedAt": "2026-04-23T01:00:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Checked-in reservations cannot be cancelled",
  "error": {
    "code": "RESERVATION_NOT_CANCELLABLE",
    "details": null
  }
}
```

### PATCH /api/reservations/:id/check-in

Purpose:
Mark a reservation as checked in and return a `sessionDraft` handoff payload for opening a room session.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, reservation ObjectId

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Reservation checked in successfully",
  "data": {
    "reservation": {
      "id": "680601117db7a0f4b3d53c50",
      "customerName": "Somchai",
      "customerPhone": "0812345678",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservedStartTime": "2026-04-23T10:00:00.000Z",
      "expectedDuration": 120,
      "reservedEndTime": "2026-04-23T12:00:00.000Z",
      "depositAmount": 500,
      "status": "checked_in",
      "notes": "Birthday group",
      "roomSnapshot": {
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "code": "A101",
        "name": "Room A101",
        "type": "standard",
        "hourlyRate": 300
      },
      "reservedBy": "6805eff97db7a0f4b3d53bf0",
      "checkedInAt": "2026-04-23T10:02:00.000Z",
      "createdAt": "2026-04-22T16:30:00.000Z",
      "updatedAt": "2026-04-23T10:02:00.000Z"
    },
    "sessionDraft": {
      "reservationId": "680601117db7a0f4b3d53c50",
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
      "openedAt": "2026-04-23T10:02:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Room already has an active session",
  "error": {
    "code": "ROOM_ALREADY_OCCUPIED",
    "details": null
  }
}
```

## Sessions

### GET /api/sessions/active

Purpose:
List all open sessions.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
None

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Active sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "id": "680603527db7a0f4b3d53cb0",
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "reservationId": null,
        "customerName": "Walk-in Customer",
        "customerPhone": "0899999999",
        "startTime": "2026-04-23T09:30:00.000Z",
        "endTime": null,
        "roomRateSnapshot": {
          "roomId": "6805f0fe7db7a0f4b3d53c10",
          "code": "A101",
          "name": "Room A101",
          "type": "standard",
          "hourlyRate": 300
        },
        "orderedItems": [],
        "itemsSubtotal": 0,
        "totalAmount": 0,
        "status": "open",
        "notes": "",
        "openedBy": "6805f0047db7a0f4b3d53bf5",
        "closedBy": null,
        "invoiceId": null,
        "createdAt": "2026-04-23T09:30:00.000Z",
        "updatedAt": "2026-04-23T09:30:00.000Z"
      }
    ],
    "total": 1
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Invalid or expired authentication token",
  "error": {
    "code": "INVALID_TOKEN",
    "details": null
  }
}
```

### GET /api/sessions/:id

Purpose:
Get one session by id.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, session ObjectId

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Session retrieved successfully",
  "data": {
    "session": {
      "id": "680603527db7a0f4b3d53cb0",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservationId": null,
      "customerName": "Walk-in Customer",
      "customerPhone": "0899999999",
      "startTime": "2026-04-23T09:30:00.000Z",
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
          "_id": "68060d3a7db7a0f4b3d53d00",
          "productId": "68060a6f7db7a0f4b3d53cf1",
          "productName": "Coca-Cola 330ml",
          "unitPrice": 35,
          "quantity": 2,
          "lineTotal": 70,
          "addedAt": "2026-04-23T10:00:00.000Z"
        }
      ],
      "itemsSubtotal": 70,
      "totalAmount": 70,
      "status": "open",
      "notes": "",
      "openedBy": "6805f0047db7a0f4b3d53bf5",
      "closedBy": null,
      "invoiceId": null,
      "createdAt": "2026-04-23T09:30:00.000Z",
      "updatedAt": "2026-04-23T10:00:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Session not found",
  "error": {
    "code": "SESSION_NOT_FOUND",
    "details": null
  }
}
```

### POST /api/sessions/walk-in

Purpose:
Open a new walk-in session for a room. The room rate is snapshotted at session start.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
None

Query params:
None

Request body:
- `roomId` required, room ObjectId
- `customerName` required, string `1-100` chars
- `customerPhone` optional string, max `20`
- `startTime` optional valid datetime string
- `notes` optional string, max `500`

Example success response:

```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "session": {
      "id": "680603527db7a0f4b3d53cb0",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservationId": null,
      "customerName": "Walk-in Customer",
      "customerPhone": "0899999999",
      "startTime": "2026-04-23T09:30:00.000Z",
      "endTime": null,
      "roomRateSnapshot": {
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "code": "A101",
        "name": "Room A101",
        "type": "standard",
        "hourlyRate": 300
      },
      "orderedItems": [],
      "itemsSubtotal": 0,
      "totalAmount": 0,
      "status": "open",
      "notes": "",
      "openedBy": "6805f0047db7a0f4b3d53bf5",
      "closedBy": null,
      "invoiceId": null,
      "createdAt": "2026-04-23T09:30:00.000Z",
      "updatedAt": "2026-04-23T09:30:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Room already has an active session",
  "error": {
    "code": "ACTIVE_SESSION_CONFLICT",
    "details": null
  }
}
```

### PATCH /api/sessions/:id/items

Purpose:
Add products to an open session, snapshotting product name and unit price and deducting stock immediately.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, session ObjectId

Query params:
None

Request body:
- `items` required, non-empty array
- `items[].productId` required, product ObjectId
- `items[].quantity` required, positive integer

Example success response:

```json
{
  "success": true,
  "message": "Items added to session successfully",
  "data": {
    "session": {
      "id": "680603527db7a0f4b3d53cb0",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservationId": null,
      "customerName": "Walk-in Customer",
      "customerPhone": "0899999999",
      "startTime": "2026-04-23T09:30:00.000Z",
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
          "_id": "68060d3a7db7a0f4b3d53d00",
          "productId": "68060a6f7db7a0f4b3d53cf1",
          "productName": "Coca-Cola 330ml",
          "unitPrice": 35,
          "quantity": 2,
          "lineTotal": 70,
          "addedAt": "2026-04-23T10:00:00.000Z"
        }
      ],
      "itemsSubtotal": 70,
      "totalAmount": 70,
      "status": "open",
      "notes": "",
      "openedBy": "6805f0047db7a0f4b3d53bf5",
      "closedBy": null,
      "invoiceId": null,
      "createdAt": "2026-04-23T09:30:00.000Z",
      "updatedAt": "2026-04-23T10:00:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Only active sessions can receive ordered items",
  "error": {
    "code": "SESSION_NOT_EDITABLE",
    "details": null
  }
}
```

### POST /api/sessions/from-reservation/:reservationId

Purpose:
Create an open session from a reservation that has already been checked in.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `reservationId` required, reservation ObjectId

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Session created from reservation successfully",
  "data": {
    "session": {
      "id": "680603527db7a0f4b3d53cb0",
      "roomId": "6805f0fe7db7a0f4b3d53c10",
      "reservationId": "680601117db7a0f4b3d53c50",
      "customerName": "Somchai",
      "customerPhone": "0812345678",
      "startTime": "2026-04-23T10:02:00.000Z",
      "endTime": null,
      "roomRateSnapshot": {
        "roomId": "6805f0fe7db7a0f4b3d53c10",
        "code": "A101",
        "name": "Room A101",
        "type": "standard",
        "hourlyRate": 300
      },
      "orderedItems": [],
      "itemsSubtotal": 0,
      "totalAmount": 0,
      "status": "open",
      "notes": "Birthday group",
      "openedBy": "6805f0047db7a0f4b3d53bf5",
      "closedBy": null,
      "invoiceId": null,
      "createdAt": "2026-04-23T10:02:00.000Z",
      "updatedAt": "2026-04-23T10:02:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Reservation must be checked in before creating a session",
  "error": {
    "code": "RESERVATION_NOT_READY_FOR_SESSION",
    "details": null
  }
}
```

### PATCH /api/sessions/:id/close (Partial)

Purpose:
Route exists, but the service does not close sessions here. It always rejects and instructs clients to use invoice checkout instead.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, session ObjectId

Query params:
None

Request body:
None

Implementation status:
Partial. The route is wired, validated, and controller-backed, but the service throws a fixed error instead of performing a close.

Example success response:

```json
{
  "success": true,
  "message": "Session closed successfully",
  "data": {
    "session": {
      "id": "example-not-returned-by-current-code"
    }
  },
  "meta": null
}
```

Note:
This success shape is controller-defined, but it is not reachable in the current implementation.

Example error response:

```json
{
  "success": false,
  "message": "Use the checkout endpoint to close a session and generate its invoice",
  "error": {
    "code": "SESSION_CLOSE_REQUIRES_CHECKOUT",
    "details": null
  }
}
```

## Products

### GET /api/products

Purpose:
List products with optional filters for category, active flag, and low-stock status.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
None

Query params:
- `category` optional, one of `drink`, `food`, `snack`, `other`
- `isActive` optional, `true` or `false`
- `lowStock` optional, `true` or `false`

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "68060a6f7db7a0f4b3d53cf1",
        "name": "Coca-Cola 330ml",
        "category": "drink",
        "price": 35,
        "stockQty": 24,
        "lowStockThreshold": 5,
        "isActive": true,
        "isLowStock": false,
        "createdAt": "2026-04-21T20:00:00.000Z",
        "updatedAt": "2026-04-21T20:00:00.000Z"
      }
    ],
    "total": 1
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": [
        {
          "field": "category",
          "message": "category must be one of: drink, food, snack, other"
        }
      ]
    }
  }
}
```

### GET /api/products/:id

Purpose:
Get one product by id.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, product ObjectId

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "product": {
      "id": "68060a6f7db7a0f4b3d53cf1",
      "name": "Coca-Cola 330ml",
      "category": "drink",
      "price": 35,
      "stockQty": 24,
      "lowStockThreshold": 5,
      "isActive": true,
      "isLowStock": false,
      "createdAt": "2026-04-21T20:00:00.000Z",
      "updatedAt": "2026-04-21T20:00:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Product not found",
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "details": null
  }
}
```

### POST /api/products

Purpose:
Create a product. If `stockQty > 0`, the backend also creates an initial `stock_in` movement.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin` only

Path params:
None

Query params:
None

Request body:
- `name` required, string `1-120` chars
- `category` required, `drink`, `food`, `snack`, `other`
- `price` required, number `>= 0`
- `stockQty` required, non-negative integer
- `lowStockThreshold` required, non-negative integer
- `isActive` optional boolean

Example success response:

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": "68060a6f7db7a0f4b3d53cf1",
      "name": "Coca-Cola 330ml",
      "category": "drink",
      "price": 35,
      "stockQty": 24,
      "lowStockThreshold": 5,
      "isActive": true,
      "isLowStock": false,
      "createdAt": "2026-04-21T20:00:00.000Z",
      "updatedAt": "2026-04-21T20:00:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": [
        {
          "field": "stockQty",
          "message": "stockQty must be a non-negative integer"
        }
      ]
    }
  }
}
```

### PUT /api/products/:id

Purpose:
Update product master data. This does not directly change stock quantity.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin` only

Path params:
- `id` required, product ObjectId

Query params:
None

Request body:
Any subset of:
- `name`
- `category`
- `price`
- `lowStockThreshold`
- `isActive`

Example success response:

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {
      "id": "68060a6f7db7a0f4b3d53cf1",
      "name": "Coca-Cola Zero 330ml",
      "category": "drink",
      "price": 38,
      "stockQty": 24,
      "lowStockThreshold": 6,
      "isActive": true,
      "isLowStock": false,
      "createdAt": "2026-04-21T20:00:00.000Z",
      "updatedAt": "2026-04-23T02:00:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Product not found",
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "details": null
  }
}
```

## Stock

### GET /api/products/:id/stock-movements

Purpose:
List stock movement history for one product.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, product ObjectId

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Stock movements retrieved successfully",
  "data": {
    "stockMovements": [
      {
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
        "createdAt": "2026-04-23T01:15:00.000Z",
        "updatedAt": "2026-04-23T01:15:00.000Z"
      }
    ],
    "total": 1
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Product not found",
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "details": null
  }
}
```

### PATCH /api/products/:id/stock-in

Purpose:
Increase stock for a product and record a `stock_in` movement.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin` only

Path params:
- `id` required, product ObjectId

Query params:
None

Request body:
- `quantity` required, positive integer
- `reason` optional string, max `300`

Example success response:

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
      "updatedAt": "2026-04-23T01:15:00.000Z"
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
      "createdAt": "2026-04-23T01:15:00.000Z",
      "updatedAt": "2026-04-23T01:15:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": [
        {
          "field": "quantity",
          "message": "quantity must be a positive integer"
        }
      ]
    }
  }
}
```

### PATCH /api/products/:id/stock-adjustment

Purpose:
Set stock to a new absolute quantity and record an `adjustment` movement.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin` only

Path params:
- `id` required, product ObjectId

Query params:
None

Request body:
- `newStockQty` required, non-negative integer
- `reason` optional string, max `300`

Example success response:

```json
{
  "success": true,
  "message": "Product stock adjusted successfully",
  "data": {
    "product": {
      "id": "68060a6f7db7a0f4b3d53cf1",
      "name": "Coca-Cola 330ml",
      "category": "drink",
      "price": 35,
      "stockQty": 18,
      "lowStockThreshold": 5,
      "isActive": true,
      "isLowStock": false,
      "createdAt": "2026-04-21T20:00:00.000Z",
      "updatedAt": "2026-04-23T01:20:00.000Z"
    },
    "stockMovement": {
      "id": "68060abc7db7a0f4b3d53cf8",
      "productId": "68060a6f7db7a0f4b3d53cf1",
      "movementType": "adjustment",
      "quantity": 18,
      "beforeQty": 36,
      "afterQty": 18,
      "reason": "Physical count correction",
      "createdBy": "6805eff97db7a0f4b3d53bf0",
      "sessionId": null,
      "invoiceId": null,
      "createdAt": "2026-04-23T01:20:00.000Z",
      "updatedAt": "2026-04-23T01:20:00.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "newStockQty must be different from the current stock",
  "error": {
    "code": "NO_STOCK_CHANGE",
    "details": null
  }
}
```

## Invoices

### POST /api/invoices/checkout/:sessionId

Purpose:
Checkout an open session, close it, generate an invoice, snapshot final room and product charges, and move the room to `cleaning`. Invoices are the source of truth for revenue.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `sessionId` required, session ObjectId

Query params:
None

Request body:
- `paymentStatus` optional, `unpaid` or `paid`, default `unpaid`
- `paymentMethod` optional, `cash`, `card`, `qr`, required when `paymentStatus` is `paid`
- `discountAmount` optional, non-negative number
- `taxAmount` optional, non-negative number
- `checkoutTime` optional, valid datetime, must be `>= session.startTime`
- `notes` optional string, max `500`

Example success response:

```json
{
  "success": true,
  "message": "Session checked out successfully",
  "data": {
    "invoice": {
      "id": "680612867db7a0f4b3d53d40",
      "sessionId": "680603527db7a0f4b3d53cb0",
      "invoiceNumber": "INV-20260423031500-0421",
      "paymentStatus": "paid",
      "paymentMethod": "qr",
      "paidAt": "2026-04-23T11:15:00.000Z",
      "paidBy": "6805f0047db7a0f4b3d53bf5",
      "lines": [
        {
          "_id": "680612867db7a0f4b3d53d41",
          "lineType": "room",
          "referenceId": "6805f0fe7db7a0f4b3d53c10",
          "code": "A101",
          "description": "Room A101 room charge",
          "quantity": 105,
          "unitPrice": 5,
          "lineTotal": 525
        },
        {
          "_id": "680612867db7a0f4b3d53d42",
          "lineType": "product",
          "referenceId": "68060a6f7db7a0f4b3d53cf1",
          "code": "",
          "description": "Coca-Cola 330ml",
          "quantity": 2,
          "unitPrice": 35,
          "lineTotal": 70
        }
      ],
      "roomCharge": 525,
      "productCharge": 70,
      "subtotal": 595,
      "discountAmount": 50,
      "taxAmount": 45.5,
      "grandTotal": 590.5,
      "notes": "Paid in full",
      "createdAt": "2026-04-23T11:15:01.000Z",
      "updatedAt": "2026-04-23T11:15:01.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Session already has an invoice",
  "error": {
    "code": "INVOICE_ALREADY_EXISTS",
    "details": null
  }
}
```

### GET /api/invoices/:id

Purpose:
Get one invoice by id.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
- `id` required, invoice ObjectId

Query params:
None

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Invoice retrieved successfully",
  "data": {
    "invoice": {
      "id": "680612867db7a0f4b3d53d40",
      "sessionId": "680603527db7a0f4b3d53cb0",
      "invoiceNumber": "INV-20260423031500-0421",
      "paymentStatus": "paid",
      "paymentMethod": "qr",
      "paidAt": "2026-04-23T11:15:00.000Z",
      "paidBy": "6805f0047db7a0f4b3d53bf5",
      "lines": [
        {
          "_id": "680612867db7a0f4b3d53d41",
          "lineType": "room",
          "referenceId": "6805f0fe7db7a0f4b3d53c10",
          "code": "A101",
          "description": "Room A101 room charge",
          "quantity": 105,
          "unitPrice": 5,
          "lineTotal": 525
        }
      ],
      "roomCharge": 525,
      "productCharge": 70,
      "subtotal": 595,
      "discountAmount": 50,
      "taxAmount": 45.5,
      "grandTotal": 590.5,
      "notes": "Paid in full",
      "createdAt": "2026-04-23T11:15:01.000Z",
      "updatedAt": "2026-04-23T11:15:01.000Z"
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Invoice not found",
  "error": {
    "code": "INVOICE_NOT_FOUND",
    "details": null
  }
}
```

## Reports

### GET /api/reports/revenue/daily

Purpose:
Return a daily revenue aggregate from PAID invoices only, filtered by `paidAt`.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
None

Query params:
- `date` required, valid date string

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Daily revenue report retrieved successfully",
  "data": {
    "report": {
      "period": "daily",
      "range": {
        "startDate": "2026-04-23",
        "endDateExclusive": "2026-04-24"
      },
      "totalRevenue": 590.5,
      "paidInvoiceCount": 1,
      "totalSessions": 1,
      "paymentMethodBreakdown": [
        {
          "paymentMethod": "cash",
          "totalRevenue": 0,
          "paidInvoiceCount": 0,
          "totalSessions": 0
        },
        {
          "paymentMethod": "card",
          "totalRevenue": 0,
          "paidInvoiceCount": 0,
          "totalSessions": 0
        },
        {
          "paymentMethod": "qr",
          "totalRevenue": 590.5,
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

Example error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": [
        {
          "field": "date",
          "message": "date must be a valid date string"
        }
      ]
    }
  }
}
```

### GET /api/reports/revenue/monthly

Purpose:
Return a monthly revenue aggregate from PAID invoices only, filtered by `paidAt`, including a daily series for charting.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
None

Query params:
- `year` required, valid 4-digit year
- `month` required, integer `1-12`

Request body:
None

Example success response:

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
      "totalRevenue": 4580.5,
      "paidInvoiceCount": 9,
      "totalSessions": 9,
      "paymentMethodBreakdown": [
        {
          "paymentMethod": "cash",
          "totalRevenue": 1450,
          "paidInvoiceCount": 3,
          "totalSessions": 3
        },
        {
          "paymentMethod": "card",
          "totalRevenue": 1290,
          "paidInvoiceCount": 2,
          "totalSessions": 2
        },
        {
          "paymentMethod": "qr",
          "totalRevenue": 1840.5,
          "paidInvoiceCount": 4,
          "totalSessions": 4
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
          "date": "2026-04-21",
          "totalRevenue": 1120,
          "paidInvoiceCount": 2,
          "totalSessions": 2
        },
        {
          "date": "2026-04-23",
          "totalRevenue": 590.5,
          "paidInvoiceCount": 1,
          "totalSessions": 1
        }
      ]
    }
  },
  "meta": null
}
```

Example error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": [
        {
          "field": "month",
          "message": "month must be an integer between 1 and 12"
        }
      ]
    }
  }
}
```

### GET /api/reports/revenue/range

Purpose:
Return a custom date-range revenue aggregate from PAID invoices only, filtered by `paidAt`.

Auth:
Required. `Authorization: Bearer <JWT>`

Role restrictions:
`admin`, `receptionist`

Path params:
None

Query params:
- `startDate` required, valid date string
- `endDate` required, valid date string

Request body:
None

Example success response:

```json
{
  "success": true,
  "message": "Range revenue report retrieved successfully",
  "data": {
    "report": {
      "period": "range",
      "range": {
        "startDate": "2026-04-01",
        "endDateExclusive": "2026-04-24"
      },
      "totalRevenue": 2870.5,
      "paidInvoiceCount": 6,
      "totalSessions": 6,
      "paymentMethodBreakdown": [
        {
          "paymentMethod": "cash",
          "totalRevenue": 900,
          "paidInvoiceCount": 2,
          "totalSessions": 2
        },
        {
          "paymentMethod": "card",
          "totalRevenue": 780,
          "paidInvoiceCount": 1,
          "totalSessions": 1
        },
        {
          "paymentMethod": "qr",
          "totalRevenue": 1190.5,
          "paidInvoiceCount": 3,
          "totalSessions": 3
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

Example error response:

```json
{
  "success": false,
  "message": "endDate must be later than or equal to startDate",
  "error": {
    "code": "INVALID_REPORT_RANGE",
    "details": null
  }
}
```

## Missing or Planned Endpoints

- Functional session close without checkout appears planned but is not implemented. `PATCH /api/sessions/:id/close` exists, but it always returns `SESSION_CLOSE_REQUIRES_CHECKOUT`. The current supported close path is `POST /api/invoices/checkout/:sessionId`.
- Invoice voiding appears planned at the model level but has no endpoint. `Invoice.paymentStatus` supports `void`, but there is no route/controller/service path to transition an invoice to `void`.
- Damaged stock handling appears planned at the model level but has no endpoint. `StockMovement.movementType` supports `damaged`, but only `stock_in`, `sale`, and `adjustment` are exposed through implemented flows.

## Summary

- Implemented endpoints found: `33` total backend endpoints, consisting of `32` API endpoints under `/api` plus `1` root operational endpoint at `/`.
- Modules with clear missing or partial endpoints: Sessions, Invoices, Stock.
Most important endpoints for frontend integration first:
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/rooms`
- `PATCH /api/rooms/:id/status`
- `POST /api/reservations`
- `PATCH /api/reservations/:id/check-in`
- `POST /api/sessions/walk-in`
- `POST /api/sessions/from-reservation/:reservationId`
- `PATCH /api/sessions/:id/items`
- `POST /api/invoices/checkout/:sessionId`
- `GET /api/reports/revenue/daily`
- `GET /api/reports/revenue/monthly`
- `GET /api/reports/revenue/range`
