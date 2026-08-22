# Order Tracking System - Architecture & Quick Reference

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  /orders              │  OrderTracking.jsx                       │
│  /tracking?order=ID   │  - OrderTrackingTimeline                │
│                       │  - DeliveryInfo                          │
│                       │  - InstallationStatus                    │
│                       │  - OrderItems                            │
│                       │  - OrderSummary                          │
│                       │  - ReturnInfo                            │
│                       │  - ReviewSection                         │
└────────────────────────────────────────────────────────────────┬┘
                              │
                    API Calls (fetch)
                              │
┌────────────────────────────────────────────────────────────────┴┘
│                      Backend (Express.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  /api/tracking/create                                            │
│  /api/tracking/:orderId                                          │
│  /api/tracking/user/:userId                                      │
│  /api/tracking/:orderId/status                                   │
│  /api/tracking/:orderId/delivery                                 │
│  /api/tracking/:orderId/installation                             │
│  /api/tracking/:orderId/location                                 │
│  /api/tracking/:orderId/return                                   │
│  /api/tracking/:orderId/review                                   │
│  /api/tracking/:orderId/cancel                                   │
│  /api/tracking/stats/:userId                                     │
└────────────────────────────────────────────────────────────────┬┘
                              │
                 Mongoose ORM (MongoDB driver)
                              │
┌────────────────────────────────────────────────────────────────┴┘
│                         MongoDB                                 │
├─────────────────────────────────────────────────────────────────┤
│  Collections:                                                    │
│  - ordertrackings (order tracking records)                      │
│  - payments (payment transactions)                              │
│  - invoices (invoice records)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
OrderTracking.jsx (Main Page)
├── OrderTrackingTimeline
│   └── Timeline Events with Icons & Timestamps
├── DeliveryInfo
│   ├── Expected Delivery Date
│   ├── Carrier & Tracking
│   └── Delivery Agent Details
├── InstallationStatus
│   ├── Scheduled Date/Time
│   └── Technician Details
├── OrderItems
│   └── Product List with Status
├── OrderSummary
│   ├── Order ID & Date
│   ├── Payment Status
│   └── Total Amount
├── ReturnInfo
│   └── Return/Refund Form & Status
└── ReviewSection
    └── Rating & Comment Form
```

## Data Flow Diagram

```
User Place Order
        ↓
Order Created in Context
        ↓
(TODO) POST /api/tracking/create ← Tracking Record Created
        ↓
User Views /orders Page
        ↓
GET /api/tracking/user/:userId ← Fetch User Orders
        ↓
Display Orders List with Search/Filter
        ↓
User Clicks Order
        ↓
Navigate to /tracking?order=ID
        ↓
GET /api/tracking/:orderId ← Fetch Order Tracking Details
        ↓
Display Tracking Timeline, Delivery, Installation, etc.
        ↓
User Submits Review/Return
        ↓
POST /api/tracking/:orderId/review or /return
        ↓
Tracking Record Updated in Database
        ↓
Page Refreshes with Updated Data
```

## State Management

### Frontend (React Context)
```javascript
CommerceContext.jsx
├── orders: [] - Local order list
├── user: {} - Current user info
├── cart: [] - Shopping cart
├── isLoggedIn: Boolean
├── placeOrder() - (TODO: integrate with API)
├── login() - User authentication
├── register() - New user registration
└── fetchOrders() - Fetch user orders
```

### Component State (React Hooks)
```javascript
OrderTracking.jsx
├── tracking: {} - Tracking data from API
├── loading: Boolean - API fetch status
├── error: String - Error messages

Orders.jsx
├── allOrders: [] - All user orders
├── filteredOrders: [] - Filtered view
├── loading: Boolean - API fetch status
├── searchQuery: String - Search input
└── filterStatus: String - Current filter
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "tracking": {
    "orderId": "ORD123",
    "orderStatus": "delivered",
    "totalAmount": 5000,
    "timeline": [{...}],
    "delivery": {...},
    "installation": {...},
    "return": {...},
    "review": {...}
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Order not found"
}
```

### List Response
```json
{
  "success": true,
  "orders": [
    {orderId: "ORD123", ...},
    {orderId: "ORD124", ...}
  ]
}
```

## Key Features Matrix

| Feature | Status | Component | API Endpoint | Notes |
|---------|--------|-----------|--------------|-------|
| List orders | ✅ Done | Orders.jsx | GET /user/:userId | With search/filter |
| View tracking | ✅ Done | OrderTracking.jsx | GET /:orderId | Auto-refresh 30s |
| Timeline | ✅ Done | OrderTrackingTimeline | GET /:orderId | Visual progression |
| Delivery tracking | ✅ Done | DeliveryInfo | POST /:orderId/delivery | Agent & tracking |
| Installation | ✅ Done | InstallationStatus | POST /:orderId/installation | Scheduling |
| Return order | ✅ Done | ReturnInfo | POST /:orderId/return | Form submission |
| Submit review | ✅ Done | ReviewSection | POST /:orderId/review | 1-5 stars + comment |
| Auto-create tracking | ❌ TODO | - | POST /create | On order placement |
| Admin dashboard | ❌ TODO | - | - | Status updates |
| Real-time updates | ❌ TODO | - | WebSocket | Live tracking |
| Notifications | ❌ TODO | - | - | Email/SMS/WhatsApp |

## Critical Integration Points

### 1. Order Creation → Tracking Creation
**File**: `frontend/src/context/CommerceContext.jsx`
```javascript
// In placeOrder() function, after creating order:
const trackingResponse = await fetch(`${API_BASE}/tracking/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: order.id,
    userId: user.id,
    orderStatus: 'order_placed',
    orderDate: new Date(),
    paymentMethod: order.paymentMethod,
    paymentStatus: 'pending',
    totalAmount: order.total,
    items: order.items,
    address: order.address
  })
});
```

### 2. API Base URL Configuration
**File**: `frontend/src/pages/OrderTracking.jsx` & `Orders.jsx`
```javascript
const API_BASE = import.meta.env.VITE_API_URL || '/api';
// Usage: fetch(`${API_BASE}/tracking/:orderId`)

// Must set in .env or .env.local:
VITE_API_URL=http://localhost:5000/api
```

### 3. Route Configuration
**File**: `frontend/src/App.jsx`
```javascript
<Route path="/orders" element={<Orders />} />
<Route path="/tracking" element={<OrderTracking />} />
<Route path="/order-tracking" element={<OrderTracking />} />
```

### 4. Server Routes Mounting
**File**: `backend/server.js`
```javascript
import trackingRoutes from './routes/tracking.js';
app.use('/api/tracking', trackingRoutes);
```

## Database Indexes

### OrderTracking Collection
```javascript
// Index 1: Fast lookup by orderId
db.ordertrackings.createIndex({ orderId: 1 }, { unique: true })

// Index 2: User order history
db.ordertrackings.createIndex({ userId: 1, orderDate: -1 })

// Index 3: Status filtering
db.ordertrackings.createIndex({ orderStatus: 1, deliveredDate: -1 })

// Index 4: Payment status filtering
db.ordertrackings.createIndex({ paymentStatus: 1, createdAt: -1 })
```

## Performance Considerations

### Frontend
- **Auto-refresh**: Every 30 seconds (adjust in OrderTracking.jsx line ~180)
- **Debouncing**: Search input has built-in debounce via filter logic
- **Pagination**: Orders list shows all by default, add limit param for large datasets

### Backend
- **Query optimization**: Use indexes for userId, orderStatus, orderDate
- **Caching**: Consider Redis for frequently accessed orders
- **Rate limiting**: Add rate limiting for API endpoints

### Database
- **Indexes**: Critical for user orders and status queries
- **Sharding**: If > 1M orders, shard on userId
- **Archival**: Move old orders to archive collection

## Error Handling

### Common Scenarios
1. **Order not found**: Return 404, show "Order not found" message
2. **API timeout**: Show loading spinner, retry after 5s
3. **Network error**: Display error alert with retry button
4. **Invalid data**: Show validation error to user
5. **Server error**: Show generic error, log to console

### User-Facing Messages
```javascript
// In OrderTracking.jsx and Orders.jsx
if (error) {
  return <div className="error">{error}</div>;
}
if (loading) {
  return <div className="loading">Loading...</div>;
}
if (!data) {
  return <div className="empty">No data found</div>;
}
```

## Security Considerations

### Frontend
- ✅ Use environment variables for API URL (not hardcoded)
- ⚠️ TODO: Add CSRF protection for form submissions
- ⚠️ TODO: Validate user data before API calls
- ⚠️ TODO: Add request timeout handling

### Backend
- ✅ MongoDB connection string in environment variable
- ✅ CORS configured in server.js
- ⚠️ TODO: Add authentication middleware
- ⚠️ TODO: Validate userId matches current user
- ⚠️ TODO: Add rate limiting
- ⚠️ TODO: Add input sanitization

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] MongoDB connection successful
- [ ] GET /health returns {status: 'OK'}
- [ ] POST /api/tracking/create creates record
- [ ] GET /api/tracking/:orderId retrieves data
- [ ] GET /api/tracking/user/:userId returns array
- [ ] /orders page loads and displays orders
- [ ] Search filters orders correctly
- [ ] Status filter works for delivered orders
- [ ] Click order navigates to /tracking
- [ ] Timeline displays with status icons
- [ ] Delivery info shows correctly
- [ ] Installation details display (if applicable)
- [ ] Return button appears for delivered orders
- [ ] Review section appears for delivered orders
- [ ] Submit return works and updates UI
- [ ] Submit review works and updates UI
- [ ] Auto-refresh updates tracking data
- [ ] Error messages display on API failures
- [ ] Loading spinners show during API calls

## Useful Commands

### Start Services
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: MongoDB
mongod --dbpath /path/to/data
```

### API Testing
```bash
# Check health
curl http://localhost:5000/health

# Create tracking
curl -X POST http://localhost:5000/api/tracking/create \
  -H "Content-Type: application/json" \
  -d '{"orderId":"123","userId":"u1",...}'

# Get tracking
curl http://localhost:5000/api/tracking/ORD123

# Get user orders
curl http://localhost:5000/api/tracking/user/u1
```

### Database
```bash
# Connect to MongoDB
mongosh

# List collections
show collections

# Query orders
db.ordertrackings.findOne()

# Count orders
db.ordertrackings.countDocuments()

# View indexes
db.ordertrackings.getIndexes()
```

---

**Maintained by**: Development Team  
**Last Updated**: 2024-01-15  
**Status**: ✅ Core Features Complete, Integration Pending
