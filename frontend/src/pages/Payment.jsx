import React, { useState } from "react";
import { useCommerce } from "../context/CommerceContext";
import { Link, useLocation } from "react-router-dom";

import {
  ShoppingCart,
  MapPin,
  CreditCard,
  Check,
  Smartphone,
  Building2,
  Wallet,
  Percent,
  Clock3,
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
} from "lucide-react";


const Payment = () => {
  const { cart, products, profile, addresses, user, placeOrder } = useCommerce();
  const location = useLocation();
  const checkoutState = location.state || {};
  const orderIdFromState = checkoutState.orderId;

  const userAddresses = user?.id ? addresses.filter((address) => address.userId === user.id) : [];
  const defaultAddress =
    userAddresses.find((address) => address.isDefault) ||
    userAddresses[0] ||
    addresses.find((address) => address.isDefault) ||
    {};

  const selectedAddress = checkoutState.address || defaultAddress;
  const selectedSlot = checkoutState.slot || "Tomorrow, 10:00 AM - 1:00 PM";
  const [orderId, setOrderId] = useState(() => orderIdFromState || `HV${Date.now().toString().slice(-8)}`);

  const billingName = selectedAddress.fullName || selectedAddress.name || defaultAddress.fullName || profile.fullName || "";
  const billingPhone = selectedAddress.phone || defaultAddress.phone || profile.phone || "";
  const billingAddressLine = selectedAddress.address || selectedAddress.line1 || defaultAddress.address || profile.address || "";
  const billingCity = selectedAddress.city || defaultAddress.city || profile.city || "";
  const billingState = selectedAddress.state || defaultAddress.state || profile.state || "";
  const billingPin = selectedAddress.pin || selectedAddress.pinCode || defaultAddress.pin || profile.pinCode || "";
  const billingCountry = selectedAddress.country || defaultAddress.country || profile.country || "";

  /* =========================================================
     STATES
  ========================================================= */

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [upiId, setUpiId] = useState("");
  const [selectedUpiApp, setSelectedUpiApp] = useState("");
  const [secureShipping, setSecureShipping] = useState(true);
  const [saveCard, setSaveCard] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preservedItems, setPreservedItems] = useState(null);

  const currentCheckoutItems = cart
    .map((item) => {
      const product = products.find((product) => product.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter(Boolean);

  const checkoutItems = preservedItems || currentCheckoutItems;

  const subtotal = checkoutItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const discount = subtotal > 0 ? 1000 : 0;
  const shipping = subtotal >= 999 ? 0 : subtotal > 0 ? 99 : 0;
  const insurance = secureShipping ? 49 : 0;
  const total = subtotal - discount + shipping + insurance;
  const itemCount = checkoutItems.reduce((count, item) => count + item.quantity, 0);

  if (!checkoutItems.length) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-10 text-center">
        <h1 className="text-3xl font-extrabold text-[#071426]">Nothing to pay for</h1>
        <p className="mt-4 text-gray-600">Your cart is empty or no active order was found.</p>
        <Link to="/cart" className="mt-6 inline-block rounded-xl bg-[#061a36] px-6 py-3 text-white transition hover:bg-[#fbb900] hover:text-[#071426]">Go to Cart</Link>
      </main>
    );
  }


  /* =========================================================
     PAYMENT METHODS
  ========================================================= */

  const paymentMethods = [
    {
      id: "cod",
      title: "Cash on Delivery",
      icon: PackageCheck,
    },
    {
      id: "upi",
      title: "UPI",
      icon: Smartphone,
    },
    {
      id: "card",
      title: "Cards",
      icon: CreditCard,
    },
    {
      id: "netbanking",
      title: "Net Banking",
      icon: Building2,
    },
    {
      id: "wallet",
      title: "Wallets",
      icon: Wallet,
    },
    {
      id: "emi",
      title: "EMI",
      icon: Percent,
    },
    {
      id: "later",
      title: "Pay Later",
      icon: Clock3,
    },
  ];


  /* =========================================================
     UPI APPS
  ========================================================= */

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


  /* =========================================================
     COPY ORDER ID
  ========================================================= */

  const copyOrderId = async () => {

    try {

      await navigator.clipboard.writeText(orderId);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (error) {

      console.log("Copy failed");

    }

  };


  /* =========================================================
     PAYMENT VALIDATION
  ========================================================= */

  const handlePayment = async () => {
    if (!termsAccepted) {
      alert("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    if (paymentMethod === "upi" && !upiId && !selectedUpiApp) {
      alert("Please enter your UPI ID or select a UPI app.");
      return;
    }

    if (!checkoutItems.length) {
      alert("Your cart is empty. Add items to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      setPreservedItems(checkoutItems);
      const order = await placeOrder({
        address: selectedAddress,
        paymentMethod,
        installationSlot: selectedSlot,
      });

      setOrderId(order.id || orderId);
      setShowSuccess(true);
    } catch (error) {
      alert(error.message || "Unable to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (

    <div className="min-h-screen bg-[#f8fafc] text-[#071426]">


      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <section className="border-b border-gray-200 bg-white">

        <div className="mx-auto max-w-[1450px] px-6 py-8 lg:px-10">

          <div className="grid gap-7 lg:grid-cols-[1fr_520px] lg:items-center">


            {/* TITLE */}

            <div>

              <h1 className="text-4xl font-extrabold md:text-5xl">
                Secure Checkout
              </h1>

              <p className="mt-2 text-gray-500">
                Complete your payment and place your order.
              </p>

            </div>


            {/* CHECKOUT STEPS */}

            <CheckoutSteps />

          </div>

        </div>

      </section>



      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="mx-auto max-w-[1450px] px-6 py-8 lg:px-10">

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">


          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div className="space-y-5">


            {/* =================================================
                PAYMENT METHOD
            ================================================= */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

              <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5">

                <StepNumber number="1" />

                <h2 className="text-lg font-extrabold">
                  Choose a Payment Method
                </h2>

              </div>


              <div className="grid md:grid-cols-[160px_1fr]">


                {/* PAYMENT METHOD MENU */}

                <div className="border-b border-gray-200 md:border-b-0 md:border-r">

                  {paymentMethods.map((method) => {

                    const Icon = method.icon;

                    const active =
                      paymentMethod === method.id;

                    return (

                      <button
                        key={method.id}
                        onClick={() =>
                          setPaymentMethod(method.id)
                        }
                        className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-5 text-left transition ${
                          active
                            ? "border-l-4 border-l-[#fbb900] bg-[#fffaf0] font-bold"
                            : "hover:bg-gray-50"
                        }`}
                      >

                        <Icon
                          size={22}
                          strokeWidth={1.6}
                        />

                        <span className="text-sm">
                          {method.title}
                        </span>

                      </button>

                    );

                  })}

                </div>


                {/* PAYMENT CONTENT */}

                <div className="p-6">

                  {paymentMethod === "cod" && (
                    <CashOnDeliveryPayment />
                  )}

                  {paymentMethod === "upi" && (

                    <UPIPayment
                      upiId={upiId}
                      setUpiId={setUpiId}
                      selectedUpiApp={selectedUpiApp}
                      setSelectedUpiApp={setSelectedUpiApp}
                      upiApps={upiApps}
                      orderId={orderId}
                      copyOrderId={copyOrderId}
                      copied={copied}
                    />

                  )}


                  {paymentMethod === "card" && (
                    <CardPayment
                      saveCard={saveCard}
                      setSaveCard={setSaveCard}
                    />
                  )}


                  {paymentMethod === "netbanking" && (
                    <NetBankingPayment />
                  )}


                  {paymentMethod === "wallet" && (
                    <WalletPayment />
                  )}


                  {paymentMethod === "emi" && (
                    <EMIPayment />
                  )}


                  {paymentMethod === "later" && (
                    <PayLaterPayment />
                  )}

                </div>

              </div>

            </section>



            {/* =================================================
                BILLING ADDRESS
            ================================================= */}

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <StepNumber number="2" />

                  <h2 className="text-lg font-extrabold">
                    Billing Address
                  </h2>

                </div>


                <button className="text-sm font-semibold text-blue-600 hover:underline">
                  Change
                </button>

              </div>


              <div className="mt-5 pl-0 md:pl-[46px]">

                <p className="font-bold">
                  {billingName || "Billing name not available"}
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {billingAddressLine && <>{billingAddressLine}<br /></>}
                  {(billingCity || billingState || billingPin) && (
                    <>
                      {billingCity && `${billingCity}, `}
                      {billingState && `${billingState} - `}
                      {billingPin}
                      <br />
                    </>
                  )}
                  {billingCountry && <>{billingCountry}<br /></>}
                  {billingPhone && <>Phone: {billingPhone}</>}
                  {!billingName && !billingAddressLine && !billingPhone && "No billing details available"}
                </p>

              </div>

            </section>



            {/* =================================================
                ADDITIONAL OPTIONS
            ================================================= */}

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="flex items-center gap-3">

                <StepNumber number="3" />

                <h2 className="text-lg font-extrabold">
                  Additional Options
                </h2>

              </div>


              <div className="mt-5 space-y-4 md:pl-[46px]">


                {/* SHIPPING INSURANCE */}

                <label className="flex cursor-pointer items-center justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <input
                      type="checkbox"
                      checked={secureShipping}
                      onChange={(e) =>
                        setSecureShipping(
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 accent-[#fbb900]"
                    />

                    <span className="text-sm">
                      Secure my order with shipping insurance
                    </span>

                  </div>

                  <span className="text-sm font-bold">
                    ₹49
                  </span>

                </label>



                {/* SAVE CARD */}

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={(e) =>
                      setSaveCard(e.target.checked)
                    }
                    className="h-4 w-4 accent-[#fbb900]"
                  />

                  <span className="text-sm">
                    Save my card details for faster checkout
                  </span>

                  <LockKeyhole
                    size={14}
                    className="text-[#f0aa00]"
                  />

                </label>



                {/* TERMS */}

                <label className="flex cursor-pointer items-start gap-3">

                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) =>
                      setTermsAccepted(
                        e.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 accent-[#fbb900]"
                  />

                  <span className="text-sm text-gray-600">

                    I agree to the{" "}

                    <button className="font-semibold text-blue-600 hover:underline">
                      Terms & Conditions
                    </button>

                    {" "}and{" "}

                    <button className="font-semibold text-blue-600 hover:underline">
                      Privacy Policy
                    </button>

                  </span>

                </label>

              </div>

            </section>



            {/* =================================================
                PAY BUTTON
            ================================================= */}

            <div>

              <button
                type="button"
                onClick={handlePayment}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#061a36] px-7 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-[#fbb900] hover:text-[#071426] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              >

                <LockKeyhole size={22} />

                {isSubmitting ? "Processing..." : "Pay Securely"}

                <span>
                  ₹{total.toLocaleString("en-IN")}
                </span>

                <ArrowRight size={21} />

              </button>


              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">

                <ShieldCheck
                  size={15}
                  className="text-[#f0aa00]"
                />

                We securely process your payment without leaving the page.

              </p>

            </div>

          </div>



          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <div className="space-y-5">


            {/* =================================================
                ORDER SUMMARY
            ================================================= */}

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <h2 className="text-xl font-extrabold">
                  Order Summary
                </h2>

                <button onClick={() => navigate('/cart')} className="text-sm font-semibold text-blue-600 hover:underline">
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

                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">

                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-contain"
                      />

                    </div>


                    <div className="min-w-0 flex-1">

                      <div className="flex justify-between gap-3">

                        <div>

                          <h3 className="text-sm font-bold">
                            {item.product.name}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            {item.product.model || item.product.category || "Product"}
                          </p>

                          <p className="mt-2 text-xs text-gray-600">
                            Qty: {item.quantity}
                          </p>

                        </div>


                        <p className="whitespace-nowrap text-sm font-bold">
                          ₹
                          {(item.product.price * item.quantity).toLocaleString(
                            "en-IN"
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                ))}

              </div>


              {/* DIVIDER */}

              <div className="my-6 border-t border-gray-200" />


              {/* PRICE */}

              <div className="space-y-4 text-sm">

                <div className="flex justify-between">

                  <span>
                    Subtotal ({itemCount} Items)
                  </span>

                  <span className="font-semibold">
                    ₹
                    {subtotal.toLocaleString(
                      "en-IN"
                    )}
                  </span>

                </div>


                <div className="flex justify-between">

                  <span>
                    Discount
                  </span>

                  <span className="font-semibold text-green-600">
                    -₹
                    {discount.toLocaleString(
                      "en-IN"
                    )}
                  </span>

                </div>


                <div className="flex justify-between">

                  <span>
                    Shipping Charges
                  </span>

                  <span className="font-semibold">
                    ₹
                    {shipping.toLocaleString(
                      "en-IN"
                    )}
                  </span>

                </div>

              </div>


              <div className="my-5 border-t border-gray-200" />


              {/* TOTAL */}

              <div className="flex items-end justify-between">

                <div>

                  <p className="text-base font-extrabold">
                    Total Amount
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    (Inclusive of all taxes)
                  </p>

                </div>


                <p className="text-2xl font-extrabold">
                  ₹
                  {total.toLocaleString(
                    "en-IN"
                  )}
                </p>

              </div>


              {/* SAVINGS */}

              <div className="mt-5 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">

                <Tag
                  size={19}
                  className="text-green-600"
                />

                <p className="text-xs font-semibold text-green-700">
                  You are saving ₹
                  {discount.toLocaleString(
                    "en-IN"
                  )}{" "}
                  on this order
                </p>

              </div>

            </section>



            {/* =================================================
                WHY SHOP WITH HONEYVISION
            ================================================= */}

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-extrabold">
                Why Shop With HoneyVision?
              </h2>


              <div className="mt-6 space-y-5">

                <TrustItem
                  icon={ShieldCheck}
                  title="100% Secure Payments"
                  description="Your payment information is safe with us."
                />

                <TrustItem
                  icon={PackageCheck}
                  title="Genuine Products"
                  description="We sell only original and quality products."
                />

                <TrustItem
                  icon={Truck}
                  title="Fast & Reliable Delivery"
                  description="On-time delivery across India."
                />

                <TrustItem
                  icon={Headphones}
                  title="24/7 Customer Support"
                  description="We are here to help you anytime."
                />

              </div>


              {/* PAYMENT BADGES */}

              <div className="mt-6 border-t border-gray-200 pt-5">

                <p className="mb-3 text-xs font-semibold text-gray-500">
                  Secure payment partners
                </p>

                <div className="flex flex-wrap gap-2">

                  <PaymentBadge text="PCI DSS" />

                  <PaymentBadge text="Mastercard" />

                  <PaymentBadge text="VISA" />

                  <PaymentBadge text="RuPay" />

                  <PaymentBadge text="UPI" />

                </div>

              </div>

            </section>

          </div>

        </div>

      </main>



      {/* =====================================================
          BOTTOM BENEFITS
      ===================================================== */}

      <section className="mx-auto max-w-[1450px] px-6 pb-10 lg:px-10">

        <div className="overflow-hidden rounded-xl bg-[#061a36]">

          <div className="grid md:grid-cols-2 lg:grid-cols-4">

            <BottomBenefit
              icon={ShieldCheck}
              title="Secure Checkout"
              description="End-to-end encrypted secure payment."
            />

            <BottomBenefit
              icon={PackageCheck}
              title="Genuine Products"
              description="100% original products with warranty."
            />

            <BottomBenefit
              icon={Truck}
              title="Fast Delivery"
              description="Quick and safe delivery across India."
            />

            <BottomBenefit
              icon={Headphones}
              title="Easy Support"
              description="24/7 customer support for your help."
            />

          </div>

        </div>

      </section>



      {/* =====================================================
          SUCCESS MODAL
      ===================================================== */}

      {showSuccess && (

        <PaymentSuccessModal
          total={total}
          orderId={orderId}
          onClose={() => setShowSuccess(false)}
        />

      )}

    </div>

  );
};


/* =============================================================
   CHECKOUT STEPS
============================================================= */

const CheckoutSteps = () => {

  const steps = [
    {
      icon: ShoppingCart,
      title: "Cart",
    },
    {
      icon: MapPin,
      title: "Address",
    },
    {
      icon: CreditCard,
      title: "Payment",
      active: true,
    },
    {
      icon: Check,
      title: "Place Order",
    },
  ];


  return (

    <div className="flex items-start justify-between">

      {steps.map((step, index) => {

        const Icon = step.icon;

        return (

          <React.Fragment key={step.title}>

            <div className="flex flex-col items-center">

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  step.active
                    ? "bg-[#fbb900] text-[#071426]"
                    : index < 2
                    ? "bg-[#061a36] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >

                <Icon size={20} />

              </div>

              <span className="mt-2 text-xs font-semibold">
                {step.title}
              </span>

            </div>


            {index !== steps.length - 1 && (

              <div className="mt-5 h-[2px] flex-1 bg-gray-300" />

            )}

          </React.Fragment>

        );

      })}

    </div>

  );

};


/* =============================================================
   STEP NUMBER
============================================================= */

const StepNumber = ({ number }) => {

  return (

    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#061a36] text-sm font-bold text-white">

      {number}

    </div>

  );

};


/* =============================================================
   UPI PAYMENT
============================================================= */

const UPIPayment = ({
  upiId,
  setUpiId,
  selectedUpiApp,
  setSelectedUpiApp,
  upiApps,
  orderId,
  copyOrderId,
  copied,
}) => {

  return (

    <div>

      <h3 className="text-sm font-bold">
        UPI ID
      </h3>


      <input
        type="text"
        value={upiId}
        onChange={(e) =>
          setUpiId(e.target.value)
        }
        placeholder="Enter UPI ID (e.g. name@paytm)"
        className="mt-3 h-12 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-[#fbb900] focus:ring-2 focus:ring-[#fbb900]/20"
      />


      {/* UPI APPS */}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

        {upiApps.map((app) => {

          const active =
            selectedUpiApp === app.id;

          return (

            <button
              key={app.id}
              onClick={() =>
                setSelectedUpiApp(app.id)
              }
              className={`rounded-lg border p-3 transition ${
                active
                  ? "border-[#fbb900] bg-[#fffaf0]"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >

              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-lg font-extrabold">

                {app.logo}

              </div>

              <p className="mt-2 text-xs font-semibold">
                {app.name}
              </p>

            </button>

          );

        })}

      </div>


      {/* OR */}

      <div className="my-6 flex items-center gap-3">

        <div className="h-px flex-1 bg-gray-200" />

        <span className="text-xs text-gray-500">
          or Scan & Pay
        </span>

        <div className="h-px flex-1 bg-gray-200" />

      </div>


      {/* QR CODE */}

      <div className="flex flex-col items-center">

        <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-white p-2">

          <FakeQRCode />

          <div className="absolute flex h-10 w-10 items-center justify-center rounded-lg bg-[#061a36] shadow-md">

            <ShieldCheck
              size={24}
              className="text-[#fbb900]"
            />

          </div>

        </div>


        <p className="mt-3 text-xs text-gray-500">
          Scan this QR code with any UPI app
        </p>


        {/* ORDER ID */}

        <div className="mt-4 flex items-center gap-2">

          <span className="text-xs text-gray-500">
            Order ID:
          </span>

          <span className="rounded bg-gray-100 px-3 py-1 text-sm font-semibold">
            {orderId}
          </span>

          <button
            onClick={copyOrderId}
            className="text-gray-500 hover:text-[#071426]"
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


      {/* SECURITY */}

      <div className="mt-5 flex items-center gap-3 rounded-lg border border-[#f5d88a] bg-[#fffaf0] px-4 py-3">

        <ShieldCheck
          size={21}
          className="text-[#e9a900]"
        />

        <p className="text-xs font-semibold text-gray-700">
          Your payment information is secure and encrypted.
        </p>

      </div>

    </div>

  );

};


/* =============================================================
   CASH ON DELIVERY
============================================================= */

const CashOnDeliveryPayment = () => {
  return (
    <div>
      <h3 className="text-sm font-bold">Pay on Delivery</h3>

      <p className="mt-2 text-sm text-gray-500">
        Pay the full amount in cash when your order arrives at your doorstep.
      </p>

      <div className="mt-5 rounded-lg border border-[#f5d88a] bg-[#fffaf0] p-4 text-sm text-gray-700">
        <p className="font-semibold">How it works</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Select Cash on Delivery at checkout.</li>
          <li>Our delivery executive will collect the amount during delivery.</li>
          <li>Ideal for easy doorstep payments and convenience.</li>
        </ul>
      </div>
    </div>
  );
};

/* =============================================================
   CARD PAYMENT
============================================================= */

const CardPayment = ({
  saveCard,
  setSaveCard,
}) => {

  return (

    <div>

      <h3 className="text-sm font-bold">
        Enter Card Details
      </h3>


      <div className="mt-4 space-y-4">

        <input
          type="text"
          placeholder="Card Number"
          className="h-12 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-[#fbb900]"
        />


        <div className="grid grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="MM / YY"
            className="h-12 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-[#fbb900]"
          />

          <input
            type="password"
            placeholder="CVV"
            className="h-12 rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-[#fbb900]"
          />

        </div>


        <input
          type="text"
          placeholder="Cardholder Name"
          className="h-12 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-[#fbb900]"
        />


        <label className="flex items-center gap-3 text-sm">

          <input
            type="checkbox"
            checked={saveCard}
            onChange={(e) =>
              setSaveCard(e.target.checked)
            }
            className="h-4 w-4 accent-[#fbb900]"
          />

          Save card details for faster checkout

        </label>

      </div>

    </div>

  );

};


/* =============================================================
   NET BANKING
============================================================= */

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

      <h3 className="text-sm font-bold">
        Select Your Bank
      </h3>


      <div className="mt-5 grid grid-cols-2 gap-3">

        {banks.map((bank) => (

          <button
            key={bank}
            className="rounded-lg border border-gray-200 p-4 text-left text-sm font-semibold transition hover:border-[#fbb900] hover:bg-[#fffaf0]"
          >

            {bank}

          </button>

        ))}

      </div>

    </div>

  );

};


/* =============================================================
   WALLET
============================================================= */

const WalletPayment = () => {

  const wallets = [
    "Paytm Wallet",
    "Mobikwik",
    "Amazon Pay",
    "Freecharge",
  ];


  return (

    <div>

      <h3 className="text-sm font-bold">
        Select Wallet
      </h3>


      <div className="mt-5 space-y-3">

        {wallets.map((wallet) => (

          <button
            key={wallet}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 text-sm font-semibold hover:border-[#fbb900]"
          >

            {wallet}

            <ChevronRight size={17} />

          </button>

        ))}

      </div>

    </div>

  );

};


/* =============================================================
   EMI
============================================================= */

const EMIPayment = () => {

  return (

    <div>

      <h3 className="text-sm font-bold">
        EMI Options
      </h3>


      <div className="mt-5 space-y-3">

        <button className="flex w-full justify-between rounded-lg border border-gray-200 p-4 text-left hover:border-[#fbb900]">

          <div>

            <p className="text-sm font-bold">
              3 Months EMI
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Available on eligible cards
            </p>

          </div>

          <span className="font-bold">
            ₹8,316/mo
          </span>

        </button>


        <button className="flex w-full justify-between rounded-lg border border-gray-200 p-4 text-left hover:border-[#fbb900]">

          <div>

            <p className="text-sm font-bold">
              6 Months EMI
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Available on eligible cards
            </p>

          </div>

          <span className="font-bold">
            ₹4,158/mo
          </span>

        </button>

      </div>

    </div>

  );

};


/* =============================================================
   PAY LATER
============================================================= */

const PayLaterPayment = () => {

  return (

    <div>

      <h3 className="text-sm font-bold">
        Pay Later
      </h3>


      <p className="mt-2 text-sm text-gray-500">
        Choose from available Pay Later providers
        and complete your purchase securely.
      </p>


      <div className="mt-5 space-y-3">

        <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 font-semibold hover:border-[#fbb900]">

          <span>Amazon Pay Later</span>

          <ChevronRight size={18} />

        </button>


        <button className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 font-semibold hover:border-[#fbb900]">

          <span>LazyPay</span>

          <ChevronRight size={18} />

        </button>

      </div>

    </div>

  );

};


/* =============================================================
   TRUST ITEM
============================================================= */

const TrustItem = ({
  icon: Icon,
  title,
  description,
}) => {

  return (

    <div className="flex gap-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center">

        <Icon
          size={27}
          strokeWidth={1.5}
          className="text-[#071426]"
        />

      </div>


      <div>

        <h3 className="text-sm font-bold">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>

      </div>

    </div>

  );

};


/* =============================================================
   PAYMENT BADGE
============================================================= */

const PaymentBadge = ({ text }) => {

  return (

    <div className="rounded border border-gray-200 bg-white px-3 py-2 text-[10px] font-extrabold text-gray-700">
      {text}
    </div>

  );

};


/* =============================================================
   BOTTOM BENEFIT
============================================================= */

const BottomBenefit = ({
  icon: Icon,
  title,
  description,
}) => {

  return (

    <div className="flex items-center gap-4 border-white/15 p-6 lg:border-r">

      <Icon
        size={38}
        strokeWidth={1.5}
        className="shrink-0 text-[#fbb900]"
      />


      <div>

        <h3 className="text-sm font-bold text-white">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-gray-400">
          {description}
        </p>

      </div>

    </div>

  );

};


/* =============================================================
   FAKE QR CODE
============================================================= */

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

    <div className="grid h-full w-full grid-cols-15 gap-[2px] bg-white p-1">

      {blocks}

    </div>

  );

};


/* =============================================================
   SUCCESS MODAL
============================================================= */

const PaymentSuccessModal = ({
  total,
  orderId,
  onClose,
}) => {

  return (

    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">


        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100"
        >

          <X size={19} />

        </button>


        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">

          <CheckCircle2
            size={45}
            className="text-green-600"
          />

        </div>


        <h2 className="mt-6 text-2xl font-extrabold">
          Payment Successful!
        </h2>


        <p className="mt-3 text-sm leading-6 text-gray-500">

          Your payment of{" "}

          <span className="font-bold text-[#071426]">
            ₹{total.toLocaleString("en-IN")}
          </span>

          {" "}has been processed successfully.

        </p>


        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">

          <div className="flex justify-between text-sm">

            <span className="text-gray-500">
              Order ID
            </span>

            <span className="font-bold">
              {orderId}
            </span>

          </div>


          <div className="mt-3 flex justify-between text-sm">

            <span className="text-gray-500">
              Payment Status
            </span>

            <span className="font-bold text-green-600">
              Paid
            </span>

          </div>

        </div>


        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-[#061a36] py-3.5 text-sm font-bold text-white hover:bg-[#fbb900] hover:text-[#071426]"
          >
            Order placed successfully
          </button>
        </div>

      </div>

    </div>

  );

};


export default Payment;