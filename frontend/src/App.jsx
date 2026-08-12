import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './Home.jsx'
import About from './pages/About.jsx'
import Products from './pages/Products.jsx'
import Categories from './pages/Categories.jsx'
import Category from './pages/Category.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Solutions from './pages/Solutions.jsx'
import Technology from './pages/Technology.jsx'
import Services from './pages/Services.jsx'
import Industries from './pages/Industries.jsx'
import Blog from './pages/Blog.jsx'
import Contact from './pages/Contact.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Cart from './pages/Cart.jsx'
import AITools from './pages/AITools.jsx'
import Wishlist from './pages/Wishlist.jsx'
import Checkout from './pages/Checkout.jsx'
import Orders from './pages/Orders.jsx'
import OrderTracking from './pages/OrderTracking.jsx'
import Addresses from './pages/Addresses.jsx'
import Payment from './pages/Payment.jsx'
import PaymentSuccess from './pages/PaymentSuccess.jsx'
import Notifications from './pages/Notifications.jsx'
import AccountSettings from './pages/AccountSettings.jsx'
import DealerLocator from './pages/DealerLocator.jsx'
import ComboDeals from './pages/ComboDeals.jsx'
import Support from './pages/Support.jsx'
import Compare from './pages/Compare.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import EditProfile from './pages/EditProfile.jsx'
import Delivery from './pages/Delivery.jsx'
import Installation from './pages/Installation.jsx'
import InstallationSuccess from './pages/InstallationSuccess.jsx'
import InstallationHistory from './pages/InstallationHistory.jsx'
import AMC from "./pages/AMC";
import RequestDemo from './pages/RequestDemo.jsx'
import GetStarted from './pages/GetStarted.jsx'
import ServiceDetail from './pages/ServiceDetail.jsx'
import NotFound from './pages/NotFound.jsx'
import Register from './pages/Register.jsx'
import './App.css'

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/category/:categorySlug" element={<Category />} />
          <Route path="/products/:productId" element={<ProductDetails />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/technology" element={<Technology />} />
          <Route path="/services" element={<Services />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/blogs" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment-methods" element={<Payment />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-tracking" element={<OrderTracking />} />
          <Route path="/track-order" element={<OrderTracking />} />
          <Route path="/dealer-locator" element={<DealerLocator />} />
          <Route path="/combo-deals" element={<ComboDeals />} />
          <Route path="/support" element={<Support />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/installation" element={<Installation />} />
          <Route path="/installation/success" element={<InstallationSuccess />} />
          <Route path="/installation/history" element={<InstallationHistory />} />
          <Route path="/services/:serviceSlug" element={<ServiceDetail />} />
          <Route path="/amc" element={<AMC />} />
          <Route path="/request-demo" element={<RequestDemo />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

export default App
