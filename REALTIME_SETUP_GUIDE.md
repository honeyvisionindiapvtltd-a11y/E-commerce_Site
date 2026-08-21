# Real-time Implementation Setup Guide

## Overview
Complete real-time infrastructure for Flipkart-like e-commerce platform using Socket.io, including live order tracking, inventory management, admin dashboard, and notifications.

## Installation Requirements

### 1. Backend Dependencies
```bash
cd backend
npm install socket.io
```

### 2. Frontend Dependencies
```bash
cd frontend
npm install socket.io-client
```

## Architecture Components

### Backend Structure

#### Models
- **OrderTracking.js** - Complete order lifecycle with timeline
- **Inventory.js** - Real-time stock tracking and alerts

#### Services
- **realtimeService.js** - Socket.io server setup and event handling
- **inventoryService.js** - Stock management, price tracking, alerts
- **orderTrackingService.js** - Order operations (existing)
- **paymentService.js** - Payment processing (existing)

#### Routes
- **admin.js** - Admin dashboard endpoints
  - `GET /api/admin/dashboard` - Dashboard statistics
  - `GET /api/admin/orders` - List all orders with filters
  - `PUT /api/admin/orders/:orderId/status` - Update order status
  - `PUT /api/admin/orders/:orderId/delivery` - Update delivery info
  - `GET /api/admin/inventory/stats` - Inventory statistics
  - `GET /api/admin/inventory/low-stock` - Low stock products
  - `POST /api/admin/broadcast` - Send announcements
  - `POST /api/admin/notification` - Send notifications

- **inventory.js** - Inventory management endpoints
  - `GET /api/inventory/:productId` - Get product inventory
  - `POST /api/inventory/:productId/stock` - Update stock
  - `POST /api/inventory/:productId/price` - Update price
  - `GET /api/inventory/low-stock` - Low stock list
  - `POST /api/inventory/:productId/restock/schedule` - Schedule restock
  - `POST /api/inventory/:productId/restock/process` - Process restock

#### Server Integration
- Updated `server.js` with:
  - HTTP server creation for Socket.io
  - Socket.io initialization with CORS
  - New route mounting (admin, inventory)
  - Real-time server startup

### Frontend Structure

#### Hooks
- **useRealtimeUpdates.js** - Socket.io client connection and subscriptions
  - `subscribeToOrder()` - Listen to order updates
  - `subscribeToDelivery()` - Listen to delivery changes
  - `subscribeToInventory()` - Listen to stock changes
  - `subscribeToNotifications()` - Listen to all notifications
  - `subscribeToAdminNotifications()` - Admin-only notifications
  - `subscribeToAnnouncements()` - Listen to broadcasts
  - `sendMessage()` - Chat functionality

- **useNotifications.js** - Notification state management
  - Methods: `addNotification()`, `success()`, `error()`, `warning()`, `info()`

#### Components
- **NotificationComponents.jsx** - Reusable notification UI
  - `Toast` - Auto-dismissing notification
  - `NotificationBanner` - Prominent banner
  - `OrderStatusNotification` - Order updates
  - `DeliveryUpdateNotification` - Delivery progress
  - `InventoryAlertNotification` - Stock alerts
  - `PriceChangeNotification` - Price updates
  - `ChatMessageNotification` - Message alerts
  - `NotificationContainer` - Multiple notifications

#### Pages
- **AdminDashboard.jsx** - Real-time admin management
  - Dashboard with metrics
  - Orders table with filtering
  - Inventory alerts
  - Status update modal
  - Real-time notifications panel

## Socket.io Events

### Client → Server Events
- `user:login` - Register user connection
  - Payload: `userId`
  - Action: Join `user:userId` room

- `order:subscribe` - Subscribe to order updates
  - Payload: `orderId`
  - Action: Join `order:orderId` room

- `product:subscribe` - Subscribe to inventory updates
  - Payload: `productId`
  - Action: Join `product:productId` room

### Server → Client Events

#### Notifications (broadcast to users)
- `notification:orderStatus` - Order status changed
  ```json
  { "orderId": "ORD123", "status": "out_for_delivery", "timestamp": "2024-01-01T10:00:00Z" }
  ```

- `notification:delivery` - Delivery progress
  ```json
  { "orderId": "ORD123", "location": "In transit", "eta": "2 hours", "timestamp": "..." }
  ```

- `notification:inventory` - Stock/availability
  ```json
  { "productId": "PROD456", "status": "back_in_stock", "message": "..." }
  ```

- `notification:priceChange` - Price updates
  ```json
  { "productId": "PROD456", "oldPrice": 5000, "newPrice": 4500, "discount": 10 }
  ```

#### Admin Notifications (broadcast to admins)
- `admin:notification` - Admin alerts
  ```json
  { "message": "Low Stock Alert", "data": {...}, "level": "warning", "timestamp": "..." }
  ```

- `admin:orderUpdate` - Order changes for admins
  ```json
  { "orderId": "ORD123", "status": "delivered", "update": {...} }
  ```

#### Global Events
- `announcement` - Server-wide broadcasts
  ```json
  { "title": "Maintenance", "message": "...", "type": "info", "timestamp": "..." }
  ```

## Data Flow Examples

