import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

const ProfileContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_URL || "/api";

const defaultProfile = {
  fullName: "",
  email: "",
  phone: "",
  alternatePhone: "",
  dateOfBirth: "",
  gender: "",
  location: "",
  city: "",
  state: "",
  pinCode: "",
  country: "India",
  address: "",
  emergencyContact: "",
  bio: "",
  memberSince: "",
};

function sanitizeProfile(profile = {}) {
  return Object.entries(defaultProfile).reduce(
    (clean, [key, defaultValue]) => ({
      ...clean,
      [key]: profile[key] != null && profile[key] !== defaultValue ? profile[key] : "",
    }),
    {}
  );
}

function normalizeSavedAddress(address) {
  return {
    ...address,
    id: address.id || address._id,
    userId: address.userId || null,
    type: address.type || (address.addressType === "WORK" ? "Office" : address.addressType === "OTHER" ? "Other" : "Home"),
    label: address.label || `${address.addressType || "Home"} Address`,
    fullName: address.fullName || address.name || "",
    address: address.address || address.addressLine1 || "",
    pin: address.pin || address.pincode || address.postalCode || address.pinCode || "",
  };
}

export function ProfileProvider({ children }) {
  const { authToken, user } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const requestJson = useCallback(
    async (path, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };

      const response = await fetch(`${API_BASE}${path}`, {
        headers,
        ...options,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Request failed");
      }

      return data;
    },
    [authToken]
  );

  // Fetch profile, addresses, and payment methods when user logs in
  useEffect(() => {
    if (!authToken || !user?.id) {
      setProfile(defaultProfile);
      setAddresses([]);
      setPaymentMethods([]);
      return;
    }

    let ignore = false;

    const loadProfileData = async () => {
      try {
        const [profileData, addressesData] = await Promise.all([
          requestJson("/auth/profile").catch(() => ({})),
          requestJson("/users/addresses").catch(() => ({})),
        ]);

        if (ignore) return;

        if (profileData.profile) {
          setProfile(sanitizeProfile(profileData.profile));
        } else if (profileData.user) {
          const p = { ...defaultProfile, fullName: profileData.user.name, email: profileData.user.email, phone: profileData.user.phone };
          setProfile(sanitizeProfile(p));
        }

        if (addressesData.addresses) {
          setAddresses(addressesData.addresses.map(normalizeSavedAddress));
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
        if (ignore) return;
        setProfile(defaultProfile);
      }
    };

    loadProfileData();

    return () => {
      ignore = true;
    };
  }, [authToken, user?.id, requestJson]);

  const updateProfile = useCallback(
    async (nextProfile) => {
      if (!authToken) {
        throw new Error("Unauthorized. Please log in to update your profile.");
      }

      const payload = {
        ...nextProfile,
        location:
          nextProfile.location ||
          [nextProfile.city || profile.city, nextProfile.state || profile.state].filter(Boolean).join(", "),
      };

      const data = await requestJson("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updatedProfile = { ...profile, ...data.profile };
      setProfile(sanitizeProfile(updatedProfile));

      return data;
    },
    [authToken, profile, requestJson]
  );

  const fetchProfile = useCallback(async () => {
    if (!authToken) return null;
    const data = await requestJson("/auth/profile");
    if (data.profile) setProfile(sanitizeProfile(data.profile));
    return data;
  }, [authToken, requestJson]);

  const fetchAddresses = useCallback(async () => {
    if (!authToken) return [];
    try {
      const data = await requestJson("/users/addresses");
      const nextAddresses = (data.addresses || []).map(normalizeSavedAddress);
      setAddresses(nextAddresses);
      return nextAddresses;
    } catch {
      return addresses;
    }
  }, [authToken, addresses, requestJson]);

  const addAddress = useCallback(
    async (newAddress) => {
      const data = await requestJson("/users/addresses", {
        method: "POST",
        body: JSON.stringify({
          ...newAddress,
          addressType: newAddress.addressType || (newAddress.type === "Office" ? "WORK" : newAddress.type === "Other" ? "OTHER" : "HOME"),
          addressLine1: newAddress.addressLine1 || newAddress.address,
          pincode: newAddress.pincode || newAddress.pin,
        }),
      });
      const nextAddresses = (data.addresses || [data.address]).map(normalizeSavedAddress);
      setAddresses(nextAddresses);
      return normalizeSavedAddress(data.address);
    },
    [requestJson]
  );

  const updateAddress = useCallback(
    async (id, nextAddress) => {
      const data = await requestJson(`/users/addresses/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({
          ...nextAddress,
          addressType: nextAddress.addressType || (nextAddress.type === "Office" ? "WORK" : nextAddress.type === "Other" ? "OTHER" : "HOME"),
          addressLine1: nextAddress.addressLine1 || nextAddress.address,
          pincode: nextAddress.pincode || nextAddress.pin,
        }),
      });
      setAddresses((data.addresses || []).map(normalizeSavedAddress));
      return normalizeSavedAddress(data.address);
    },
    [requestJson]
  );

  const removeAddress = useCallback(
    async (id) => {
      const data = await requestJson(`/users/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
      setAddresses((data.addresses || []).map(normalizeSavedAddress));
    },
    [requestJson]
  );

  const setDefaultAddress = useCallback(
    async (id) => {
      const data = await requestJson(`/users/addresses/${encodeURIComponent(id)}/default`, { method: "PATCH" });
      setAddresses((data.addresses || []).map(normalizeSavedAddress));
    },
    [requestJson]
  );

  const validateAddress = useCallback(
    async (address) => {
      const pin = address.pin || address.pincode || address.postalCode;
      try {
        const response = await fetch(`${API_BASE}/delivery/check/${encodeURIComponent(pin)}`);
        return response.ok ? response.json() : { success: false };
      } catch {
        return { success: false };
      }
    },
    []
  );

  const addPaymentMethod = useCallback((card) => {
    setPaymentMethods((current) => [...current, { ...card, id: card.id || Date.now() }]);
  }, []);

  const removePaymentMethod = useCallback((id) => {
    setPaymentMethods((current) => current.filter((card) => card.id !== id));
  }, []);

  const setDefaultPaymentMethod = useCallback((id) => {
    setPaymentMethods((current) =>
      current.map((card) => ({
        ...card,
        default: card.id === id,
      }))
    );
  }, []);

  const value = {
    profile,
    addresses,
    paymentMethods,
    fetchProfile,
    updateProfile,
    fetchAddresses,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    validateAddress,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
}
