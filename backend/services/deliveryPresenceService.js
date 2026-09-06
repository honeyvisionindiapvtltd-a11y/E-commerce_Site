/**
 * Delivery Agent Presence Service
 * Tracks online/offline status and heartbeats
 * Manages agent availability and session tracking
 */

import User from '../models/User.js';
import { DELIVERY_CONFIG } from '../config/deliveryConfig.js';
import { recordAgentPresence } from './deliveryEventService.js';

// In-memory presence tracking
const agentPresence = new Map(); // agentId -> { isOnline, lastSeenAt, connectedAt, heartbeatTimeout }

/**
 * Mark agent as online
 */
export const markAgentOnline = async (agentId, socketId = null) => {
  try {
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'delivery_agent') {
      throw new Error('Delivery agent not found');
    }

    // Update agent presence
    agent.isOnline = true;
    agent.connectedAt = new Date();
    agent.lastSeenAt = new Date();
    await agent.save();

    // Update in-memory presence
    const presence = agentPresence.get(String(agentId)) || {};
    agentPresence.set(String(agentId), {
      ...presence,
      isOnline: true,
      connectedAt: new Date(),
      lastSeenAt: new Date(),
      socketId,
    });

    // Record presence event
    await recordAgentPresence(agentId, true);

    if (process.env.NODE_ENV !== 'production') {
      console.debug(`Agent ${agentId} is now ONLINE`);
    }

    return agent;
  } catch (error) {
    console.error('Failed to mark agent online:', error);
    throw error;
  }
};

/**
 * Mark agent as offline with grace period
 */
export const markAgentOffline = async (agentId, withGracePeriod = true) => {
  try {
    const gracePeriod = withGracePeriod
      ? DELIVERY_CONFIG.PRESENCE.OFFLINE_GRACE_PERIOD_MS
      : 0;

    // If grace period, check again after delay
    if (gracePeriod > 0) {
      const presence = agentPresence.get(String(agentId));
      if (presence?.reconnectTimeout) {
        clearTimeout(presence.reconnectTimeout);
      }

      const reconnectTimeout = setTimeout(async () => {
        const currentPresence = agentPresence.get(String(agentId));
        if (currentPresence?.isOnline === false) {
          // Still offline after grace period, mark as permanently offline
          await actuallyMarkOffline(agentId);
        }
      }, gracePeriod);

      const presence_data = agentPresence.get(String(agentId)) || {};
      agentPresence.set(String(agentId), {
        ...presence_data,
        isOnline: false,
        disconnectedAt: new Date(),
        reconnectTimeout,
      });
    } else {
      // Immediate offline
      await actuallyMarkOffline(agentId);
    }
  } catch (error) {
    console.error('Failed to mark agent offline:', error);
  }
};

/**
 * Actually mark agent as offline (after grace period or immediately)
 */
const actuallyMarkOffline = async (agentId) => {
  try {
    const agent = await User.findById(agentId);
    if (!agent) return;

    agent.isOnline = false;
    agent.disconnectedAt = new Date();
    await agent.save();

    agentPresence.set(String(agentId), {
      isOnline: false,
      lastSeenAt: agent.lastSeenAt,
      disconnectedAt: new Date(),
    });

    // Record presence event
    await recordAgentPresence(agentId, false);

    if (process.env.NODE_ENV !== 'production') {
      console.debug(`Agent ${agentId} is now OFFLINE`);
    }
  } catch (error) {
    console.error('Failed to actually mark agent offline:', error);
  }
};

/**
 * Record agent heartbeat
 * Keeps agent marked as online and updates last seen time
 */
export const recordAgentHeartbeat = async (agentId) => {
  try {
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'delivery_agent') {
      throw new Error('Delivery agent not found');
    }

    const now = new Date();

    // Update agent
    agent.lastSeenAt = now;
    agent.lastLocationUpdate = now;

    // Only update if offline to avoid too frequent saves
    if (!agent.isOnline) {
      agent.isOnline = true;
      agent.connectedAt = now;
    }

    await agent.save();

    // Update in-memory presence
    const presence = agentPresence.get(String(agentId)) || {};
    agentPresence.set(String(agentId), {
      ...presence,
      isOnline: true,
      lastSeenAt: now,
      lastHeartbeat: now,
    });

    // Clear any pending offline timeout
    if (presence.reconnectTimeout) {
      clearTimeout(presence.reconnectTimeout);
    }

    return agent;
  } catch (error) {
    console.error('Failed to record agent heartbeat:', error);
    throw error;
  }
};

