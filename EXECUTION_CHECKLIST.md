# Order Tracking Implementation - Execution Checklist

## Pre-Flight Checklist (Before Running)

### Backend Verification
- [ ] Check `backend/server.js` has all route imports:
  ```javascript
  import trackingRoutes from './routes/tracking.js';
  import paymentRoutes from './routes/payment.js';
  import authRoutes from './routes/auth.js';
  ```

- [ ] Check `backend/server.js` has route mounting:
  ```javascript
  app.use('/api/tracking', trackingRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/auth', authRoutes);
  ```

- [ ] Check these backend files exist:
  - [ ] `backend/models/OrderTracking.js`
  - [ ] `backend/services/orderTrackingService.js`
  - [ ] `backend/routes/tracking.js`
  - [ ] `backend/routes/payment.js`
  - [ ] `backend/routes/auth.js`

- [ ] Check `.env` file has:
  ```
  MONGO_URI=mongodb://localhost:27017/ecommerce
  PORT=5000
  ```

### Frontend Verification
- [ ] Check `frontend/src/pages/OrderTracking.jsx` exists and is updated
- [ ] Check `frontend/src/pages/Orders.jsx` exists and has search/filter
- [ ] Check `frontend/src/App.jsx` has these routes:
  ```javascript
  <Route path="/orders" element={<Orders />} />
  <Route path="/tracking" element={<OrderTracking />} />
  ```

- [ ] Check environment setup:
  - [ ] If using .env.local: `VITE_API_URL=http://localhost:5000/api`
  - [ ] Or check `frontend/vite.config.js` for API configuration

---

## Startup Sequence

### Step 1: Start MongoDB (if running locally)
```bash
# Windows (in a separate terminal)
mongod

# Linux/Mac
mongod --dbpath /usr/local/var/mongodb

# OR use MongoDB Atlas (cloud)
# Update MONGO_URI in backend/.env
```
**Status**: ✓ When you see "Waiting for connections on port 27017"

### Step 2: Start Backend Server
```bash
# Open Terminal 1
cd backend
npm install
npm start
```
**Expected Output**:
```
Server running on port 5000
```
**Verify**: `curl http://localhost:5000/health`
Should return: `{"status":"OK","message":"Backend is running"}`

### Step 3: Start Frontend Development Server
```bash
# Open Terminal 2
cd frontend
npm install
npm run dev
```
**Expected Output**:
```
Local: http://localhost:5173/
```
**Verify**: Open http://localhost:5173 in browser

---

## Testing Your Implementation

### Test 1: Create Sample Tracking Record (Backend)
```bash
curl -X POST http://localhost:5000/api/tracking/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST001",
    "userId": "user123",
    "orderStatus": "order_placed",
    "orderDate": "2024-01-15T10:30:00Z",
    "paymentMethod": "cod",
    "paymentStatus": "pending",
    "totalAmount": 5000,
    "items": [{
      "productId": "prod1",
      "productName": "Test Product",
      "quantity": 2,
      "price": 2500
    }]
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "tracking": {
    "orderId": "TEST001",
    "userId": "user123",
    ...
  }
}
```

### Test 2: Verify Frontend Can Access Backend

