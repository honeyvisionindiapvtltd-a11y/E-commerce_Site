import { useEffect, useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useCommerce } from './context/index.js'
import { APIProvider } from '@vis.gl/react-google-maps'
import { NotificationContainer } from './components/Notifications/NotificationComponents.jsx'
import useNotifications from './hooks/useNotifications.js'
import { initializeNativeApp } from './services/nativeInit'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './Home.jsx'
import About from './pages/About.jsx'
import Products from './pages/Products.jsx'
import Categories from './pages/Categories.jsx'
import Category from './pages/Category.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Brands from './pages/Brands.jsx'
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
import PaymentFailure from './pages/PaymentFailure.jsx'
import Notifications from './pages/Notifications.jsx'
import AccountSettings from './pages/AccountSettings.jsx'
import DealerLocator from './pages/DealerLocator.jsx'
import ComboDeals from './pages/ComboDeals.jsx'
import Support from './pages/Support.jsx'
import SupportTickets from './pages/SupportTickets.jsx'
import SupportTicketDetails from './pages/SupportTicketDetails.jsx'
import Compare from './pages/Compare.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Profile from './pages/Profile.jsx'
import EditProfile from './pages/EditProfile.jsx'
import Delivery from './pages/Delivery.jsx'
import DeliveryAgentDashboard from './pages/DeliveryAgentDashboard.jsx'
import AgentInstallationDashboard from './pages/AgentInstallationDashboard.jsx'
import Installation from './pages/Installation.jsx'
import InstallationSuccess from './pages/InstallationSuccess.jsx'
import InstallationHistory from './pages/InstallationHistory.jsx'
import CustomerInstallationDetails from './pages/CustomerInstallationDetails.jsx'
import AMC from "./pages/AMC";
import RequestDemo from './pages/RequestDemo.jsx'
import GetStarted from './pages/GetStarted.jsx'
import ServiceDetail from './pages/ServiceDetail.jsx'
import NotFound from './pages/NotFound.jsx'
import InformationPage from './pages/InformationPage.jsx'
import Register from './pages/Register.jsx'
import AdminRoutes from "./pages/admin/AdminRoutes.jsx";
import TrackOrder from "./pages/TrackOrder";
import ChatWidget from "./components/chat/ChatWidget.jsx";
import NotificationCenter from "./components/Notifications/NotificationCenter.jsx";
import './App.css'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function RoleRoute({ roles, children }) {
  const { isLoggedIn, user } = useCommerce();
  const location = useLocation();
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!roles.includes(user?.role)) return <Navigate to={user?.role === "admin" ? "/admin" : user?.role === "delivery_agent" ? "/delivery-agent" : "/"} replace />;
  return children;
}

