import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  Camera,
  Package,
  PackageCheck,
  Truck,
  CheckCircle,
  Clock,
  ShieldCheck,
  Edit3,
  Phone,
  Mail,
  Headphones,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCommerce } from "../context/CommerceContext";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, orders, wishlist, addresses, paymentMethods, notifications, products, logout } = useCommerce();

  const displayProfile = {
    ...profile,
    fullName: user?.name || profile.fullName,
    email: user?.email || profile.email,
    phone: user?.phone || profile.phone,
    location: user?.location || profile.location,
    address: user?.address || profile.address,
    city: user?.city || profile.city,
    state: user?.state || profile.state,
    pinCode: user?.pinCode || profile.pinCode,
    country: user?.country || profile.country,
    memberSince: profile.memberSince,
  };

  const userId = user?.id || user?._id || null;
  const userAddresses = userId ? addresses.filter((address) => address.userId === userId) : addresses;
  const defaultAddress = userAddresses.find((address) => address.isDefault) || {};
  const currentAddress = {
    type: defaultAddress.type || (displayProfile.address ? "Home" : ""),
    label: defaultAddress.label || (displayProfile.address ? "Saved Address" : ""),
    fullName: defaultAddress.fullName || displayProfile.fullName || "",
    phone: defaultAddress.phone || displayProfile.phone || "",
    address: defaultAddress.address || displayProfile.address || "",
    city: defaultAddress.city || displayProfile.city || "",
    state: defaultAddress.state || displayProfile.state || "",
    pin: defaultAddress.pin || displayProfile.pinCode || "",
    country: defaultAddress.country || displayProfile.country || "",
    isDefault: Boolean(defaultAddress.isDefault),
    hasValue: Boolean(defaultAddress.address || displayProfile.address),
  };
  const ownOrders = userId ? orders.filter((order) => order.userId === userId) : [];
  const totalOrders = ownOrders.length;
  const deliveredCount = ownOrders.filter((order) => String(order.status).toLowerCase().includes("delivered")).length;
  const pendingCount = ownOrders.filter((order) => String(order.status).toLowerCase().includes("pending")).length;
  const wishlistCount = wishlist.length;
  const wishlistItems = products.filter((product) => wishlist.includes(product.id));
  const profileCompletion = Math.min(100, Math.round(((displayProfile.fullName ? 1 : 0) + (displayProfile.email ? 1 : 0) + (displayProfile.phone ? 1 : 0) + (displayProfile.address ? 1 : 0) + (displayProfile.city ? 1 : 0) + (displayProfile.pinCode ? 1 : 0) + (displayProfile.bio ? 1 : 0)) / 7 * 100));

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* =====================================================
          PROFILE HEADER
      ===================================================== */}

      <section className="bg-gradient-to-r from-[#071426] via-[#0B315A] to-[#123F6B]">

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">

          {/* Breadcrumb */}

          <div className="flex items-center gap-2 text-sm text-gray-300 mb-8">

            <span className="hover:text-white cursor-pointer">
              Home
            </span>

            <span>/</span>

            <span className="text-[#F4B400]">
              My Profile
            </span>

          </div>

          {/* Profile Information */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

            {/* User */}

            <div className="flex items-center gap-6">

              {/* Profile Image */}

              <div className="relative">

                <div className="w-28 h-28 rounded-full bg-white p-1 shadow-xl">

                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#E5E7EB] to-[#CBD5E1] flex items-center justify-center overflow-hidden">

                    <User
                      size={58}
                      className="text-[#071426]"
                    />

                  </div>

                </div>

                {/* Edit Button */}

                <button
                  className="
                    absolute
                    bottom-0
                    right-0
                    w-9
                    h-9
                    rounded-full
                    bg-[#F4B400]
                    text-[#071426]
                    flex
                    items-center
                    justify-center
                    border-4
                    border-[#071426]
                    hover:bg-yellow-400
                    transition
                  "
                >

                  <Camera size={17} />

                </button>

              </div>

              {/* User Details */}

              <div>

                <div className="flex items-center gap-3">

                  <h1 className="text-3xl md:text-4xl font-bold text-white">

                    {displayProfile.fullName}

                  </h1>

                  <span className="bg-[#F4B400] text-[#071426] text-xs font-bold px-3 py-1 rounded-full">

                    VERIFIED

                  </span>

                </div>

                <p className="text-gray-300 mt-2">

                  {displayProfile.email}

                </p>

                <div className="flex flex-wrap items-center gap-5 mt-3 text-sm text-gray-300">

                  <span className="flex items-center gap-2">

                    <MapPin size={16} />

                    {displayProfile.location}

                  </span>

                  <span className="flex items-center gap-2">

                    <User size={16} />

                    Member since {displayProfile.memberSince || "2026"}

                  </span>

                </div>

              </div>

            </div>

            {/* Edit Profile */}

            <Link
              to="/edit-profile"
              className="
                flex
                items-center
                justify-center
                gap-2
                bg-[#F4B400]
                hover:bg-yellow-400
                text-[#071426]
                font-bold
                px-7
                py-3.5
                rounded-xl
                transition
                shadow-lg
              "
            >

              <Edit3 size={18} />

              Edit Profile

            </Link>

          </div>

        </div>

      </section>


      {/* =====================================================
          MAIN PROFILE AREA
      ===================================================== */}

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">

          {/* Total Orders */}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500 text-sm">
                  Total Orders
                </p>

                <h2 className="text-3xl font-bold text-[#071426] mt-2">
                  {totalOrders}
                </h2>

              </div>

              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">

                <ShoppingBag
                  size={28}
                  className="text-[#071426]"
                />

              </div>

            </div>

            <p className="text-green-600 text-sm mt-4 font-medium">
              +4 this month
            </p>

          </div>


          {/* Delivered */}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500 text-sm">
                  Delivered
                </p>

                <h2 className="text-3xl font-bold text-[#071426] mt-2">
                  {deliveredCount}
                </h2>

              </div>

              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">

                <CheckCircle
                  size={28}
                  className="text-green-600"
                />

              </div>

            </div>

            <p className="text-gray-500 text-sm mt-4">
              Successfully delivered
            </p>

          </div>


          {/* Pending */}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500 text-sm">
                  Pending Orders
                </p>

                <h2 className="text-3xl font-bold text-[#071426] mt-2">
                  {pendingCount}
                </h2>

              </div>

              <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center">

                <Clock
                  size={28}
                  className="text-[#F4B400]"
                />

              </div>

            </div>

            <p className="text-[#D89B00] text-sm mt-4 font-medium">
              Currently processing
            </p>

          </div>


          {/* Wishlist */}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-500 text-sm">
                  Wishlist
                </p>

                <h2 className="text-3xl font-bold text-[#071426] mt-2">
                  {wishlistCount}
                </h2>

              </div>

              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">

                <Heart
                  size={28}
                  className="text-red-500"
                />

              </div>

            </div>

            <p className="text-gray-500 text-sm mt-4">
              Saved products
            </p>

          </div>

        </div>


        {/* =====================================================
            CONTENT AREA STARTS
        ===================================================== */}

        <div className="grid lg:grid-cols-12 gap-8">

          {/* SIDEBAR STARTS IN PART 2 */}

          {/* =====================================================
              ACCOUNT SIDEBAR
          ===================================================== */}

          <aside className="lg:col-span-3">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Sidebar Header */}

              <div className="bg-[#071426] px-6 py-5">

                <p className="text-xs uppercase tracking-widest text-gray-400">
                  My Account
                </p>

                <h2 className="text-xl font-bold text-white mt-1">
                  Account Dashboard
                </h2>

              </div>


              {/* Navigation */}

              <div className="p-3">

                {/* My Profile */}

                <button
                  className="
                    w-full
                    flex
                    items-center
                    gap-4
                    px-4
                    py-3.5
                    rounded-xl
                    bg-[#FFF7DB]
                    text-[#071426]
                    font-semibold
                    transition
                  "
                >

                  <User size={20} />

                  <span>
                    My Profile
                  </span>

                </button>


                {/* My Orders */}

                <Link
                  to="/orders"
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    px-4
                    py-3.5
                    rounded-xl
                    text-gray-600
                    hover:bg-gray-50
                    hover:text-[#071426]
                    transition
                    mt-1
                  "
                >

                  <span className="flex items-center gap-4">

                    <Package size={20} />

                    My Orders

                  </span>

                  <span className="text-xs font-bold bg-gray-100 px-2.5 py-1 rounded-full">

                    {totalOrders}

                  </span>

                </Link>


                {/* Wishlist */}

                <Link
                  to="/wishlist"
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    px-4
                    py-3.5
                    rounded-xl
                    text-gray-600
                    hover:bg-gray-50
                    hover:text-[#071426]
                    transition
                    mt-1
                  "
                >

                  <span className="flex items-center gap-4">

                    <Heart size={20} />

                    Wishlist

                  </span>

                  <span className="text-xs font-bold bg-red-50 text-red-500 px-2.5 py-1 rounded-full">

                    {wishlistCount}

                  </span>

                </Link>


                {/* Addresses */}

                <Link
                  to="/addresses"
                  className="
                    w-full
                    flex
                    items-center
                    gap-4
                    px-4
                    py-3.5
                    rounded-xl
                    text-gray-600
                    hover:bg-gray-50
                    hover:text-[#071426]
                    transition
                    mt-1
                  "
                >

                  <MapPin size={20} />

                  My Addresses

                </Link>


                {/* Payment Methods */}

                <Link
                  to="/payment-methods"
                  className="
                    w-full
                    flex
                    items-center
                    gap-4
                    px-4
                    py-3.5
                    rounded-xl
                    text-gray-600
                    hover:bg-gray-50
                    hover:text-[#071426]
                    transition
                    mt-1
                  "
                >

                  <CreditCard size={20} />

                  Payment Methods

                </Link>


                {/* Notifications */}

                <Link
                  to="/notifications"
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    px-4
                    py-3.5
                    rounded-xl
                    text-gray-600
                    hover:bg-gray-50
                    hover:text-[#071426]
                    transition
                    mt-1
                  "
                >

                  <span className="flex items-center gap-4">

                    <Bell size={20} />

                    Notifications

                  </span>

                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>

                </Link>


                {/* Support */}

                <Link
                  to="/support"
                  className="
                    w-full
                    flex
                    items-center
                    gap-4
                    px-4
                    py-3.5
                    rounded-xl
                    text-gray-600
                    hover:bg-gray-50
                    hover:text-[#071426]
                    transition
                    mt-1
                  "
                >

                  <HelpCircle size={20} />

                  Help & Support

                </Link>


                {/* Divider */}

                <div className="border-t border-gray-100 my-3"></div>


                {/* Account Settings */}

                <Link
                  to="/account-settings"
                  className="
                    w-full
                    flex
                    items-center
                    gap-4
                    px-4
                    py-3.5
                    rounded-xl
                    text-gray-600
                    hover:bg-gray-50
                    hover:text-[#071426]
                    transition
                  "
                >

                  <Settings size={20} />

                  Account Settings

                </Link>


                {/* Logout */}

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="
                    w-full
                    flex
                    items-center
                    gap-4
                    px-4
                    py-3.5
                    rounded-xl
                    text-red-500
                    hover:bg-red-50
                    transition
                    mt-1
                  "
                >

                  <LogOut size={20} />

                  Logout

                </button>

              </div>

            </div>


            {/* Security Card */}

            <div className="mt-6 bg-gradient-to-br from-[#071426] to-[#0B315A] rounded-2xl p-6 text-white">

              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">

                <ShieldCheck
                  size={26}
                  className="text-[#F4B400]"
                />

              </div>

              <h3 className="font-bold text-lg mt-5">

                Your Account is Secure

              </h3>

              <p className="text-gray-300 text-sm leading-6 mt-2">

                Your personal information and payment
                details are protected with secure encryption.

              </p>

              <div className="flex items-center gap-2 mt-5 text-sm text-[#F4B400]">

                <CheckCircle size={17} />

                Secure & Protected

              </div>

            </div>

          </aside>


          {/* =====================================================
              PROFILE CONTENT STARTS HERE
          ===================================================== */}

          <section className="lg:col-span-9">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                  <p className="text-sm font-semibold text-[#F4B400] uppercase tracking-wide">

                    Account Information

                  </p>

                  <h2 className="text-3xl font-bold text-[#071426] mt-2">

                    Personal Information

                  </h2>

                  <p className="text-gray-500 mt-2">

                    Manage your personal information and account details.

                  </p>

                </div>

                <button
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    border
                    border-gray-200
                    hover:border-[#F4B400]
                    hover:text-[#071426]
                    px-5
                    py-3
                    rounded-xl
                    font-semibold
                    text-gray-600
                    transition
                  "
                >

                  <Edit3 size={17} />

                  Edit Details

                </button>

              </div>


              {/* Personal Information Grid */}

              <div className="grid md:grid-cols-2 gap-6 mt-8">

                {/* Full Name */}

                <div className="border border-gray-100 rounded-xl p-5">

                  <p className="text-sm text-gray-400">
                    Full Name
                  </p>

                  <p className="font-semibold text-[#071426] mt-2">
                    {displayProfile.fullName}
                  </p>

                </div>


                {/* Email */}

                <div className="border border-gray-100 rounded-xl p-5">

                  <p className="text-sm text-gray-400">
                    Email Address
                  </p>

                  <p className="font-semibold text-[#071426] mt-2">
                    {displayProfile.email}
                  </p>

                </div>


                {/* Phone */}

                <div className="border border-gray-100 rounded-xl p-5">

                  <p className="text-sm text-gray-400">
                    Phone Number
                  </p>

                  <p className="font-semibold text-[#071426] mt-2">
                    {displayProfile.phone}
                  </p>

                </div>


                {/* Location */}

                <div className="border border-gray-100 rounded-xl p-5">

                  <p className="text-sm text-gray-400">
                    Location
                  </p>

                  <p className="font-semibold text-[#071426] mt-2">
                    {displayProfile.location}
                  </p>

                </div>

              </div>

            </div>

                        {/* =====================================================
                RECENT ORDERS
            ===================================================== */}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-8 overflow-hidden">

              {/* Header */}

              <div className="p-8 border-b border-gray-100">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                  <div>

                    <p className="text-sm font-semibold text-[#F4B400] uppercase tracking-wide">

                      Shopping Activity

                    </p>

                    <h2 className="text-3xl font-bold text-[#071426] mt-2">

                      Recent Orders

                    </h2>

                  </div>

                  <button
                    className="
                      text-[#071426]
                      font-semibold
                      hover:text-[#F4B400]
                      transition
                    "
                  >

                    View All Orders →

                  </button>

                </div>

              </div>


              {/* Orders */}

              <div className="divide-y divide-gray-100">
                {ownOrders.length === 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-[#F4B400]">
                      <PackageCheck size={28} />
                    </div>
                    <h3 className="text-xl font-semibold text-[#071426]">No recent orders</h3>
                    <p className="mt-2 text-sm text-slate-500">Your order activity will appear here once you place an order.</p>
                  </div>
                ) : (
                  ownOrders.slice(0, 3).map((order) => {
                    const firstItem = order.items?.[0] || {};
                    const productName = firstItem.product?.name || "Order item";
                    const productQty = firstItem.quantity || 0;
                    const status = String(order.status || "Pending");
                    const statusClass = status.toLowerCase().includes("delivered")
                      ? "bg-green-50 text-green-600"
                      : status.toLowerCase().includes("out for")
                        ? "bg-blue-50 text-blue-600"
                        : status.toLowerCase().includes("processing")
                          ? "bg-yellow-50 text-yellow-600"
                          : "bg-gray-50 text-gray-600";

                    return (
                      <div key={order.id} className="p-6 md:p-8">
                        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                          <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                              {firstItem.product?.image ? (
                                <img
                                  src={firstItem.product.image}
                                  alt={productName}
                                  className="w-16 h-16 object-contain"
                                />
                              ) : (
                                <span className="text-xs text-slate-400">No image</span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">ORDER #{order.id}</p>
                              <h3 className="font-bold text-[#071426] mt-1">{productName}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                Qty: {productQty}
                                {firstItem.product?.name ? ` · ${firstItem.product.name}` : ""}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">Order Status</p>
                            <span className={`inline-flex items-center gap-2 mt-2 px-3 py-2 rounded-full text-sm font-semibold ${statusClass}`}>
                              {status}
                            </span>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">Amount</p>
                            <p className="text-lg font-bold text-[#071426] mt-2">₹{Number(order.total || 0).toLocaleString("en-IN")}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">Placed on</p>
                            <p className="font-semibold text-[#071426] mt-2">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "N/A"}
                            </p>
                          </div>

                          <button
                            className="border border-gray-200 hover:border-[#F4B400] hover:bg-[#FFF9E8] px-5 py-3 rounded-xl font-semibold text-[#071426] transition"
                          >
                            View Order
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

                        {/* =====================================================
                ADDRESS + PAYMENT SECTION
            ===================================================== */}

            <div className="grid md:grid-cols-2 gap-8 mt-8">

              {/* =================================================
                  SAVED ADDRESS
              ================================================= */}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                <div className="p-6 border-b border-gray-100">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">

                        <MapPin
                          size={22}
                          className="text-[#071426]"
                        />

                      </div>

                      <div>

                        <h2 className="text-xl font-bold text-[#071426]">

                          Saved Address

                        </h2>

                        <p className="text-sm text-gray-500">

                          Your default delivery address

                        </p>

                      </div>

                    </div>

                    <button
                      className="
                        text-sm
                        font-semibold
                        text-[#071426]
                        hover:text-[#F4B400]
                        transition
                      "
                    >

                      Edit

                    </button>

                  </div>

                </div>


                <div className="p-6">

                  <div className="flex items-center justify-between">

                    <span className="text-xs font-bold uppercase tracking-wide bg-[#FFF7DB] text-[#9A7100] px-3 py-1 rounded-full">
                    {currentAddress.type}
                  </span>

                  <span className="text-xs text-green-600 font-semibold">
                    {currentAddress.hasValue ? (currentAddress.isDefault ? "Default" : "Saved") : "No address set"}
                  </span>

                  </div>

                  {currentAddress.hasValue ? (
                    <>
                      <h3 className="font-bold text-[#071426] mt-5">
                        {currentAddress.fullName}
                      </h3>

                      <p className="text-gray-600 leading-7 mt-2">
                        {currentAddress.address}
                        {(currentAddress.city || currentAddress.state || currentAddress.pin) && (
                          <>
                            <br />
                            {currentAddress.city && currentAddress.city}
                            {currentAddress.state ? `, ${currentAddress.state}` : ""}
                            {currentAddress.pin ? ` - ${currentAddress.pin}` : ""}
                          </>
                        )}
                        {currentAddress.country && (
                          <>
                            <br />
                            {currentAddress.country}
                          </>
                        )}
                      </p>

                      <div className="flex items-center gap-2 text-gray-500 mt-4">
                        <Phone size={16} />
                        <span>{currentAddress.phone}</span>
                      </div>
                    </>
                  ) : (
                    <div className="mt-5 rounded-2xl bg-[#F9FAFB] p-4 text-sm text-slate-600">
                      No saved address found for your account. Please add or manage your address in the Addresses section.
                    </div>
                  )}

                  <button
                    className="
                      w-full
                      mt-6
                      border
                      border-gray-200
                      hover:border-[#F4B400]
                      hover:bg-[#FFF9E8]
                      text-[#071426]
                      font-semibold
                      py-3
                      rounded-xl
                      transition
                    "
                  >
                    Manage Addresses
                  </button>

                </div>

              </div>


              {/* =================================================
                  PAYMENT METHODS
              ================================================= */}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                <div className="p-6 border-b border-gray-100">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">

                        <CreditCard
                          size={22}
                          className="text-green-600"
                        />

                      </div>

                      <div>

                        <h2 className="text-xl font-bold text-[#071426]">

                          Payment Methods

                        </h2>

                        <p className="text-sm text-gray-500">

                          Your saved payment options

                        </p>

                      </div>

                    </div>

                    <button
                      className="
                        text-sm
                        font-semibold
                        text-[#071426]
                        hover:text-[#F4B400]
                        transition
                      "
                    >

                      Manage

                    </button>

                  </div>

                </div>


                <div className="p-6 space-y-4">

                  {/* Card */}

                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => (
                      <div key={method.id} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-9 rounded-md bg-gradient-to-r from-[#071426] to-[#164D80] flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {method.type.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#071426]">
                              {method.type === "UPI"
                                ? method.holder || profile.email || "UPI Payment"
                                : `${method.type} ending in ${method.last4}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {method.type === "UPI"
                                ? "UPI Payment"
                                : `Expires ${method.expiry}`}
                            </p>
                          </div>
                        </div>
                        {method.default ? (
                          <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-semibold">
                            Default
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Available</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-gray-100 p-4 text-sm text-slate-500">
                      No payment methods available.
                    </div>
                  )}
                  {profile.email && !paymentMethods.some((method) => method.type === "UPI") && (
                    <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-9 rounded-md bg-purple-50 flex items-center justify-center">
                          <span className="text-purple-600 text-xs font-bold">UPI</span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#071426]">{profile.email}</p>
                          <p className="text-xs text-gray-500 mt-1">UPI Payment</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">Available</span>
                    </div>
                  )}


                  <button
                    className="
                      w-full
                      border
                      border-dashed
                      border-gray-300
                      hover:border-[#F4B400]
                      hover:bg-[#FFF9E8]
                      text-gray-600
                      hover:text-[#071426]
                      font-semibold
                      py-3
                      rounded-xl
                      transition
                    "
                  >

                    + Add Payment Method

                  </button>

                </div>

              </div>

            </div>


            {/* =====================================================
                ACCOUNT PREFERENCES
            ===================================================== */}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-8 overflow-hidden">

              <div className="p-8 border-b border-gray-100">

                <p className="text-sm font-semibold text-[#F4B400] uppercase tracking-wide">

                  Preferences

                </p>

                <h2 className="text-3xl font-bold text-[#071426] mt-2">

                  Account Preferences

                </h2>

                <p className="text-gray-500 mt-2">

                  Control how you receive updates and manage your account.

                </p>

              </div>


              <div className="divide-y divide-gray-100">

                {/* Order Notifications */}

                <div className="p-6 flex items-center justify-between gap-5">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">

                      <Bell
                        size={22}
                        className="text-[#071426]"
                      />

                    </div>

                    <div>

                      <h3 className="font-bold text-[#071426]">

                        Order Notifications

                      </h3>

                      <p className="text-sm text-gray-500 mt-1">

                        Receive updates about your orders and delivery.

                      </p>

                    </div>

                  </div>

                  <div className="w-12 h-7 bg-[#F4B400] rounded-full p-1 cursor-pointer">

                    <div className="w-5 h-5 bg-white rounded-full ml-auto shadow-sm"></div>

                  </div>

                </div>


                {/* Promotional Notifications */}

                <div className="p-6 flex items-center justify-between gap-5">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">

                      <ShoppingBag
                        size={22}
                        className="text-[#D89B00]"
                      />

                    </div>

                    <div>

                      <h3 className="font-bold text-[#071426]">

                        Offers & Promotions

                      </h3>

                      <p className="text-sm text-gray-500 mt-1">

                        Get notified about deals and special offers.

                      </p>

                    </div>

                  </div>

                  <div className="w-12 h-7 bg-gray-200 rounded-full p-1 cursor-pointer">

                    <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>

                  </div>

                </div>


                {/* Email Notifications */}

                <div className="p-6 flex items-center justify-between gap-5">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">

                      <Mail
                        size={22}
                        className="text-green-600"
                      />

                    </div>

                    <div>

                      <h3 className="font-bold text-[#071426]">

                        Email Updates

                      </h3>

                      <p className="text-sm text-gray-500 mt-1">

                        Receive product and account updates by email.

                      </p>

                    </div>

                  </div>

                  <div className="w-12 h-7 bg-[#F4B400] rounded-full p-1 cursor-pointer">

                    <div className="w-5 h-5 bg-white rounded-full ml-auto shadow-sm"></div>

                  </div>

                </div>

              </div>

            </div>

                        {/* =====================================================
                WISHLIST / SAVED PRODUCTS
            ===================================================== */}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-8 overflow-hidden">

              <div className="p-8 border-b border-gray-100">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                  <div>

                    <p className="text-sm font-semibold text-[#F4B400] uppercase tracking-wide">

                      Your Favorites

                    </p>

                    <h2 className="text-3xl font-bold text-[#071426] mt-2">

                      Wishlist

                    </h2>

                    <p className="text-gray-500 mt-2">

                      Products you've saved for later.

                    </p>

                  </div>

                  <button
                    className="
                      text-[#071426]
                      font-semibold
                      hover:text-[#F4B400]
                      transition
                    "
                  >

                    View Wishlist →

                  </button>

                </div>

              </div>


              <div className="grid md:grid-cols-3 gap-6 p-8">
              {wishlistItems.length > 0 ? (
                wishlistItems.map((product) => (
                  <div key={product.id} className="group border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition">
                    <div className="relative h-48 bg-gray-50 flex items-center justify-center">
                      <button
                        className="
                          absolute
                          top-3
                          right-3
                          w-9
                          h-9
                          rounded-full
                          bg-white
                          shadow-sm
                          flex
                          items-center
                          justify-center
                          text-red-500
                          z-10
                        "
                      >
                        <Heart
                          size={18}
                          fill="currentColor"
                        />
                      </button>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-40 h-40 object-contain group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    <div className="p-5">
                      <p className="text-xs text-gray-400">
                        {product.category?.toUpperCase()}
                      </p>

                      <h3 className="font-bold text-[#071426] mt-2 line-clamp-2">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-xl font-bold text-[#071426]">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            ₹{product.mrp.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/products/${product.id}`}
                        className="
                          w-full
                          mt-4
                          inline-flex
                          items-center
                          justify-center
                          bg-[#071426]
                          hover:bg-[#0B315A]
                          text-white
                          font-semibold
                          py-3
                          rounded-xl
                          transition
                        "
                      >
                        View Product
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-3xl border border-gray-100 bg-[#F9FAFB] p-8 text-center text-slate-600">
                  <h3 className="text-xl font-semibold text-[#071426]">No wishlist items yet</h3>
                  <p className="mt-2 text-sm">Save products from the shop to see them here.</p>
                  <Link
                    to="/products"
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#F4B400] px-5 py-3 font-semibold text-[#071426] transition hover:bg-yellow-400"
                  >
                    Browse Products
                  </Link>
                </div>
              )}
            </div>

            </div>


            {/* =====================================================
                HELP & SUPPORT
            ===================================================== */}

            <div className="mt-8 bg-gradient-to-r from-[#071426] to-[#0B315A] rounded-2xl p-8">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                <div>

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">

                      <HelpCircle
                        size={25}
                        className="text-[#F4B400]"
                      />

                    </div>

                    <h2 className="text-2xl font-bold text-white">

                      Need Help With Your Account?

                    </h2>

                  </div>

                  <p className="text-gray-300 mt-4 max-w-2xl leading-7">

                    Our Honey Vision support team is available to
                    help with orders, payments, delivery, products,
                    returns and technical assistance.

                  </p>

                </div>

                <button
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    bg-[#F4B400]
                    hover:bg-yellow-400
                    text-[#071426]
                    font-bold
                    px-7
                    py-4
                    rounded-xl
                    whitespace-nowrap
                    transition
                  "
                >

                  <Headphones size={19} />

                  Contact Support

                </button>

              </div>

            </div>


            {/* =====================================================
                SECURITY MESSAGE
            ===================================================== */}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center py-8">

              <ShieldCheck
                size={20}
                className="text-green-600"
              />

              <p className="text-sm text-gray-500">

                Your account information is protected with
                industry-standard security and encryption.

              </p>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}