**In Browser Console** (at http://localhost:5173):
```javascript
// Test if API is reachable
fetch('http://localhost:5000/api/tracking/TEST001')
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(e => console.error(e))
```

**Expected Output**: Should show tracking object without CORS errors

### Test 3: Test Orders List Page
1. Navigate to: http://localhost:5173/orders
2. Should see either:
   - List of orders from local context
   - "No orders yet" message if no local orders
3. Try search box (type anything)
4. Try filters (click status buttons)

**Troubleshooting**:
- If page is blank: Check browser console for errors
- If no orders show: Create local orders first in context
- If API returns error: Verify backend is running and MONGO_URI is correct

### Test 4: Test Order Tracking Page
1. Create a tracking record (from Test 1)
2. Navigate to: http://localhost:5173/tracking?order=TEST001
3. Should see:
   - Order status timeline
   - "No delivery info" if not set
   - Order summary with total
4. Try updating delivery via API:
```bash
curl -X POST http://localhost:5000/api/tracking/TEST001/delivery \
  -H "Content-Type: application/json" \
  -d '{
    "expectedDeliveryDate": "2024-01-20T00:00:00Z",
    "estimatedDeliveryTime": "2:00 PM - 6:00 PM",
    "carrier": "Express Delivery",
    "trackingNumber": "TRK123456"
  }'
```
5. Refresh page and verify delivery info appears

### Test 5: Test Return Submission
1. Update tracking status to "delivered":
```bash
curl -X POST http://localhost:5000/api/tracking/TEST001/status \
  -H "Content-Type: application/json" \
  -d '{
    "newStatus": "delivered",
    "description": "Delivered successfully"
  }'
```
2. Refresh tracking page
3. "Initiate Return" button should appear
4. Click it, enter reason, and submit
5. Verify return status updates

### Test 6: Test Review Submission
1. After delivery (Test 5), refresh tracking page
2. "Rate Your Order" button should appear
3. Select rating (1-5 stars)
4. Enter comment (optional)
5. Click "Submit Review"
6. Verify review displays on page

---

## Common Issues & Quick Fixes

### Issue: "Cannot GET /api/tracking/user/..."
**Cause**: Backend server not running or routes not mounted
**Fix**: 
1. Check terminal: Is backend running?
2. Run: `curl http://localhost:5000/health`
3. If fails, restart backend with: `cd backend && npm start`

### Issue: Blank page at /orders
**Cause**: API error or component rendering issue
**Fix**:
1. Open DevTools (F12) → Console tab
2. Look for error messages
3. Check Network tab → see if API calls succeed
4. If API fails, check MongoDB connection

### Issue: "CORS error" in browser console
**Cause**: Frontend and backend on different origins
**Fix**:
1. Verify `backend/server.js` has: `app.use(cors());`
2. If custom CORS needed, update to:
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```
3. Restart backend

### Issue: "Cannot find module" error in backend
**Cause**: Dependencies not installed
**Fix**:
```bash
cd backend
npm install
npm start
```

### Issue: MongoDB connection error
**Cause**: MongoDB not running or URI incorrect
**Fix**:
1. If local MongoDB:
   - Windows: Open Services, start MongoDB
   - Linux: `sudo systemctl start mongod`
   - Mac: `brew services start mongodb-community`
2. If using MongoDB Atlas:
   - Get connection string from Atlas dashboard
   - Update `MONGO_URI` in `backend/.env`
   - Restart backend

### Issue: Frontend API calls timeout
**Cause**: API URL not configured correctly
**Fix**:
1. Check `frontend/.env` or `.env.local`:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
2. Restart frontend dev server: `npm run dev`

---

## Success Criteria

✅ You're done when:

1. **Backend**:
   - [ ] Server starts without errors
   - [ ] `curl http://localhost:5000/health` returns OK
   - [ ] Can create tracking record via POST /api/tracking/create
   - [ ] Can retrieve tracking via GET /api/tracking/:orderId
   - [ ] Can list user orders via GET /api/tracking/user/:userId

2. **Frontend**:
   - [ ] http://localhost:5173 loads without errors
   - [ ] Navigate to /orders page
   - [ ] Orders list displays (or "No orders" message)
   - [ ] Search/filter work
   - [ ] Click order navigates to tracking page
   - [ ] Tracking page displays timeline and delivery info
   - [ ] Can submit return and review

3. **Integration**:
   - [ ] No console errors or warnings
   - [ ] Network tab shows successful API calls
   - [ ] Loading spinners appear during API calls
   - [ ] Data updates after API responses

---

## Next Steps After Success

### Immediate (Day 1)
- [ ] Test with real order data from your database
- [ ] Verify all API endpoints work with your data
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile (use browser DevTools responsive mode)

### Short-term (Week 1)
- [ ] Implement auto-tracking creation on order placement
- [ ] Add user authentication check to tracking endpoints
- [ ] Set up database backups
- [ ] Create admin dashboard for updating order statuses

### Medium-term (Month 1)
- [ ] Implement real-time tracking (WebSocket)
- [ ] Add automated notifications (email, SMS)
- [ ] Create order analytics dashboard
- [ ] Set up monitoring and alerting

### Long-term (Quarter 1)
- [ ] Multi-language support
- [ ] Payment integration testing
- [ ] Invoice PDF generation and email
- [ ] Customer support integration
- [ ] Mobile app development

---

## Important Files Changed

### Backend
- ✅ `backend/server.js` - Updated with new route imports and mounting
- ✅ `backend/models/OrderTracking.js` - New model created
- ✅ `backend/services/orderTrackingService.js` - New service created
- ✅ `backend/routes/tracking.js` - New routes created

### Frontend
- ✅ `frontend/src/pages/OrderTracking.jsx` - Completely rewritten
- ✅ `frontend/src/pages/Orders.jsx` - Enhanced with search/filter
- ✅ `frontend/src/App.jsx` - Added /tracking route

### Documentation
- ✅ `backend/ORDER_TRACKING_GUIDE.md` - Detailed implementation guide
- ✅ `ARCHITECTURE.md` - System architecture and reference

---

## Quick Reference Commands

```bash
# Start everything
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev

# Terminal 3 (optional - if running MongoDB locally)
mongod

# Test API
curl http://localhost:5000/health

# Test create tracking
curl -X POST http://localhost:5000/api/tracking/create \
  -H "Content-Type: application/json" \
  -d '{"orderId":"TEST001","userId":"user1","orderStatus":"order_placed","orderDate":"2024-01-15T10:30:00Z","paymentMethod":"cod","paymentStatus":"pending","totalAmount":5000,"items":[]}'

# Open frontend
# Browser: http://localhost:5173

# Test pages
http://localhost:5173/orders                    # Orders list
http://localhost:5173/tracking?order=TEST001   # Order tracking
http://localhost:5173/order-tracking?order=TEST001  # Alternative URL
```

---

## Documentation Location

| Document | Path | Purpose |
|----------|------|---------|
| Order Tracking Guide | `backend/ORDER_TRACKING_GUIDE.md` | Complete implementation guide |
| Architecture Reference | `ARCHITECTURE.md` | System design and components |
| Payment Guide | `backend/PAYMENT_INVOICE_VALIDATION_GUIDE.md` | Payment system docs |
| Integration Guide | `backend/INTEGRATION_GUIDE.md` | Setup and integration steps |
| This Checklist | `EXECUTION_CHECKLIST.md` | Quick start and troubleshooting |

---

**Status**: Ready to Execute ✅  
**Estimated Time**: 15-30 minutes to full functionality  
**Need Help?**: Check troubleshooting section above
