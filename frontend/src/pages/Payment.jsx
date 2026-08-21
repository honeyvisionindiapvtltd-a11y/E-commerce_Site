import { useState } from "react";
import { useCommerce } from "../context/CommerceContext";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  ShoppingCart,
  MapPin,
  CreditCard,
  Check,
  Smartphone,
  Building2,
  Wallet,
  Percent,
  ShieldCheck,
  PackageCheck,
  Truck,
  Headphones,
  LockKeyhole,
  ArrowRight,
  ChevronRight,
  Tag,
  Copy,
  CheckCircle2,
  X,
  Globe,
  BadgeCheck,
  RefreshCcw,
  Zap,
  ShieldAlert,
} from "lucide-react";

import { computeTotals } from "../lib/orderTotals";

/* ============================================================
   PAYMENT PAGE
============================================================ */

const Payment = () => {
  const {
    cart,
    products,
    profile,
    addresses,
    user,
    placeOrder,
    couponApplied,
  } = useCommerce();

  const location = useLocation();
  const navigate = useNavigate();

  const checkoutState = location.state || {};
  const orderIdFromState = checkoutState.orderId;

  /* ============================================================
     ADDRESS
  ============================================================ */

  const userAddresses = user?.id
    ? addresses.filter((address) => address.userId === user.id)
    : [];

  const defaultAddress =
    userAddresses.find((address) => address.isDefault) ||
    userAddresses[0] ||
    addresses.find((address) => address.isDefault) ||
    {};

  const selectedAddress = checkoutState.address || defaultAddress;

  const selectedSlot =
    checkoutState.slot || "Tomorrow, 10:00 AM - 1:00 PM";

  /* ============================================================
     PAYMENT METHOD
  ============================================================ */

  const validPaymentMethods = [
    "cod",
    "upi",
    "card",
    "razorpay",
    "netbanking",
    "wallet",
    "emi",
    "later",
  ];

  const selectedPaymentMethod = validPaymentMethods.includes(
    checkoutState.paymentMethod
  )
    ? checkoutState.paymentMethod
    : checkoutState.paymentMethod === "online"
      ? "card"
      : "razorpay";

  const [orderId, setOrderId] = useState(
    () =>
      orderIdFromState ||
      `HV${Date.now().toString().slice(-8)}`
  );

  const [paymentMethod, setPaymentMethod] = useState(
    selectedPaymentMethod
  );

  const [upiId, setUpiId] = useState("");
  const [selectedUpiApp, setSelectedUpiApp] = useState("");
  const [secureShipping, setSecureShipping] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [preservedItems, setPreservedItems] = useState(null);
  const [paymentError, setPaymentError] = useState("");

  const razorpayMinimumAmount = 100;
  const isRazorpayBlocked = ["razorpay", "card", "netbanking", "wallet", "emi", "later", "upi"].includes(paymentMethod) && total < razorpayMinimumAmount;

  /* ============================================================
     BILLING INFORMATION
  ============================================================ */

  const billingName =
    selectedAddress.fullName ||
    selectedAddress.name ||
    defaultAddress.fullName ||
    profile?.fullName ||
    "";

  const billingPhone =
    selectedAddress.phone ||
    defaultAddress.phone ||
    profile?.phone ||
    "";

  const billingAddressLine =
    selectedAddress.address ||
    selectedAddress.line1 ||
    defaultAddress.address ||
    profile?.address ||
    "";

  const billingCity =
    selectedAddress.city ||
    defaultAddress.city ||
    profile?.city ||
    "";

  const billingState =
    selectedAddress.state ||
    defaultAddress.state ||
    profile?.state ||
    "";

  const billingPin =
    selectedAddress.pin ||
    selectedAddress.pinCode ||
    defaultAddress.pin ||
    profile?.pinCode ||
    "";

  const billingCountry =
    selectedAddress.country ||
    defaultAddress.country ||
    profile?.country ||
    "";

  /* ============================================================
     CART PRODUCTS
  ============================================================ */

  const currentCheckoutItems = cart
    .map((item) => {
      const product = products.find(
        (product) => product.id === item.productId
      );

      return product
        ? {
            ...item,
            product,
          }
        : null;
    })
    .filter(Boolean);

  const missingCartItems = cart
    .filter(
      (item) =>
        !products.some(
          (product) => product.id === item.productId
        )
    )
    .map((item) => item.productId);

  const hasMissingProducts = missingCartItems.length > 0;

  const checkoutItems =
    preservedItems || currentCheckoutItems;

  /* ============================================================
     TOTALS
  ============================================================ */

  const {
    subtotal: subtotalCalc,
    installationFee,
    shipping,
    discount,
    insurance,
    total: totalCalc,
  } = computeTotals(checkoutItems, {
    coupon: couponApplied,
    secureShipping,
  });

  const subtotal = subtotalCalc;
  const total = totalCalc;

  const itemCount = checkoutItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  /* ============================================================
     EMPTY CART
  ============================================================ */

  if (!checkoutItems.length) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] px-5 py-20 text-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff7dd]">
            <ShoppingCart
              size={38}
              className="text-[#f4b400]"
            />
          </div>

          <h1 className="mt-6 text-3xl font-extrabold text-[#071426]">
            Nothing to pay for
          </h1>

          <p className="mt-3 text-gray-500">
            Your cart is empty or no active order was found.
          </p>

          <Link
            to="/cart"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#f4b400] hover:text-[#071426]"
          >
            Go to Cart
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  /* ============================================================
     MISSING PRODUCT
  ============================================================ */

  if (hasMissingProducts) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] px-5 py-20 text-center">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-10 shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <X size={38} className="text-red-500" />
          </div>

          <h1 className="mt-6 text-3xl font-extrabold text-[#071426]">
            Cart item unavailable
          </h1>

          <p className="mt-3 text-gray-500">
            Some items in your cart are no longer available
            or could not be matched with the current product
            catalog.
          </p>

          <pre className="mt-5 overflow-auto rounded-xl bg-red-50 p-4 text-left text-sm text-red-600">
            Missing product IDs:
            {"\n"}
            {missingCartItems.join(", ")}
          </pre>

          <Link
            to="/cart"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#071426] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#f4b400] hover:text-[#071426]"
          >
            Review Cart
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  /* ============================================================
     PAYMENT METHODS
  ============================================================ */

  const paymentMethods = [
    {
      id: "upi",
      title: "UPI",
      subtitle: "Google Pay, PhonePe, Paytm & more",
      icon: Smartphone,
      recommended: true,
    },
    {
      id: "card",
      title: "Debit / Credit Card",
      subtitle: "Visa, Mastercard, RuPay & more",
      icon: CreditCard,
    },
    {
      id: "netbanking",
      title: "Net Banking",
      subtitle: "Pay using your preferred bank",
      icon: Building2,
    },
    {
      id: "wallet",
      title: "Wallets",
      subtitle: "Pay using popular wallets",
      icon: Wallet,
    },
    {
      id: "emi",
      title: "EMI / Buy Now Pay Later",
      subtitle: "Convert your purchase into easy EMIs",
      icon: Percent,
    },
    {
      id: "cod",
      title: "Cash on Delivery",
      subtitle: "Pay when your order arrives",
      icon: PackageCheck,
    },
  ];

  /* ============================================================
     UPI APPS
  ============================================================ */

  const upiApps = [
    {
      id: "googlepay",
      name: "Google Pay",
      logo: "G",
    },
    {
      id: "phonepe",
      name: "PhonePe",
      logo: "P",
    },
    {
      id: "paytm",
      name: "Paytm",
      logo: "₹",
    },
    {
      id: "bhim",
      name: "BHIM",
      logo: "B",
    },
  ];

  /* ============================================================
     COPY ORDER ID
  ============================================================ */

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.log("Copy failed", error);
    }
  };

  /* ============================================================
     PAYMENT HANDLER
  ============================================================ */

  const handlePayment = async () => {
    setPaymentError("");

    if (!termsAccepted) {
      setPaymentError(
        "Please accept the Terms & Conditions and Privacy Policy."
      );
      return;
    }

    if (
      paymentMethod === "upi" &&
      !upiId &&
      !selectedUpiApp
    ) {
      setPaymentError(
        "Please enter your UPI ID or select a UPI app."
      );
      return;
    }

    if (!checkoutItems.length) {
      alert(
        "Your cart is empty. Add items to continue."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * Preserve items locally while payment is processing.
       */
      setPreservedItems(checkoutItems);

      /*
       * Create server-side order first.
       */
      const createdOrder = await placeOrder({
        address: selectedAddress,
        paymentMethod,
        installationSlot: selectedSlot,
        secureShipping,
      });

      const currentOrderId =
        createdOrder.id ||
        orderId ||
        `HV${Date.now().toString().slice(-8)}`;

      setOrderId(currentOrderId);

      /*
       * CASH ON DELIVERY
       */
      if (paymentMethod === "cod") {
        navigate(
          `/payment/success?orderId=${encodeURIComponent(
            currentOrderId
          )}`,
          {
            state: {
              orderId: currentOrderId,
              order: createdOrder,
              paymentMethod,
              amount: total,
                    itemCount,
            },
          }
        );
        return;
      }

      /*
       * ONLINE PAYMENT METHODS
       *
       * Razorpay handles:
       * UPI
       * Card
       * Net Banking
       * Wallet
       * EMI
       */
      if (
        [
          "razorpay",
          "card",
          "netbanking",
          "wallet",
          "emi",
          "later",
          "upi",
        ].includes(paymentMethod)
      ) {
        const razorpayAmount = Math.round(total * 100);

        if (razorpayAmount < 10000) {
          setPaymentError(
            "Razorpay minimum order amount is ₹100. Please add more items or choose another payment method."
          );
          setIsSubmitting(false);
          return;
        }

        const resp = await fetch(
          "/api/payments/razorpay/create-order",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: razorpayAmount,
              currency: "INR",
              orderId: currentOrderId,
            }),
          }
        );

        const payload = await resp.json();

        if (!resp.ok) {
          throw new Error(
            payload.error ||
              "Failed to create Razorpay order"
          );
        }

        const {
          order: razorOrder,
          keyId,
        } = payload;

        /*
         * Load Razorpay SDK.
         */
        const loadRazorpay = () =>
          new Promise((resolve) => {
            if (window.Razorpay) {
              resolve(true);
              return;
            }

            const script =
              document.createElement("script");

            script.src =
              "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () => resolve(true);

            script.onerror = () => resolve(false);

            document.body.appendChild(script);
          });

        const loaded = await loadRazorpay();

        if (!loaded) {
          throw new Error(
            "Failed to load Razorpay SDK"
          );
        }

        /*
         * Razorpay options.
         */
        const options = {
          key: keyId,
          amount: razorOrder.amount,
          currency: razorOrder.currency,
          name: "Honey Vision",
          description: `Order ${currentOrderId}`,
          order_id: razorOrder.id,

          handler: async function (response) {
            try {
              const verifyResp = await fetch(
                "/api/payments/razorpay/verify",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    razorpay_order_id:
                      response.razorpay_order_id,

                    razorpay_payment_id:
                      response.razorpay_payment_id,

                    razorpay_signature:
                      response.razorpay_signature,

                    orderId: currentOrderId,
                  }),
                }
              );

              const verifyData =
                await verifyResp.json();

              if (
                !verifyResp.ok ||
                !verifyData.success
              ) {
                throw new Error(
                  verifyData.error ||
                    "Payment verification failed"
                );
              }

              setOrderId(currentOrderId);

              navigate(
                `/payment/success?orderId=${encodeURIComponent(
                  currentOrderId
                )}`,
                {
                  state: {
                    orderId: currentOrderId,
                    paymentMethod,
                    amount: total,
                    itemCount,
                  },
                }
              );
            } catch (error) {
              setPaymentError(
                error.message ||
                  "Payment verification failed"
              );
            }
          },

          prefill: {
            name:
              billingName ||
              profile?.fullName ||
              "",

            email:
              profile?.email ||
              "",

            contact:
              billingPhone ||
              profile?.phone ||
              "",
          },

          theme: {
            color: "#f4b400",
          },

          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on(
          "payment.failed",
          function (response) {
            setPaymentError(
              response?.error?.description ||
                "Payment failed. Please try again."
            );

            setIsSubmitting(false);
          }
        );

        rzp.open();

        return;
      }
    } catch (error) {
      setPaymentError(
        error.message ||
          "Unable to place order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#071426]">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#061a36] text-white">

        {/* Decorative background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute right-1/3 top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1450px] px-5 py-6 sm:px-8 lg:px-10">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Link
              to="/"
              className="hover:text-white"
            >
              Home
            </Link>

            <ChevronRight size={15} />

            <Link
              to="/cart"
              className="hover:text-white"
            >
              Cart
            </Link>

            <ChevronRight size={15} />

            <span>Address</span>

            <ChevronRight size={15} />

            <span className="font-semibold text-[#f4b400]">
              Payment
            </span>
          </div>

          <div className="grid items-center gap-10 py-10 lg:grid-cols-[1fr_0.9fr] lg:py-14">

            {/* HERO CONTENT */}
            <div>

              <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-[#f4b400]">
                Safe • Secure • Reliable
              </p>

              <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Secure{" "}
                <span className="text-[#f4b400]">
                  Payment
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
                Complete your payment and enjoy a
                safe, secure and seamless shopping
                experience with HoneyVision.
              </p>

              {/* HERO FEATURES */}
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">

                <HeroFeature
                  icon={ShieldCheck}
                  title="100% Secure"
                  subtitle="Payments"
                />

                <HeroFeature
                  icon={LockKeyhole}
                  title="Encrypted"
                  subtitle="Transactions"
                />

                <HeroFeature
                  icon={BadgeCheck}
                  title="PCI DSS"
                  subtitle="Compliant"
                />

                <HeroFeature
                  icon={Headphones}
                  title="24/7"
                  subtitle="Support"
                />

              </div>
            </div>

            {/* PAYMENT ILLUSTRATION */}
            <div className="relative hidden min-h-[330px] lg:block">

              {/* Glow */}
              <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl" />

              {/* Phone */}
              <div className="absolute right-10 top-0 h-[290px] w-[155px] rotate-[4deg] rounded-[28px] border border-white/20 bg-[#0b274a] p-3 shadow-2xl">

                <div className="h-full rounded-[20px] border border-white/10 bg-[#071a31] p-4">

                  <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20" />

                  <div className="mt-10 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                      <CheckCircle2
                        size={55}
                        className="text-green-400"
                      />
                    </div>
                  </div>

                  <p className="mt-6 text-center text-sm font-bold">
                    Payment
                  </p>

                  <p className="mt-1 text-center text-xs text-white/50">
                    Successful
                  </p>
                </div>
              </div>

              {/* CARD */}
              <div className="absolute left-4 top-14 h-52 w-[370px] rotate-[-5deg] rounded-3xl border border-blue-300/20 bg-gradient-to-br from-[#11345d] to-[#071a31] p-7 shadow-2xl">

                <div className="flex items-center justify-between">
                  <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-[#f4d35e] to-[#d89d00]" />

                  <span className="text-lg font-black tracking-widest">
                    VISA
                  </span>
                </div>

                <p className="mt-8 text-lg tracking-[0.22em] text-white/90">
                  1234 5678 9012 3456
                </p>

                <div className="mt-5 flex justify-between">
                  <div>
                    <p className="text-[9px] uppercase text-white/40">
                      Cardholder
                    </p>
                    <p className="mt-1 text-xs font-bold">
                      HONEYVISION CUSTOMER
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase text-white/40">
                      Valid Thru
                    </p>
                    <p className="mt-1 text-xs font-bold">
                      12/28
                    </p>
                  </div>
                </div>
              </div>

              {/* SECURITY SHIELD */}
              <div className="absolute bottom-0 left-[280px] flex h-32 w-32 items-center justify-center rounded-[30px] border border-blue-300/20 bg-[#071d3d] shadow-2xl">

                <div className="absolute inset-4 rotate-45 rounded-2xl border-2 border-[#f4b400]" />

                <ShieldCheck
                  size={55}
                  className="relative z-10 text-[#f4b400]"
                />
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-[1450px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">

        {/* ERROR */}
        {paymentError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <X size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-bold">
                Payment Error
              </p>

              <p className="mt-1">
                {paymentError}
              </p>
            </div>
          </div>
        )}

        {isRazorpayBlocked && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <ShieldAlert size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-bold">Minimum order amount for Razorpay</p>
              <p className="mt-1">Razorpay requires a minimum order value of ₹{razorpayMinimumAmount}. Add more items or choose Cash on Delivery.</p>
            </div>
          </div>
        )}

        <div className="grid gap-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(350px,0.85fr)]">

          {/* ==================================================
              LEFT
          ================================================== */}

          <div className="space-y-6">

            {/* PAYMENT METHODS */}
            <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

              <div className="border-b border-gray-100 px-6 py-6 sm:px-7">

                <div className="flex items-center gap-3">

                  <StepNumber number="1" />

                  <div>
                    <h2 className="text-xl font-extrabold">
                      Choose a Payment Method
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Select your preferred payment
                      option.
                    </p>
                  </div>

                </div>
              </div>

              {/* PAYMENT METHOD GRID */}
              <div className="grid gap-3 p-5 sm:p-6">

                {paymentMethods.map((method) => {
                  const Icon = method.icon;

                  const active =
                    paymentMethod === method.id;

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method.id);
                        setPaymentError("");
                      }}
                      className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${
                        active
                          ? "border-[#f4b400] bg-[#fffaf0] shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >

                      {/* RADIO */}
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          active
                            ? "border-[#f4b400]"
                            : "border-gray-300"
                        }`}
                      >
                        {active && (
                          <div className="h-2.5 w-2.5 rounded-full bg-[#f4b400]" />
                        )}
                      </div>

                      {/* ICON */}
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          active
                            ? "bg-[#071426] text-[#f4b400]"
                            : "bg-[#f4f6f8] text-[#071426]"
                        }`}
                      >
                        <Icon size={23} />
                      </div>

                      {/* CONTENT */}
                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="text-sm font-extrabold sm:text-base">
                            {method.title}
                          </span>

                          {method.recommended && (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
                              Recommended
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                          {method.subtitle}
                        </p>

                      </div>

                      <ChevronRight
                        size={19}
                        className={`shrink-0 transition ${
                          active
                            ? "text-[#071426]"
                            : "text-gray-400 group-hover:text-gray-700"
                        }`}
                      />

                    </button>
                  );
                })}

              </div>

              {/* SELECTED PAYMENT CONTENT */}
              <div className="border-t border-gray-100 p-5 sm:p-7">

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff7dd]">
                    <CreditCard
                      size={19}
                      className="text-[#d99c00]"
                    />
                  </div>

                  <div>
                    <h3 className="font-extrabold">
                      Payment Details
                    </h3>

                    <p className="text-xs text-gray-500">
                      Complete the details below.
                    </p>
                  </div>
                </div>

                {/* UPI */}
                {paymentMethod === "upi" && (
                  <UPIPayment
                    upiId={upiId}
                    setUpiId={setUpiId}
                    selectedUpiApp={selectedUpiApp}
                    setSelectedUpiApp={setSelectedUpiApp}
                    upiApps={upiApps}
                    orderId={orderId}
                    total={total}
                    copyOrderId={copyOrderId}
                    copied={copied}
                  />
                )}

                {/* CARD */}
                {paymentMethod === "card" && (
                  <CardPayment
                    saveCard={saveCard}
                    setSaveCard={setSaveCard}
                  />
                )}

                {/* NET BANKING */}
                {paymentMethod === "netbanking" && (
                  <NetBankingPayment />
                )}

                {/* WALLET */}
                {paymentMethod === "wallet" && (
                  <WalletPayment />
                )}

                {/* EMI */}
                {paymentMethod === "emi" && (
                  <EMIPayment total={total} />
                )}

                {/* COD */}
                {paymentMethod === "cod" && (
                  <CashOnDeliveryPayment />
                )}

                {/* RAZORPAY */}
                {paymentMethod === "razorpay" && (
                  <RazorpayPayment />
                )}
              </div>
            </section>

            {/* BILLING ADDRESS */}
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <StepNumber number="2" />

                  <div>
                    <h2 className="text-xl font-extrabold">
                      Billing Address
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Your order will be billed to this
                      address.
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="rounded-lg px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50"
                >
                  Change
                </button>

              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-[#fafbfc] p-5 sm:ml-11">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <MapPin
                      size={21}
                      className="text-[#071426]"
                    />
                  </div>

                  <div className="min-w-0">

                    <p className="font-extrabold">
                      {billingName ||
                        "Billing name not available"}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-600">

                      {billingAddressLine && (
                        <>
                          {billingAddressLine}
                          <br />
                        </>
                      )}

                      {(billingCity ||
                        billingState ||
                        billingPin) && (
                        <>
                          {billingCity &&
                            `${billingCity}, `}

                          {billingState &&
                            `${billingState} - `}

                          {billingPin}

                          <br />
                        </>
                      )}

                      {billingCountry && (
                        <>
                          {billingCountry}
                          <br />
                        </>
                      )}

                      {billingPhone && (
                        <>
                          Phone: {billingPhone}
                        </>
                      )}

                      {!billingName &&
                        !billingAddressLine &&
                        !billingPhone &&
                        "No billing details available"}

                    </p>

                  </div>
                </div>
              </div>
            </section>

            {/* ADDITIONAL OPTIONS */}
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-center gap-3">

                <StepNumber number="3" />

                <div>
                  <h2 className="text-xl font-extrabold">
                    Additional Options
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Add extra protection to your order.
                  </p>
                </div>

              </div>

              <div className="mt-6 space-y-4 sm:ml-11">

                {/* INSURANCE */}
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300">

                  <div className="flex items-center gap-3">

                    <input
                      type="checkbox"
                      checked={secureShipping}
                      onChange={(e) =>
                        setSecureShipping(
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 accent-[#f4b400]"
                    />

                    <div>
                      <p className="text-sm font-bold">
                        Secure my order with shipping
                        insurance
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Protect your order during
                        transit.
                      </p>
                    </div>

                  </div>

                  <span className="whitespace-nowrap text-sm font-extrabold">
                    ₹49
                  </span>

                </label>

                {/* SAVE CARD */}
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 p-4">

                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={(e) =>
                      setSaveCard(e.target.checked)
                    }
                    className="h-4 w-4 accent-[#f4b400]"
                  />

                  <div>
                    <p className="text-sm font-bold">
                      Save my card details
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      For faster checkout next time.
                    </p>
                  </div>

                  <LockKeyhole
                    size={15}
                    className="text-[#d99c00]"
                  />

                </label>

                {/* TERMS */}
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-4">

                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) =>
                      setTermsAccepted(
                        e.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 accent-[#f4b400]"
                  />

                  <span className="text-sm leading-6 text-gray-600">

                    I agree to the{" "}

                    <button
                      type="button"
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Terms & Conditions
                    </button>

                    {" "}and{" "}

                    <button
                      type="button"
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Privacy Policy
                    </button>

                  </span>

                </label>

              </div>
            </section>

            {/* PAYMENT BUTTON */}
            <div>

              <button
                type="button"
                onClick={handlePayment}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#f4b400] px-7 py-4 text-base font-extrabold text-[#071426] shadow-lg shadow-[#f4b400]/20 transition hover:bg-[#ffca28] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 sm:text-lg"
              >

                <LockKeyhole size={21} />

                {isSubmitting
                  ? "Processing Payment..."
                  : "Pay Securely"}

                <span>
                  ₹{total.toLocaleString("en-IN")}
                </span>

                {!isSubmitting && (
                  <ArrowRight size={20} />
                )}

              </button>

              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">

                <ShieldCheck
                  size={15}
                  className="text-green-600"
                />

                Your payment information is
                100% secure and encrypted.

              </p>

            </div>
          </div>

          {/* ==================================================
              RIGHT COLUMN
          ================================================== */}

          <aside className="space-y-6">

            {/* ORDER SUMMARY */}
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-center justify-between">

                <h2 className="text-xl font-extrabold">
                  Order Summary
                </h2>

                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  Edit Cart
                </button>

              </div>

              {/* PRODUCTS */}
              <div className="mt-6 space-y-5">

                {checkoutItems.map((item) => (

                  <div
                    key={item.product.id}
                    className="flex gap-4"
                  >

                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">

                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-contain"
                      />

                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex justify-between gap-3">

                        <div className="min-w-0">

                          <h3 className="line-clamp-2 text-sm font-extrabold">
                            {item.product.name}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            {item.product.model ||
                              item.product.category ||
                              "Product"}
                          </p>

                          <p className="mt-2 text-xs font-medium text-gray-600">
                            Qty: {item.quantity}
                          </p>

                        </div>

                        <p className="whitespace-nowrap text-sm font-extrabold">
                          ₹
                          {(
                            item.product.price *
                            item.quantity
                          ).toLocaleString("en-IN")}
                        </p>

                      </div>

                    </div>

                  </div>

                ))}
              </div>

              <div className="my-6 border-t border-gray-200" />

              {/* PRICING */}
              <div className="space-y-4 text-sm">

                <PriceRow
                  label={`Subtotal (${itemCount} Items)`}
                  value={`₹${subtotal.toLocaleString(
                    "en-IN"
                  )}`}
                />

                {discount > 0 && (
                  <PriceRow
                    label="Discount"
                    value={`-₹${discount.toLocaleString(
                      "en-IN"
                    )}`}
                    valueClass="text-green-600"
                  />
                )}

                <PriceRow
                  label="Shipping Charges"
                  value={
                    shipping === 0
                      ? "FREE"
                      : `₹${shipping.toLocaleString(
                          "en-IN"
                        )}`
                  }
                  valueClass={
                    shipping === 0
                      ? "text-green-600"
                      : ""
                  }
                />

                {installationFee > 0 && (
                  <PriceRow
                    label="Installation Charges"
                    value={`₹${installationFee.toLocaleString(
                      "en-IN"
                    )}`}
                  />
                )}

                {insurance > 0 && (
                  <PriceRow
                    label="Shipping Insurance"
                    value={`₹${insurance.toLocaleString(
                      "en-IN"
                    )}`}
                  />
                )}

              </div>

              <div className="my-6 border-t border-gray-200" />

              {/* TOTAL */}
              <div className="flex items-end justify-between gap-5">

                <div>

                  <p className="text-base font-extrabold">
                    Total Amount
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Inclusive of applicable taxes
                  </p>

                </div>

                <p className="text-2xl font-black text-[#071426] sm:text-3xl">
                  ₹{total.toLocaleString("en-IN")}
                </p>

              </div>

              {/* SAVINGS */}
              {discount > 0 && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">

                  <Tag
                    size={19}
                    className="text-green-600"
                  />

                  <p className="text-xs font-bold text-green-700">
                    You saved ₹
                    {discount.toLocaleString(
                      "en-IN"
                    )}{" "}
                    on this order
                  </p>

                </div>
              )}

            </section>

            {/* TRUST CARD */}
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

              <h2 className="text-xl font-extrabold">
                Why Shop With HoneyVision?
              </h2>

              <div className="mt-6 space-y-5">

                <TrustItem
                  icon={ShieldCheck}
                  title="Secure Payments"
                  description="Your payment information is protected and encrypted."
                />

                <TrustItem
                  icon={BadgeCheck}
                  title="Genuine Products"
                  description="Original products from trusted brands."
                />

                <TrustItem
                  icon={PackageCheck}
                  title="Secure Packaging"
                  description="Products are carefully packed for safe delivery."
                />

                <TrustItem
                  icon={RefreshCcw}
                  title="Easy Returns"
                  description="Simple return support according to our policy."
                />

                <TrustItem
                  icon={Truck}
                  title="Fast Delivery"
                  description="Reliable delivery across India."
                />

              </div>

              {/* PAYMENT BADGES */}
              <div className="mt-7 border-t border-gray-100 pt-5">

                <p className="mb-3 text-xs font-bold text-gray-500">
                  Secure payment partners
                </p>

                <div className="flex flex-wrap gap-2">

                  <PaymentBadge text="PCI DSS" />
                  <PaymentBadge text="256-bit SSL" />
                  <PaymentBadge text="VISA" />
                  <PaymentBadge text="Mastercard" />
                  <PaymentBadge text="RuPay" />
                  <PaymentBadge text="UPI" />

                </div>
              </div>

            </section>
          </aside>
        </div>
      </main>

      {/* ======================================================
          SECURITY BANNER
      ====================================================== */}

      <section className="mx-auto max-w-[1450px] px-5 pb-7 sm:px-8 lg:px-10">

        <div className="overflow-hidden rounded-3xl bg-[#061a36]">

          <div className="grid items-center gap-7 p-7 sm:p-9 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">

            <div className="flex items-center gap-4">
              <ShieldCheck
                size={46}
                strokeWidth={1.4}
                className="shrink-0 text-[#f4b400]"
              />

              <div>
                <p className="text-lg font-black text-white">
                  100% Secure
                </p>

                <p className="text-sm text-white/60">
                  Payment
                </p>
              </div>
            </div>

            <div className="hidden h-12 w-px bg-white/15 lg:block" />

            <div className="flex items-center gap-4">

              <LockKeyhole
                size={39}
                className="text-[#f4b400]"
              />

              <div>
                <p className="font-extrabold text-white">
                  We Protect Your Information
                </p>

                <p className="mt-1 text-xs leading-5 text-white/60">
                  Your payment details remain
                  protected.
                </p>
              </div>

            </div>

            <div className="hidden h-12 w-px bg-white/15 lg:block" />

            <div className="flex flex-wrap gap-2">

              <DarkBadge text="PCI DSS" />
              <DarkBadge text="SSL" />
              <DarkBadge text="VISA" />
              <DarkBadge text="UPI" />

            </div>

          </div>
        </div>
      </section>

      {/* ======================================================
          BOTTOM SUPPORT
      ====================================================== */}

      <section className="mx-auto max-w-[1450px] px-5 pb-10 sm:px-8 lg:px-10">

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

          <div className="grid gap-6 md:grid-cols-3">

            <SupportItem
              icon={Headphones}
              title="Need Help?"
              text="Our support team is ready to help."
            />

            <SupportItem
              icon={Smartphone}
              title="Call Us"
              text="+91 98765 43210"
            />

            <SupportItem
              icon={Globe}
              title="Email Us"
              text="support@honeyvision.in"
            />

          </div>

        </div>
      </section>
    </div>
  );
};

/* ============================================================
   HERO FEATURE
============================================================ */

const HeroFeature = ({
  icon: Icon,
  title,
  subtitle,
}) => {
  return (
    <div className="flex items-center gap-3 border-r border-white/10 pr-3 last:border-r-0">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5">
        <Icon
          size={21}
          className="text-[#f4b400]"
        />
      </div>

      <div>
        <p className="text-xs font-bold">
          {title}
        </p>

        <p className="mt-0.5 text-[11px] text-white/55">
          {subtitle}
        </p>
      </div>

    </div>
  );
};

/* ============================================================
   STEP NUMBER
============================================================ */

const StepNumber = ({ number }) => {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#071426] text-sm font-black text-white">
      {number}
    </div>
  );
};

/* ============================================================
   UPI PAYMENT
============================================================ */

const UPIPayment = ({
  upiId,
  setUpiId,
  selectedUpiApp,
  setSelectedUpiApp,
  upiApps,
  orderId,
  total,
  copyOrderId,
  copied,
}) => {
  const handlePayWithUpiApp = () => {
    const pa = String(upiId || "").trim();

    if (!pa) {
      window.alert(
        "Please enter a UPI ID to use UPI app payment."
      );
      return;
    }

    const amt = Number(total || 0).toFixed(2);

    const upiLink =
      `upi://pay?pa=${encodeURIComponent(pa)}` +
      `&pn=${encodeURIComponent("Honey Vision")}` +
      `&am=${encodeURIComponent(amt)}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent(
        "Order " + (orderId || "")
      )}`;

    window.location.href = upiLink;
  };

  return (
    <div>

      {/* UPI HEADER */}
      <div className="rounded-2xl border border-gray-200 bg-[#fafbfc] p-5">

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-black shadow-sm">
                UPI
              </div>

              <div>
                <p className="font-extrabold">
                  Pay Using UPI
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Fast and secure payment through
                  any UPI app.
                </p>
              </div>

            </div>

          </div>

          <div className="flex flex-wrap gap-2">

            {upiApps.map((app) => {

              const active =
                selectedUpiApp === app.id;

              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() =>
                    setSelectedUpiApp(app.id)
                  }
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-black transition ${
                    active
                      ? "border-[#f4b400] bg-[#fff7dd]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  title={app.name}
                >
                  {app.logo}
                </button>
              );
            })}

          </div>

        </div>

      </div>

      {/* QR + UPI ID */}
      <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">

        {/* QR */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">

          <p className="text-sm font-extrabold">
            Scan & Pay
          </p>

          <div className="mx-auto mt-4 flex h-40 w-40 items-center justify-center rounded-xl border border-gray-200 bg-white p-2">

            <FakeQRCode />

          </div>

          <p className="mt-3 text-xs text-gray-500">
            Scan using any UPI app
          </p>

        </div>

        {/* UPI INPUT */}
        <div className="rounded-2xl border border-gray-200 bg-[#fafbfc] p-5">

          <p className="text-sm font-extrabold">
            Or Enter UPI ID
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Example: yourname@upi
          </p>

          <div className="relative mt-4">

            <input
              type="text"
              value={upiId}
              onChange={(e) =>
                setUpiId(e.target.value)
              }
              placeholder="Enter your UPI ID"
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 pr-12 text-sm outline-none transition focus:border-[#f4b400] focus:ring-4 focus:ring-[#f4b400]/10"
            />

            <Smartphone
              size={19}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

          </div>

          <button
            type="button"
            onClick={handlePayWithUpiApp}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#071426] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#f4b400] hover:text-[#071426]"
          >
            Continue with UPI
            <ArrowRight size={17} />
          </button>

          {/* ORDER ID */}
          <div className="mt-5 flex flex-wrap items-center gap-2">

            <span className="text-xs text-gray-500">
              Order ID:
            </span>

            <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold">
              {orderId}
            </span>

            <button
              type="button"
              onClick={copyOrderId}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-[#071426]"
            >
              {copied ? (
                <CheckCircle2
                  size={16}
                  className="text-green-600"
                />
              ) : (
                <Copy size={16} />
              )}
            </button>

          </div>

        </div>

      </div>

      <SecurityNotice />
    </div>
  );
};

/* ============================================================
   COD
============================================================ */

const CashOnDeliveryPayment = () => {
  return (
    <div className="rounded-2xl border border-[#f1d88d] bg-[#fffaf0] p-5">

      <div className="flex items-start gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white">
          <PackageCheck
            size={25}
            className="text-[#d99c00]"
          />
        </div>

        <div>

          <h3 className="font-extrabold">
            Pay on Delivery
          </h3>

          <p className="mt-1 text-sm leading-6 text-gray-600">
            Pay the full amount in cash when
            your order arrives at your doorstep.
          </p>

        </div>

      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">

        <SmallInfo
          icon={Truck}
          text="Delivered to your doorstep"
        />

        <SmallInfo
          icon={ShieldCheck}
          text="Secure order processing"
        />

        <SmallInfo
          icon={Check}
          text="Easy payment at delivery"
        />

      </div>

    </div>
  );
};

/* ============================================================
   CARD
============================================================ */

const CardPayment = ({
  saveCard,
  setSaveCard,
}) => {
  return (
    <div>

      <div className="rounded-2xl border border-gray-200 bg-[#fafbfc] p-5">

        <div className="flex items-center justify-between">

          <div>
            <p className="font-extrabold">
              Debit / Credit Card
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Your card details are securely
              handled by the payment gateway.
            </p>
          </div>

          <div className="flex gap-2">
            <PaymentMiniBadge text="VISA" />
            <PaymentMiniBadge text="MC" />
            <PaymentMiniBadge text="RuPay" />
          </div>

        </div>

        <div className="mt-5 grid gap-4">

          <input
            type="text"
            placeholder="Card Number"
            className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-[#f4b400] focus:ring-4 focus:ring-[#f4b400]/10"
          />

          <div className="grid gap-4 sm:grid-cols-2">

            <input
              type="text"
              placeholder="MM / YY"
              className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-[#f4b400] focus:ring-4 focus:ring-[#f4b400]/10"
            />

            <input
              type="password"
              placeholder="CVV"
              className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-[#f4b400] focus:ring-4 focus:ring-[#f4b400]/10"
            />

          </div>

          <input
            type="text"
            placeholder="Cardholder Name"
            className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-[#f4b400] focus:ring-4 focus:ring-[#f4b400]/10"
          />

          <label className="flex cursor-pointer items-center gap-3 text-sm">

            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) =>
                setSaveCard(e.target.checked)
              }
              className="h-4 w-4 accent-[#f4b400]"
            />

            <span>
              Save card details for faster
              checkout
            </span>

          </label>

        </div>

      </div>

      <SecurityNotice />
    </div>
  );
};

/* ============================================================
   NET BANKING
============================================================ */

const NetBankingPayment = () => {

  const banks = [
    "HDFC Bank",
    "ICICI Bank",
    "SBI",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Other Banks",
  ];

  return (
    <div>

      <p className="font-extrabold">
        Select Your Bank
      </p>

      <p className="mt-1 text-xs text-gray-500">
        You will be redirected to your bank
        to complete the payment.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">

        {banks.map((bank) => (
          <button
            key={bank}
            type="button"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left text-sm font-bold transition hover:border-[#f4b400] hover:bg-[#fffaf0]"
          >
            <span>{bank}</span>

            <ChevronRight
              size={17}
              className="text-gray-400"
            />
          </button>
        ))}

      </div>
    </div>
  );
};

/* ============================================================
   WALLET
============================================================ */

const WalletPayment = () => {

  const wallets = [
    "Paytm Wallet",
    "Mobikwik",
    "Amazon Pay",
    "Freecharge",
  ];

  return (
    <div>

      <p className="font-extrabold">
        Select Wallet
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Choose your preferred wallet to
        continue.
      </p>

      <div className="mt-5 space-y-3">

        {wallets.map((wallet) => (
          <button
            key={wallet}
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-sm font-bold transition hover:border-[#f4b400] hover:bg-[#fffaf0]"
          >
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f7f9]">
                <Wallet size={18} />
              </div>

              {wallet}

            </div>

            <ChevronRight size={18} />

          </button>
        ))}

      </div>
    </div>
  );
};

/* ============================================================
   EMI
============================================================ */

const EMIPayment = ({ total }) => {

  const threeMonth =
    Math.ceil(Number(total || 0) / 3);

  const sixMonth =
    Math.ceil(Number(total || 0) / 6);

  return (
    <div>

      <p className="font-extrabold">
        EMI / Buy Now Pay Later
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Select an available EMI option.
      </p>

      <div className="mt-5 space-y-3">

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-[#f4b400] hover:bg-[#fffaf0]"
        >
          <div>

            <p className="text-sm font-extrabold">
              3 Months EMI
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Available on eligible cards
            </p>

          </div>

          <span className="font-black">
            ₹
            {threeMonth.toLocaleString("en-IN")}
            /mo
          </span>

        </button>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-[#f4b400] hover:bg-[#fffaf0]"
        >
          <div>

            <p className="text-sm font-extrabold">
              6 Months EMI
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Available on eligible cards
            </p>

          </div>

          <span className="font-black">
            ₹
            {sixMonth.toLocaleString("en-IN")}
            /mo
          </span>

        </button>

      </div>
    </div>
  );
};

/* ============================================================
   RAZORPAY
============================================================ */

const RazorpayPayment = () => {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

      <div className="flex items-start gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white">
          <Zap
            size={23}
            className="text-blue-600"
          />
        </div>

        <div>

          <h3 className="font-extrabold">
            Razorpay Secure Checkout
          </h3>

          <p className="mt-1 text-sm leading-6 text-gray-600">
            Continue securely using UPI, cards,
            net banking, wallets and supported
            payment methods through Razorpay.
          </p>

        </div>

      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">

        <SmallInfo
          icon={ShieldCheck}
          text="Secure payment"
        />

        <SmallInfo
          icon={LockKeyhole}
          text="Encrypted transaction"
        />

        <SmallInfo
          icon={BadgeCheck}
          text="Trusted gateway"
        />

      </div>

    </div>
  );
};

/* ============================================================
   SECURITY NOTICE
============================================================ */

const SecurityNotice = () => {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">

      <ShieldCheck
        size={22}
        className="shrink-0 text-green-600"
      />

      <div>

        <p className="text-sm font-bold text-green-800">
          Secure Payment
        </p>

        <p className="mt-0.5 text-xs text-green-700">
          Your payment information is encrypted
          and protected.
        </p>

      </div>

    </div>
  );
};

/* ============================================================
   SMALL INFO
============================================================ */

const SmallInfo = ({
  icon: Icon,
  text,
}) => {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3">

      <Icon
        size={17}
        className="shrink-0 text-[#d99c00]"
      />

      <span className="text-xs font-semibold text-gray-600">
        {text}
      </span>

    </div>
  );
};

/* ============================================================
   PRICE ROW
============================================================ */

const PriceRow = ({
  label,
  value,
  valueClass = "",
}) => {
  return (
    <div className="flex items-center justify-between gap-5">

      <span className="text-gray-600">
        {label}
      </span>

      <span
        className={`font-bold ${valueClass}`}
      >
        {value}
      </span>

    </div>
  );
};

/* ============================================================
   TRUST ITEM
============================================================ */

const TrustItem = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="flex gap-4">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f7f9]">

        <Icon
          size={22}
          className="text-[#071426]"
        />

      </div>

      <div>

        <h3 className="text-sm font-extrabold">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>

      </div>

    </div>
  );
};

/* ============================================================
   PAYMENT BADGE
============================================================ */

const PaymentBadge = ({ text }) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[10px] font-black text-gray-700">
      {text}
    </div>
  );
};