function App() {
  const location = useLocation();
  const { isLoggedIn, user } = useCommerce();
  const { notifications, removeNotification } = useNotifications();
  const [isDarkTheme, setIsDarkTheme] = useState(() => localStorage.getItem('honey-vision-theme') === 'dark');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDeliveryAgentRoute = location.pathname.startsWith('/delivery-agent');

  useEffect(() => {
    // Initialize native app services on mount
    initializeNativeApp();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', isDarkTheme);
    localStorage.setItem('honey-vision-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  const appContent = (
    <div className="app-shell">
      {!isAdminRoute && !isDeliveryAgentRoute && (
        <Navbar isDarkTheme={isDarkTheme} onToggleTheme={() => setIsDarkTheme((value) => !value)} />
      )}
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/products/category/:categorySlug" element={<Category />} />
          <Route path="/products/:productId" element={<ProductDetails />} />
          <Route
            path="/admin/*"
            element={
              isLoggedIn && user?.role === 'admin' ? (
                <AdminRoutes />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/categories" element={<Categories />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/technology" element={<Technology />} />
          <Route path="/services" element={<Services />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/blogs" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/warranty" element={<InformationPage />} />
          <Route path="/faqs" element={<InformationPage />} />
          <Route path="/privacy-policy" element={<InformationPage />} />
          <Route path="/terms" element={<InformationPage />} />
          <Route path="/dashboard" element={<RoleRoute roles={["customer"]}><Dashboard /></RoleRoute>} />
          <Route path="/cart" element={<RoleRoute roles={["customer"]}><Cart /></RoleRoute>} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/wishlist" element={<RoleRoute roles={["customer"]}><Wishlist /></RoleRoute>} />
          <Route path="/orders" element={<RoleRoute roles={["customer"]}><Orders /></RoleRoute>} />
          <Route path="/orders/:id/tracking" element={<RoleRoute roles={["customer"]}><OrderTracking /></RoleRoute>} />
          <Route path="/addresses" element={<RoleRoute roles={["customer"]}><Addresses /></RoleRoute>} />
          <Route path="/payment" element={<RoleRoute roles={["customer"]}><Payment /></RoleRoute>} />
          <Route path="/payment/success" element={<RoleRoute roles={["customer"]}><PaymentSuccess /></RoleRoute>} />
          <Route path="/payment/failure" element={<RoleRoute roles={["customer"]}><PaymentFailure /></RoleRoute>} />
          <Route path="/payment-methods" element={<RoleRoute roles={["customer"]}><Payment /></RoleRoute>} />
          <Route path="/notifications" element={<RoleRoute roles={["customer"]}><Notifications /></RoleRoute>} />
          <Route path="/account-settings" element={<RoleRoute roles={["customer"]}><AccountSettings /></RoleRoute>} />
          <Route path="/checkout" element={<RoleRoute roles={["customer"]}><Checkout /></RoleRoute>} />
          <Route path="/order-tracking" element={<OrderTracking />} />
          <Route path="/track-order" element={<OrderTracking />} />
          <Route path="/tracking" element={<OrderTracking />} />
          <Route path="/dealer-locator" element={<DealerLocator />} />
          <Route path="/combo-deals" element={<ComboDeals />} />
          <Route path="/support" element={<RoleRoute roles={["customer"]}><Support /></RoleRoute>} />
          <Route path="/support/tickets" element={<RoleRoute roles={["customer"]}><SupportTickets /></RoleRoute>} />
          <Route path="/support/tickets/:ticketId" element={<RoleRoute roles={["customer"]}><SupportTicketDetails /></RoleRoute>} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/profile" element={<RoleRoute roles={["customer"]}><Profile /></RoleRoute>} />
          <Route path="/edit-profile" element={<RoleRoute roles={["customer"]}><EditProfile /></RoleRoute>} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/installation" element={<Installation />} />
          <Route path="/installation/success" element={<InstallationSuccess />} />
          <Route path="/installation/history" element={<InstallationHistory />} />
          <Route path="/installation/history/:id" element={<CustomerInstallationDetails />} />
          <Route path="/services/:serviceSlug" element={<ServiceDetail />} />
          <Route path="/amc" element={<AMC />} />
          <Route path="/request-demo" element={<RequestDemo />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/register" element={<Register />} />
          <Route
  path="/track-order/:trackingNumber"
  element={<TrackOrder />}
/>
          <Route
            path="/delivery-agent"
            element={
              isLoggedIn && user?.role === 'delivery_agent' ? (
                <DeliveryAgentDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/delivery-agent/installations"
            element={
              isLoggedIn && user?.role === 'delivery_agent' ? (
                <AgentInstallationDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {!isAdminRoute && !isDeliveryAgentRoute && <Footer />}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      {isLoggedIn && !isAdminRoute && <div className="fixed right-4 top-4 z-40"><NotificationCenter /></div>}
      {!isAdminRoute && !isDeliveryAgentRoute && <ChatWidget />}
    </div>
  );

  return GOOGLE_MAPS_API_KEY
    ? <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places", "geocoding", "routes"]}>{appContent}</APIProvider>
    : appContent;
}

export default App
