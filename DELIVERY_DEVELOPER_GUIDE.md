# Delivery System Refactoring - Developer Quick Start

## What's Been Implemented

### Backend Foundation (✅ Complete)
1. **GPS Validation & History** (`deliveryLocationService.js`)
   - Haversine distance calculation
   - GPS jump detection
   - Accuracy threshold validation
   - Location history tracking in DB

2. **Delivery Events** (`deliveryEventService.js`)
   - Centralized event creation
   - Sequence numbering (prevents stale updates)
   - Socket.IO emission
   - Audit trail in database

3. **Status Transitions** (`deliveryStateMachine.js`)
   - Valid transition rules
   - State category helpers
   - Business logic enforcement

4. **Agent Presence** (`deliveryPresenceService.js`)
   - Online/offline tracking
   - Heartbeat recording
   - Grace period handling

5. **Unified GPS** (Frontend `unifiedGPSService.js`)
   - Single watcher per session
   - Subscription pattern per order
   - Automatic cleanup

### What Still Needs Implementation

#### Phase 1: Backend Integration
```javascript
// In deliveryController.js - startDelivery()
import { recordStatusTransition } from '../services/deliveryEventService.js';
import { validateAndTransition } from '../services/deliveryStateMachine.js';

// Replace order.status = "OUT_FOR_DELIVERY" with:
const updated = await validateAndTransition(order, "OUT_FOR_DELIVERY", {
  source: 'SYSTEM'
});
await recordStatusTransition(
  order._id,
  order.orderNumber,
  req.user._id,
  order.status,
  "OUT_FOR_DELIVERY"
);

// In markDelivered() and failDelivery() - similar pattern
```

#### Phase 2: Frontend Hook
```javascript
// Create frontend/src/hooks/useLiveDelivery.js
export const useLiveDelivery = (orderNumber, token) => {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState(null);
  const [eta, setEta] = useState(null);
  const [isLive, setIsLive] = useState(false);
  
  // Subscribe to Socket.IO events with sequence number handling
  useEffect(() => {
    const socket = getSocket();
    socket.on('delivery:statusUpdate', (event) => {
      if (event.sequence > lastSequence) {
        updateState(event);
        lastSequence = event.sequence;
      }
    });
  }, []);
  
  return { location, status, eta, isLive };
};
```

#### Phase 3: Heartbeat Endpoint
```javascript
// Add to deliveryController.js
export const sendHeartbeat = async (req, res) => {
  try {
    const agent = await recordAgentHeartbeat(req.user._id);
    return res.json({ success: true, agent });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Add to deliveryRoutes.js
router.post("/heartbeat", protect, requireDeliveryAgent, sendHeartbeat);
```

#### Phase 4: Admin Real-Time Updates
```javascript
// Modify realtimeService.js connection handler
if (socket.user.role === 'admin') {
  socket.on('admin:subscribe-deliveries', async () => {
    const deliveries = await Order.find({
      status: { $in: ['OUT_FOR_DELIVERY', 'NEARBY', 'ARRIVED'] }
    });
    // Send current state + subscribe to updates
    socket.emit('delivery:activeList', deliveries);
  });
}
```

---

## How to Use Each Service

### 1. Location Service
```javascript
import { processLocationUpdate } from '../services/deliveryLocationService.js';

// In location update endpoint
const result = await processLocationUpdate(
  agentId,
  orderId,
  orderNumber,
  {
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    accuracy: req.body.accuracy,
    heading: req.body.heading,
    speed: req.body.speed,
    timestamp: new Date()
  },
  order.shippingAddress
);

// Result includes validation, history record, and geofencing
```

### 2. Event Service
```javascript
import { createDeliveryEvent, recordStatusTransition } from '../services/deliveryEventService.js';

// Create custom event
await createDeliveryEvent({
  orderId: order._id,
  orderNumber: order.orderNumber,
  agentId: req.user._id,
  eventType: 'DELIVERY_COMPLETED',
  previousStatus: 'ARRIVED',
  currentStatus: 'DELIVERED',
  payload: { proof: 'photo_url', notes: 'Left at door' }
});

// Or use helper
await recordStatusTransition(orderId, orderNumber, agentId, oldStatus, newStatus);
```

### 3. State Machine
```javascript
import { validateAndTransition } from '../services/deliveryStateMachine.js';

// Safely transition order status
const updated = await validateAndTransition(order, newStatus, {
  source: 'DELIVERY_AGENT',
  notes: 'Delivery completed',
  reason: 'CUSTOMER_UNAVAILABLE'  // For failed delivery
});

// Throws if invalid transition
```

### 4. Presence Service
```javascript
import { recordAgentHeartbeat, getAgentPresence } from '../services/deliveryPresenceService.js';

// Keep agent marked as active
await recordAgentHeartbeat(agentId);

// Check presence status
const presence = await getAgentPresence(agentId);
console.log(presence.status); // 'ONLINE', 'IDLE', 'STALE', 'OFFLINE'
```

### 5. Unified GPS (Frontend)
```javascript
import unifiedGPSService from './services/unifiedGPSService.js';

// Subscribe order to GPS updates
const unsubscribe = unifiedGPSService.subscribe(
  orderNumber,
  (location) => {
    console.log('New location:', location);
    // Send to backend
  }
);

// Unsubscribe when order complete
unsubscribe();

// Or stop all watching
unifiedGPSService.destroy();
```