### Example 1: Order Status Update
1. Admin updates order status via PUT `/api/admin/orders/:orderId/status`
2. Backend updates OrderTracking document
3. Backend emits via Socket.io:
   - `order:statusUpdate` to `order:orderId` room (order subscribers)
   - `notification:orderStatus` to `user:userId` room (order owner)
   - `admin:orderUpdate` to `admins` room (all admins)
4. Frontend receives update in real-time
5. Components re-render with new status
6. Notification displayed to user

### Example 2: Inventory Stock Alert
1. Admin processes restock via POST `/api/inventory/:productId/restock/process`
2. inventoryService updates Inventory document
3. emitInventoryUpdate() broadcasts:
   - `inventory:update` to `product:productId` room
   - `notification:inventory` to `wishlist` room (for back-in-stock)
4. Frontend receives update
5. Display stock change, show notification to interested users

### Example 3: Price Change Notification
1. Admin updates price via POST `/api/inventory/:productId/price`
2. inventoryService tracks price history
3. emitPriceUpdate() broadcasts:
   - Price change to subscribed users
4. Frontend displays price alert
5. User notified of discount opportunity

## Testing the Real-time System

### 1. Local Testing
```bash
# Terminal 1 - Start backend
cd backend
npm start

# Terminal 2 - Start frontend
cd frontend
npm run dev

# Terminal 3 - Monitor WebSocket (optional)
# Open browser DevTools → Network → WS filter
```

### 2. Test Order Tracking
1. Open http://localhost:5173/orders
2. Open admin dashboard http://localhost:5173/admin
3. Click "Update Order Status" on any order
4. Status changes should appear in real-time on orders page

### 3. Test Inventory Updates
1. Navigate to inventory management
2. Update stock level
3. Observe real-time update in admin dashboard
4. Users with wishlist items see alerts

### 4. Test Admin Notifications
1. Multiple admin logins required
2. One admin updates order
3. Other admin receives notification in real-time

## Integration Checklist

- [x] Backend Socket.io initialization
- [x] Admin routes implementation
- [x] Inventory management system
- [x] Real-time service with event handlers
- [x] Frontend useRealtimeUpdates hook
- [x] Admin dashboard component
- [x] Notification components
- [ ] OrderTracking.jsx integration with useRealtimeUpdates
- [ ] Orders.jsx integration with useRealtimeUpdates
- [ ] Notification permission requests
- [ ] Browser notification API integration
- [ ] Auto-refresh intervals tuning
- [ ] Error handling and reconnection logic
- [ ] Session persistence for Socket.io connections

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://...
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env or vite.config.js)
```
VITE_API_URL=http://localhost:5000/api
```

## Performance Considerations

1. **Room Management**
   - Users automatically join `user:userId` room on login
   - Admins should join `admins` room
   - Optimize room broadcasts to reduce message volume

2. **Event Frequency**
   - Delivery updates: Every 5 minutes (configurable)
   - Inventory updates: On change (debounced)
   - Price updates: Batched every minute

3. **Scaling**
   - Use Socket.io adapter for multiple server instances
   - Redis adapter recommended for production
   - Namespace separation for different features

## Troubleshooting

### Socket.io Connection Fails
- Check FRONTEND_URL in backend .env
- Verify CORS is enabled: `cors: { origin: 'http://localhost:5173' }`
- Check browser console for connection errors

### Notifications Not Showing
- Verify subscribeToNotifications() is called in component
- Check Socket.io events in browser DevTools
- Ensure user is in correct room (`user:userId`)

### Real-time Updates Delayed
- Check network tab for WebSocket status
- Verify event handlers are registered
- Monitor server logs for emission errors

## Next Steps

1. **Integrate with Existing Components**
   - Add useRealtimeUpdates to OrderTracking.jsx
   - Add useRealtimeUpdates to Orders.jsx
   - Add NotificationContainer to App.jsx

2. **Browser Notifications**
   - Implement Notification API for desktop alerts
   - Request notification permissions

3. **Database Persistence**
   - Store notification history
   - Archive old orders and inventory logs

4. **Advanced Features**
   - Live chat support system
   - Product recommendation based on viewing
   - Bulk order operations
   - Order export/reporting

5. **Testing & Monitoring**
   - Unit tests for services
   - Integration tests for Socket.io events
   - Performance monitoring
   - Error tracking/logging

## Example Usage in Components

### Subscribing to Order Updates
```jsx
import useRealtimeUpdates from '../../hooks/useRealtimeUpdates';

function OrderTracking({ orderId }) {
  const { subscribeToOrder } = useRealtimeUpdates(userId);

  useEffect(() => {
    const unsubscribe = subscribeToOrder(orderId, (update) => {
      console.log('Order updated:', update);
      setOrder(prev => ({ ...prev, ...update }));
    });
    return unsubscribe;
  }, [orderId]);
}
```

### Using Notifications
```jsx
import useNotifications from '../../hooks/useNotifications';

function Component() {
  const { success, error } = useNotifications();

  const handleAction = async () => {
    try {
      // Action here
      success('Action completed!');
    } catch (err) {
      error('Action failed: ' + err.message);
    }
  };
}
```

---

**Last Updated**: 2024
**Status**: Ready for integration testing
**Maintainer**: Development Team