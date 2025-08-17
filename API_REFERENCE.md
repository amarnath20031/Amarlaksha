# Laksha API Reference

## Base URL
```
http://localhost:5000/api (Development)
https://your-domain.com/api (Production)
```

## Authentication
All API endpoints require session-based authentication. Users must be logged in via the web interface.

## Response Format
All API responses follow this structure:

### Success Response
```json
{
  "data": {}, // Response data
  "message": "Success message (optional)"
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE (optional)"
}
```

## Endpoints

### Authentication

#### GET /api/auth/user
Get current authenticated user information.

**Authentication:** Required

**Response:**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "profileImageUrl": "https://example.com/profile.jpg",
  "createdAt": "2025-07-16T12:00:00.000Z",
  "updatedAt": "2025-07-16T12:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: User not logged in

---

### Budget Management

#### GET /api/budget
Get user's current budget configuration.

**Authentication:** Required

**Response:**
```json
{
  "id": 1,
  "userId": "user123",
  "type": "monthly",
  "amount": "25000.00",
  "categoryBudgets": "{\"Food & Dining\":3750,\"Transport\":2250,\"Groceries\":3000,\"Entertainment\":1500,\"Health\":1500,\"Shopping\":1500,\"Petrol\":1800,\"Mobile Recharge\":450,\"Rent\":11250}",
  "createdAt": "2025-07-16T12:00:00.000Z",
  "updatedAt": "2025-07-16T12:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: User not logged in
- `404 Not Found`: No budget configured

#### POST /api/budget
Create or update user's budget.

**Authentication:** Required

**Request Body:**
```json
{
  "type": "monthly",
  "amount": "25000",
  "categoryBudgets": "{\"Food & Dining\":3750,\"Transport\":2250,\"Groceries\":3000,\"Entertainment\":1500,\"Health\":1500,\"Shopping\":1500,\"Petrol\":1800,\"Mobile Recharge\":450,\"Rent\":11250}"
}
```

**Request Schema:**
- `type`: string (required) - Budget type, currently only "monthly"
- `amount`: string (required) - Total budget amount as string
- `categoryBudgets`: string (required) - JSON string of category allocations

**Response:**
```json
{
  "id": 1,
  "userId": "user123",
  "type": "monthly",
  "amount": "25000.00",
  "categoryBudgets": "{\"Food & Dining\":3750,\"Transport\":2250,\"Groceries\":3000,\"Entertainment\":1500,\"Health\":1500,\"Shopping\":1500,\"Petrol\":1800,\"Mobile Recharge\":450,\"Rent\":11250}",
  "createdAt": "2025-07-16T12:00:00.000Z",
  "updatedAt": "2025-07-16T12:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: User not logged in
- `400 Bad Request`: Invalid request body
- `500 Internal Server Error`: Database error

---

### Expense Management

#### GET /api/expenses
Get user's expenses.

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Number of expenses to return (default: no limit)

**Response:**
```json
[
  {
    "id": 1,
    "userId": "user123",
    "amount": "500.00",
    "category": "Food & Dining",
    "description": "Lunch at restaurant",
    "method": "manual",
    "receiptUrl": null,
    "voiceNote": null,
    "date": "2025-07-16T12:00:00.000Z",
    "createdAt": "2025-07-16T12:00:00.000Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: User not logged in

#### POST /api/expenses
Create a new expense.

**Authentication:** Required

**Request Body:**
```json
{
  "amount": "500",
  "category": "Food & Dining",
  "description": "Lunch at restaurant",
  "method": "manual",
  "date": "2025-07-16T12:00:00.000Z"
}
```

**Request Schema:**
- `amount`: string (required) - Expense amount as string
- `category`: string (required) - Expense category
- `description`: string (optional) - Expense description
- `method`: string (required) - Entry method: "manual", "voice", or "receipt"
- `receiptUrl`: string (optional) - URL of receipt photo
- `voiceNote`: string (optional) - Voice note text
- `date`: string (required) - ISO date string

**Response:**
```json
{
  "id": 1,
  "userId": "user123",
  "amount": "500.00",
  "category": "Food & Dining",
  "description": "Lunch at restaurant",
  "method": "manual",
  "receiptUrl": null,
  "voiceNote": null,
  "date": "2025-07-16T12:00:00.000Z",
  "createdAt": "2025-07-16T12:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: User not logged in
- `400 Bad Request`: Invalid request body
- `500 Internal Server Error`: Database error

---

### Analytics

#### GET /api/analytics/spending
Get spending analytics including total spent and category breakdown.

**Authentication:** Required

**Query Parameters:**
- `startDate` (optional): Start date for analysis (ISO string)
- `endDate` (optional): End date for analysis (ISO string)

**Response:**
```json
{
  "totalSpent": 2500,
  "categorySpending": {
    "Food & Dining": 1000,
    "Transport": 500,
    "Groceries": 750,
    "Entertainment": 250
  },
  "period": {
    "startDate": "2025-07-01T00:00:00.000Z",
    "endDate": "2025-07-16T23:59:59.999Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: User not logged in

#### GET /api/analytics/daily-limit
Get adaptive daily spending limit based on remaining budget.

**Authentication:** Required

**Response:**
```json
{
  "dailyLimit": 857,
  "dailySpent": 150,
  "remainingBudget": 12000,
  "daysLeft": 14,
  "monthlyBudget": 25000,
  "totalSpent": 13000
}
```

**Response Schema:**
- `dailyLimit`: number - Calculated daily spending limit
- `dailySpent`: number - Amount spent today
- `remainingBudget`: number - Budget remaining for the month
- `daysLeft`: number - Days remaining in current month
- `monthlyBudget`: number - Total monthly budget
- `totalSpent`: number - Total spent this month

**Error Responses:**
- `401 Unauthorized`: User not logged in
- `404 Not Found`: No budget configured

---

### Notifications

#### GET /api/notifications
Get pending budget notifications for the user.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": 1,
    "userId": "user123",
    "budgetId": 1,
    "notificationType": "80_percent",
    "triggered": true,
    "triggerDate": "2025-07-16T12:00:00.000Z",
    "message": "You've spent 80% of your Food & Dining budget",
    "createdAt": "2025-07-16T12:00:00.000Z"
  }
]
```

**Notification Types:**
- `80_percent`: Warning when 80% of budget is spent
- `100_percent`: Alert when budget is exceeded
- `daily_limit`: Alert when daily spending limit is exceeded

**Error Responses:**
- `401 Unauthorized`: User not logged in

#### POST /api/notifications/{id}/read
Mark a notification as read.

**Authentication:** Required

**Parameters:**
- `id`: Notification ID

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

**Error Responses:**
- `401 Unauthorized`: User not logged in
- `404 Not Found`: Notification not found

---

## Error Codes

### Authentication Errors
- `401 Unauthorized`: User session expired or not logged in

### Validation Errors
- `400 Bad Request`: Invalid request body or parameters
- `422 Unprocessable Entity`: Valid format but invalid data

### Server Errors
- `500 Internal Server Error`: Database connection or server error
- `503 Service Unavailable`: Service temporarily unavailable

## Rate Limiting
Currently no rate limiting is implemented. In production, consider:
- 100 requests per minute per user
- 1000 requests per hour per user

## Data Types

### Amount Format
All monetary amounts are stored as strings with 2 decimal places:
```json
{
  "amount": "1500.00"  // Represents ₹1,500
}
```

### Date Format
All dates use ISO 8601 format:
```json
{
  "date": "2025-07-16T12:00:00.000Z"
}
```

### Category Budgets Format
Category budgets are stored as JSON strings:
```json
{
  "categoryBudgets": "{\"Food & Dining\":3750,\"Transport\":2250}"
}
```

## Examples

### Adding an Expense via cURL
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-cookie" \
  -d '{
    "amount": "500",
    "category": "Food & Dining",
    "description": "Lunch",
    "method": "manual",
    "date": "2025-07-16T12:00:00.000Z"
  }'
```

### Setting Budget via cURL
```bash
curl -X POST http://localhost:5000/api/budget \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-cookie" \
  -d '{
    "type": "monthly",
    "amount": "25000",
    "categoryBudgets": "{\"Food & Dining\":3750,\"Transport\":2250,\"Rent\":11250}"
  }'
```

### Getting Analytics via cURL
```bash
curl -X GET http://localhost:5000/api/analytics/spending \
  -H "Cookie: connect.sid=your-session-cookie"
```

---

*This API documentation is for Laksha v1.0. For updates and changes, refer to the changelog.*