---

## Integration Checklist

### 1. Update Order Creation
- [ ] Initialize order with correct status
- [ ] Record ORDER_ASSIGNED event on assignment
- [ ] Use deliveryEventService for all status changes

### 2. Update Order Tracking
- [ ] Use sequence numbers from delivery events
- [ ] Ignore stale events (sequence <= lastSequence)
- [ ] Implement Socket.IO polling fallback

### 3. Update Admin Dashboard
- [ ] Subscribe to delivery updates
- [ ] Listen for milestone events
- [ ] Display agent presence status
- [ ] Show location freshness indicator

### 4. Add Heartbeat
- [ ] Frontend sends heartbeat every 30 seconds
- [ ] Backend records in deliveryPresenceService
- [ ] Mark agent offline if no heartbeat for 2 minutes

### 5. Testing
- [ ] Test single GPS watcher with multiple orders
- [ ] Test status transitions (valid only)
- [ ] Test Socket.IO reconnection
- [ ] Test geofencing milestones
- [ ] Test presence tracking

---

## Configuration Customization

Edit `backend/config/deliveryConfig.js`:

```javascript
export const DELIVERY_CONFIG = {
  GPS: {
    MIN_UPDATE_INTERVAL_MS: 5000,      // Increase for fewer updates
    MIN_DISTANCE_METERS: 50,           // Increase to reduce sensitivity
    MAX_ACCURACY_THRESHOLD_METERS: 100, // Increase to allow poorer signals
    MAX_SPEED_KMH: 120,                // Adjust for delivery vehicle type
  },
  
  GEOFENCING: {
    APPROACHING_ZONE_METERS: 2000,     // Trigger "approaching" at 2km
    NEARBY_ZONE_METERS: 500,           // Trigger "nearby" at 500m
    ARRIVED_ZONE_METERS: 100,          // Trigger "arrived" at 100m
  },
  
  PRESENCE: {
    OFFLINE_GRACE_PERIOD_MS: 30000,    // Wait 30 seconds before marking offline
    HEARTBEAT_TIMEOUT_MS: 120000,      // Mark offline if no heartbeat for 2 min
  },
};
```

---

## Database Indexes (Run Once)

```javascript
// In MongoDB shell or migration script

// DeliveryLocationHistory
db.DeliveryLocationHistory.createIndex({ "agentId": 1, "timestamp": -1 });
db.DeliveryLocationHistory.createIndex({ "orderId": 1, "timestamp": -1 });
db.DeliveryLocationHistory.createIndex({ "location": "2dsphere" });

// DeliveryEvent
db.DeliveryEvent.createIndex({ "orderId": 1, "sequence": 1 });
db.DeliveryEvent.createIndex({ "eventTimestamp": -1 });

// User (for agent geospatial queries)
db.User.createIndex({ "currentLocation": "2dsphere" });
```

---

## Debugging Tips

### Check GPS Issues
```javascript
// In browser console during delivery
unifiedGPSService.getCurrentLocation();  // Get current location
unifiedGPSService.subscribers;            // See subscribed orders
```

### Check Event Sequences
```javascript
// In MongoDB
db.DeliveryEvent.find({ orderNumber: "HV1001" }).sort({ sequence: 1 });
// Should see monotonically increasing sequence numbers
```

### Check Agent Presence
```javascript
// In backend
const presence = await getAgentPresence(agentId);
console.log(presence.status); // Should be 'ONLINE', 'IDLE', or 'OFFLINE'
```

### Check Socket.IO Connection
```javascript
// In browser console
// For order tracking
socket.on('delivery:statusUpdate', console.log);
socket.on('delivery:locationUpdate', console.log);

// For admin
socket.on('delivery:activeList', console.log);
```

---

## Common Errors & Fixes

### "GPS already being watched"
- Don't call `startWatching()` multiple times
- Service automatically starts on first `subscribe()`

### "Invalid status transition"
- Check VALID_TRANSITIONS in deliveryStateMachine.js
- Can only move forward in delivery lifecycle
- Reset agent fields for cancellation

### "Sequence number out of order"
- This is expected with Socket.IO - ignore stale events
- Frontend must check `event.sequence > lastSequence`

### "Agent marked offline unexpectedly"
- Check heartbeat is being sent every 30 seconds
- Increase OFFLINE_GRACE_PERIOD_MS if network is flaky

---

## Next Developer Tasks

1. **Integrate state machine** into all order status updates
2. **Create useLiveDelivery hook** for customer tracking
3. **Add heartbeat endpoint** and frontend caller
4. **Update admin dashboard** with real-time delivery list
5. **Test end-to-end** flow
6. **Deploy and monitor** for any issues

---

## Additional Resources

- See `DELIVERY_REFACTOR_REPORT.md` for full architecture
- Models: `backend/models/DeliveryEvent.js`, `DeliveryLocationHistory.js`
- Services: `backend/services/delivery*.js`
- Frontend: `frontend/src/services/unifiedGPSService.js`

---

**Questions?** Check the implementation report or examine the service files directly.