/* ============================================================
   PAYMENT MINI BADGE
============================================================ */

const PaymentMiniBadge = ({ text }) => {
  return (
    <span className="flex h-8 min-w-9 items-center justify-center rounded-md border border-gray-200 bg-white px-2 text-[9px] font-black text-gray-600">
      {text}
    </span>
  );
};

/* ============================================================
   DARK BADGE
============================================================ */

const DarkBadge = ({ text }) => {
  return (
    <div className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-black text-white/80">
      {text}
    </div>
  );
};

/* ============================================================
   SUPPORT ITEM
============================================================ */

const SupportItem = ({
  icon: Icon,
  title,
  text,
}) => {
  return (
    <div className="flex items-center gap-4">

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff7dd]">

        <Icon
          size={22}
          className="text-[#d99c00]"
        />

      </div>

      <div>

        <p className="text-sm font-extrabold">
          {title}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {text}
        </p>

      </div>

    </div>
  );
};

/* ============================================================
   FAKE QR
   NOTE:
   This is only a visual placeholder.
   For production UPI QR, generate the QR from your
   payment provider/backend.
============================================================ */

const FakeQRCode = () => {

  const blocks = [];

  for (let i = 0; i < 225; i++) {

    const random =
      (i * 17 + i * i * 7) % 11;

    blocks.push(
      <span
        key={i}
        className={
          random < 5
            ? "bg-[#071426]"
            : "bg-white"
        }
      />
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-15 gap-0.5 bg-white p-1">
      {blocks}
    </div>
  );
};

/* ============================================================
   SUCCESS ROW
============================================================ */

export default Payment;