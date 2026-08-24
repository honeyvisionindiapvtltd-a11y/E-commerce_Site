import { createContext, useContext, useState, useEffect } from "react";

const UIContext = createContext(null);
const UI_STORAGE_KEY = "hv-ui-prefs";

const defaultNotifications = [
  { id: 1, title: "Order Updates", description: "Shipment and delivery status updates", enabled: true, icon: "mail" },
  { id: 2, title: "Promotions", description: "Offers, discounts, and new arrivals", enabled: true, icon: "message" },
  { id: 3, title: "Security Alerts", description: "Important account safety notifications", enabled: true, icon: "shield" },
  { id: 4, title: "App Push", description: "Instant alerts on your mobile device", enabled: false, icon: "phone" },
];

const defaultAccountSettings = [
  { id: 1, title: "Profile Visibility", description: "Choose who can view your public account details.", enabled: true },
  { id: 2, title: "Security Preferences", description: "Manage your login security and verification methods.", enabled: true },
  { id: 3, title: "Password & Access", description: "Update your password and recovery options.", enabled: true },
  { id: 4, title: "Alerts & Activity", description: "Track recent sign-ins and account activity.", enabled: false },
];

function readUIStore() {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) {
      return {
        notifications: defaultNotifications,
        accountSettings: defaultAccountSettings,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      notifications: Array.isArray(parsed.notifications) && parsed.notifications.length ? parsed.notifications : defaultNotifications,
      accountSettings: Array.isArray(parsed.accountSettings) && parsed.accountSettings.length ? parsed.accountSettings : defaultAccountSettings,
    };
  } catch {
    return {
      notifications: defaultNotifications,
      accountSettings: defaultAccountSettings,
    };
  }
}

function writeUIStore(ui) {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(ui));
  } catch {
    console.error("Failed to persist UI preferences to localStorage");
  }
}

export function UIProvider({ children }) {
  const [ui, setUI] = useState(readUIStore);

  useEffect(() => {
    writeUIStore(ui);
  }, [ui]);

  const toggleNotification = (id) => {
    setUI((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      ),
    }));
  };

  const toggleAccountSetting = (id) => {
    setUI((current) => ({
      ...current,
      accountSettings: current.accountSettings.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      ),
    }));
  };

  const value = {
    notifications: ui.notifications,
    accountSettings: ui.accountSettings,
    toggleNotification,
    toggleAccountSetting,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within UIProvider");
  return context;
}
