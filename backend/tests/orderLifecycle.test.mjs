import assert from "node:assert/strict";
import { canCustomerCancelOrder } from "../services/orderLifecycleService.js";

const statuses = {
  allowed: ["ORDER_PLACED", "PROCESSING", "PACKED"],
  blocked: ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "FAILED_DELIVERY"],
};

for (const status of statuses.allowed) assert.equal(canCustomerCancelOrder({ status }).allowed, true, `${status} should be cancellable`);
for (const status of statuses.blocked) assert.equal(canCustomerCancelOrder({ status }).allowed, false, `${status} should be blocked`);
assert.match(canCustomerCancelOrder({ status: "DELIVERED" }).reason, /delivered.*cannot be cancelled/i);
console.log("Order lifecycle cancellation rules passed");