/**
 * Get agent presence status
 */
export const getAgentPresence = async (agentId) => {
  try {
    const agent = await User.findById(agentId).select(
      'isOnline lastSeenAt connectedAt disconnectedAt lastLocationUpdate'
    ).lean();

    if (!agent) {
      return null;
    }

    const locationAge = agent.lastLocationUpdate
      ? Date.now() - new Date(agent.lastLocationUpdate).getTime()
      : null;

    const lastSeenAge = agent.lastSeenAt
      ? Date.now() - new Date(agent.lastSeenAt).getTime()
      : null;

    // Determine presence status
    let status = 'OFFLINE';
    if (agent.isOnline) {
      if (
        locationAge &&
        locationAge <= DELIVERY_CONFIG.LOCATION_FRESHNESS_THRESHOLDS.LIVE_MAX_MS
      ) {
        status = 'ONLINE';
      } else if (
        locationAge &&
        locationAge <= DELIVERY_CONFIG.LOCATION_FRESHNESS_THRESHOLDS.DELAYED_MAX_MS
      ) {
        status = 'IDLE';
      } else {
        status = 'STALE';
      }
    }

    return {
      agentId,
      isOnline: agent.isOnline,
      status,
      lastSeenAt: agent.lastSeenAt,
      connectedAt: agent.connectedAt,
      disconnectedAt: agent.disconnectedAt,
      lastLocationUpdate: agent.lastLocationUpdate,
      locationAge,
      lastSeenAge,
    };
  } catch (error) {
    console.error('Failed to get agent presence:', error);
    throw error;
  }
};

/**
 * Get presence status for multiple agents
 */
export const getAgentsPresence = async (agentIds) => {
  try {
    const agents = await User.find(
      { _id: { $in: agentIds }, role: 'delivery_agent' },
      'isOnline lastSeenAt connectedAt disconnectedAt lastLocationUpdate'
    ).lean();

    return agents.map((agent) => {
      const locationAge = agent.lastLocationUpdate
        ? Date.now() - new Date(agent.lastLocationUpdate).getTime()
        : null;

      let status = 'OFFLINE';
      if (agent.isOnline) {
        if (locationAge <= DELIVERY_CONFIG.LOCATION_FRESHNESS_THRESHOLDS.LIVE_MAX_MS) {
          status = 'ONLINE';
        } else if (
          locationAge <= DELIVERY_CONFIG.LOCATION_FRESHNESS_THRESHOLDS.DELAYED_MAX_MS
        ) {
          status = 'IDLE';
        } else {
          status = 'STALE';
        }
      }

      return {
        agentId: String(agent._id),
        isOnline: agent.isOnline,
        status,
        lastSeenAt: agent.lastSeenAt,
        connectedAt: agent.connectedAt,
        disconnectedAt: agent.disconnectedAt,
        lastLocationUpdate: agent.lastLocationUpdate,
        locationAge,
      };
    });
  } catch (error) {
    console.error('Failed to get agents presence:', error);
    throw error;
  }
};

/**
 * Get all online agents
 */
export const getOnlineAgents = async () => {
  try {
    const agents = await User.find(
      { role: 'delivery_agent', isOnline: true },
      'name phone isOnline lastSeenAt currentLocation'
    ).lean();

    return agents;
  } catch (error) {
    console.error('Failed to get online agents:', error);
    throw error;
  }
};

/**
 * Clean up presence data on server restart
 */
export const initializePresenceTracking = () => {
  // Clear all agents' online status on startup
  User.updateMany(
    { role: 'delivery_agent', isOnline: true },
    {
      $set: {
        isOnline: false,
        disconnectedAt: new Date(),
      },
    }
  ).catch((error) => {
    console.error('Failed to initialize presence tracking:', error);
  });
};

/**
 * Clean up presence tracking resources
 */
export const cleanupPresenceTracking = () => {
  // Clear all timeouts
  agentPresence.forEach((presence) => {
    if (presence.reconnectTimeout) {
      clearTimeout(presence.reconnectTimeout);
    }
  });
  agentPresence.clear();
};

export default {
  markAgentOnline,
  markAgentOffline,
  recordAgentHeartbeat,
  getAgentPresence,
  getAgentsPresence,
  getOnlineAgents,
  initializePresenceTracking,
  cleanupPresenceTracking,
};
