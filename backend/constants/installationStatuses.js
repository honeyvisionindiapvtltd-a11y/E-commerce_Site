/**
 * Installation Booking Status Constants
 * Defines valid statuses and status transition rules
 */

export const INSTALLATION_STATUSES = {
  // Initial state
  BOOKED: 'BOOKED',

  // Confirmation flow
  CONFIRMED: 'CONFIRMED',
  
  // Agent assignment flow
  ASSIGNED: 'ASSIGNED',
  AGENT_ACCEPTED: 'AGENT_ACCEPTED',
  AGENT_DECLINED: 'AGENT_DECLINED',
  
  // Execution flow
  ON_THE_WAY: 'ON_THE_WAY',
  ARRIVED: 'ARRIVED',
  INSTALLATION_IN_PROGRESS: 'INSTALLATION_IN_PROGRESS',
  INSTALLATION_COMPLETED: 'INSTALLATION_COMPLETED',
  
  // Failure/Cancellation states
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

/**
 * Valid status transitions
 * Format: { fromStatus: [toStatus1, toStatus2, ...] }
 */
export const VALID_STATUS_TRANSITIONS = {
  [INSTALLATION_STATUSES.BOOKED]: [
    INSTALLATION_STATUSES.CONFIRMED,
    INSTALLATION_STATUSES.ASSIGNED,
    INSTALLATION_STATUSES.CANCELLED,
  ],
  [INSTALLATION_STATUSES.CONFIRMED]: [
    INSTALLATION_STATUSES.ASSIGNED,
    INSTALLATION_STATUSES.CANCELLED,
  ],
  [INSTALLATION_STATUSES.ASSIGNED]: [
    INSTALLATION_STATUSES.AGENT_ACCEPTED,
    INSTALLATION_STATUSES.AGENT_DECLINED,
    INSTALLATION_STATUSES.CANCELLED,
  ],
  [INSTALLATION_STATUSES.AGENT_DECLINED]: [
    INSTALLATION_STATUSES.ASSIGNED, // Reassign to another agent
    INSTALLATION_STATUSES.CANCELLED,
  ],
  [INSTALLATION_STATUSES.AGENT_ACCEPTED]: [
    INSTALLATION_STATUSES.ON_THE_WAY,
    INSTALLATION_STATUSES.CANCELLED,
  ],
  [INSTALLATION_STATUSES.ON_THE_WAY]: [
    INSTALLATION_STATUSES.ARRIVED,
    INSTALLATION_STATUSES.FAILED,
  ],
  [INSTALLATION_STATUSES.ARRIVED]: [
    INSTALLATION_STATUSES.INSTALLATION_IN_PROGRESS,
    INSTALLATION_STATUSES.FAILED,
  ],
  [INSTALLATION_STATUSES.INSTALLATION_IN_PROGRESS]: [
    INSTALLATION_STATUSES.INSTALLATION_COMPLETED,
    INSTALLATION_STATUSES.FAILED,
  ],
  [INSTALLATION_STATUSES.INSTALLATION_COMPLETED]: [],
  [INSTALLATION_STATUSES.FAILED]: [
    INSTALLATION_STATUSES.ASSIGNED, // Reassign for retry
  ],
  [INSTALLATION_STATUSES.CANCELLED]: [],
};

/**
 * Status display labels
 */
export const STATUS_LABELS = {
  [INSTALLATION_STATUSES.BOOKED]: 'Booking Requested',
  [INSTALLATION_STATUSES.CONFIRMED]: 'Booking Confirmed',
  [INSTALLATION_STATUSES.ASSIGNED]: 'Agent Assigned',
  [INSTALLATION_STATUSES.AGENT_ACCEPTED]: 'Agent Accepted',
  [INSTALLATION_STATUSES.AGENT_DECLINED]: 'Agent Declined',
  [INSTALLATION_STATUSES.ON_THE_WAY]: 'On The Way',
  [INSTALLATION_STATUSES.ARRIVED]: 'Agent Arrived',
  [INSTALLATION_STATUSES.INSTALLATION_IN_PROGRESS]: 'Installation In Progress',
  [INSTALLATION_STATUSES.INSTALLATION_COMPLETED]: 'Installation Completed',
  [INSTALLATION_STATUSES.FAILED]: 'Installation Failed',
  [INSTALLATION_STATUSES.CANCELLED]: 'Booking Cancelled',
};

/**
 * Status descriptions
 */
export const STATUS_DESCRIPTIONS = {
  [INSTALLATION_STATUSES.BOOKED]: 'Customer has submitted an installation booking request',
  [INSTALLATION_STATUSES.CONFIRMED]: 'Admin has confirmed the booking and preferred date/time',
  [INSTALLATION_STATUSES.ASSIGNED]: 'Admin has assigned an installation agent',
  [INSTALLATION_STATUSES.AGENT_ACCEPTED]: 'Installation agent has accepted the booking',
  [INSTALLATION_STATUSES.AGENT_DECLINED]: 'Installation agent declined the booking',
  [INSTALLATION_STATUSES.ON_THE_WAY]: 'Installation agent is traveling to customer location',
  [INSTALLATION_STATUSES.ARRIVED]: 'Installation agent has arrived at customer location',
  [INSTALLATION_STATUSES.INSTALLATION_IN_PROGRESS]: 'Installation is being performed',
  [INSTALLATION_STATUSES.INSTALLATION_COMPLETED]: 'Installation completed successfully',
  [INSTALLATION_STATUSES.FAILED]: 'Installation was not completed. Reason recorded.',
  [INSTALLATION_STATUSES.CANCELLED]: 'Installation booking was cancelled',
};

/**
 * Status colors for UI
 */
export const STATUS_COLORS = {
  [INSTALLATION_STATUSES.BOOKED]: 'amber',
  [INSTALLATION_STATUSES.CONFIRMED]: 'blue',
  [INSTALLATION_STATUSES.ASSIGNED]: 'purple',
  [INSTALLATION_STATUSES.AGENT_ACCEPTED]: 'indigo',
  [INSTALLATION_STATUSES.AGENT_DECLINED]: 'red',
  [INSTALLATION_STATUSES.ON_THE_WAY]: 'orange',
  [INSTALLATION_STATUSES.ARRIVED]: 'cyan',
  [INSTALLATION_STATUSES.INSTALLATION_IN_PROGRESS]: 'lime',
  [INSTALLATION_STATUSES.INSTALLATION_COMPLETED]: 'green',
  [INSTALLATION_STATUSES.FAILED]: 'red',
  [INSTALLATION_STATUSES.CANCELLED]: 'slate',
};

/**
 * Check if status transition is valid
 */
const LEGACY_INSTALLATION_STATUS_ALIASES = {
  requested: INSTALLATION_STATUSES.BOOKED,
  confirmed: INSTALLATION_STATUSES.CONFIRMED,
  assigned: INSTALLATION_STATUSES.ASSIGNED,
  accepted: INSTALLATION_STATUSES.AGENT_ACCEPTED,
  declined: INSTALLATION_STATUSES.AGENT_DECLINED,
  in_progress: INSTALLATION_STATUSES.INSTALLATION_IN_PROGRESS,
  completed: INSTALLATION_STATUSES.INSTALLATION_COMPLETED,
  cancelled: INSTALLATION_STATUSES.CANCELLED,
  failed: INSTALLATION_STATUSES.FAILED,
};

export const normalizeInstallationStatus = (status) => {
  if (!status) return status;
  const normalized = String(status).trim();
  return LEGACY_INSTALLATION_STATUS_ALIASES[normalized.toLowerCase()] || normalized;
};

export const isValidStatusTransition = (fromStatus, toStatus) => {
  const canonicalFrom = normalizeInstallationStatus(fromStatus);
  const canonicalTo = normalizeInstallationStatus(toStatus);
  const validTransitions = VALID_STATUS_TRANSITIONS[canonicalFrom];
  return Boolean(validTransitions && validTransitions.includes(canonicalTo));
};

/**
 * Get allowed next statuses for a given status
 */
export const getAllowedNextStatuses = (currentStatus) => {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
};
