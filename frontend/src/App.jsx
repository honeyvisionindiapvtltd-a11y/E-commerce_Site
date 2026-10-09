import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ArrowUp, MessageCircle } from 'lucide-react'
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from './context/useAuth.js'
import { Capacitor } from '@capacitor/core'
import { NotificationContainer } from './components/Notifications/NotificationComponents.jsx'
import useNotifications from './hooks/useNotifications.js'
import { initializeNativeApp } from './services/nativeInit'
import { networkStatus } from './services/networkStatus'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import WebLoginPrompt from './components/WebLoginPrompt.jsx'
const Home = lazy(() => import('./Home.jsx'));
const ChatWidget = lazy(() => import('./components/chat/ChatWidget.jsx'));
const GoogleMapsProvider = lazy(() => import('./components/GoogleMapsProvider.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Products = lazy(() => import('./pages/Products.jsx'));
const Categories = lazy(() => import('./pages/Categories.jsx'));
const Category = lazy(() => import('./pages/Category.jsx'));
const ProductDetails = lazy(() => import('./pages/ProductDetails.jsx'));
const Brands = lazy(() => import('./pages/Brands.jsx'));
const Solutions = lazy(() => import('./pages/Solutions.jsx'));
const Technology = lazy(() => import('./pages/Technology.jsx'));
const Services = lazy(() => import('./pages/Services.jsx'));
const Industries = lazy(() => import('./pages/Industries.jsx'));
const Blog = lazy(() => import('./pages/Blog.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const AITools = lazy(() => import('./pages/AITools.jsx'));
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const Orders = lazy(() => import('./pages/Orders.jsx'));
const OrderTracking = lazy(() => import('./pages/OrderTracking.jsx'));
const Addresses = lazy(() => import('./pages/Addresses.jsx'));
const Payment = lazy(() => import('./pages/Payment.jsx'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess.jsx'));
const PaymentFailure = lazy(() => import('./pages/PaymentFailure.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const AccountSettings = lazy(() => import('./pages/AccountSettings.jsx'));
const DealerLocator = lazy(() => import('./pages/DealerLocator.jsx'));
const ComboDeals = lazy(() => import('./pages/ComboDeals.jsx'));
const Support = lazy(() => import('./pages/Support.jsx'));
const SupportTickets = lazy(() => import('./pages/SupportTickets.jsx'));
const SupportTicketDetails = lazy(() => import('./pages/SupportTicketDetails.jsx'));
const Compare = lazy(() => import('./pages/Compare.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const EditProfile = lazy(() => import('./pages/EditProfile.jsx'));
const Delivery = lazy(() => import('./pages/Delivery.jsx'));
const DeliveryAgentDashboard = lazy(() => import('./pages/DeliveryAgentDashboard.jsx'));
const AgentInstallationDashboard = lazy(() => import('./pages/AgentInstallationDashboard.jsx'));
const Installation = lazy(() => import('./pages/Installation.jsx'));
const InstallationSuccess = lazy(() => import('./pages/InstallationSuccess.jsx'));
const InstallationPaymentFailure = lazy(() => import('./pages/InstallationPaymentFailure.jsx'));
const InstallationHistory = lazy(() => import('./pages/InstallationHistory.jsx'));
const CustomerInstallationDetails = lazy(() => import('./pages/CustomerInstallationDetails.jsx'));
const AMC = lazy(() => import('./pages/AMC.jsx'));
const MyAMC = lazy(() => import('./pages/MyAMC.jsx'));
const RequestDemo = lazy(() => import('./pages/RequestDemo.jsx'));
const GetStarted = lazy(() => import('./pages/GetStarted.jsx'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail.jsx'));
const ScanProduct = lazy(() => import('./pages/ScanProduct.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const InformationPage = lazy(() => import('./pages/InformationPage.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const AdminRoutes = lazy(() => import('./pages/admin/AdminRoutes.jsx'));
const TrackOrder = lazy(() => import('./pages/TrackOrder.jsx'));
import NotificationCenter from "./components/Notifications/NotificationCenter.jsx";
import './App.css'
import { getCanonicalUrl, removeJsonLd, SEO_DEFAULTS, setPageMetadata } from './utils/seoMetadata';

function RoleRoute({ roles, children }) {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location }} />;
  const canUseCustomerExperience = user?.role === "admin" && roles.includes("customer");
  if (!roles.includes(user?.role) && !canUseCustomerExperience) return <Navigate to={user?.role === "admin" ? "/admin" : user?.role === "delivery_agent" ? "/delivery-agent" : "/"} replace />;
  return children;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const { notifications, removeNotification } = useNotifications();
  const [isChatWidgetLoaded, setIsChatWidgetLoaded] = useState(false);
  const [openChatOnMount, setOpenChatOnMount] = useState(false);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [showBackToTop, setShowBackToTop] = useState(() => window.scrollY > 300);
  const [isDarkTheme, setIsDarkTheme] = useState(() => localStorage.getItem('honey-vision-theme') === 'dark');
  const isWebLoginPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname)
    || location.pathname.startsWith('/reset-password/');
  const [isEntryLoginPromptDismissed, setIsEntryLoginPromptDismissed] = useState(() => (
    !Capacitor.isNativePlatform()
    && Boolean(sessionStorage.getItem('honey-vision-login-prompt-dismissed'))
  ));
  const showEntryLoginPrompt = !isLoggedIn
    && !isWebLoginPage
    && !isEntryLoginPromptDismissed;
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDeliveryAgentRoute = location.pathname.startsWith('/delivery-agent');
  const isCheckoutRoute = ['/checkout', '/payment', '/payment-methods'].includes(location.pathname);
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const needsGoogleMaps = import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
    normalizedPath === '/addresses'
    || normalizedPath === '/delivery-agent'
    || /^\/orders\/[^/]+\/tracking$/.test(normalizedPath)
    || ['/order-tracking', '/track-order', '/tracking'].includes(normalizedPath)
  );

  useEffect(() => {
    const requestChat = () => {
      if (isChatWidgetLoaded) return;
      setOpenChatOnMount(true);
      setIsChatWidgetLoaded(true);
    };
    window.addEventListener('honeyvision:open-chat', requestChat);
    return () => window.removeEventListener('honeyvision:open-chat', requestChat);
  }, [isChatWidgetLoaded]);

  const handleChatReady = useCallback(() => {
    setOpenChatOnMount(false);
  }, []);

  useEffect(() => {
    const updateBrowserNetworkStatus = () => setIsOffline(!navigator.onLine);
    const updateNativeNetworkStatus = (status) => setIsOffline(!status.connected);

    window.addEventListener('online', updateBrowserNetworkStatus);
    window.addEventListener('offline', updateBrowserNetworkStatus);
    networkStatus.onStatusChange('app-offline-banner', updateNativeNetworkStatus);
    initializeNativeApp(navigate);

    return () => {
      window.removeEventListener('online', updateBrowserNetworkStatus);
      window.removeEventListener('offline', updateBrowserNetworkStatus);
      networkStatus.offStatusChange('app-offline-banner');
    };
  }, [navigate]);

  const handleDismissWebLoginPrompt = () => {
    if (!Capacitor.isNativePlatform()) {
      sessionStorage.setItem('honey-vision-login-prompt-dismissed', 'true');
    }
    setIsEntryLoginPromptDismissed(true);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', isDarkTheme);
    localStorage.setItem('honey-vision-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  useEffect(() => {
    const path = location.pathname;
    const query = new URLSearchParams(location.search);
    const productMatch = path.match(/^\/products\/([^/]+)\/?$/);
    const privatePrefixes = [
      '/admin', '/dashboard', '/cart', '/checkout', '/login', '/register',
      '/forgot-password', '/reset-password', '/profile', '/edit-profile',
      '/addresses', '/account-settings', '/orders', '/wishlist', '/payment',
      '/notifications', '/support', '/delivery-agent', '/my-amc',
      '/installation/history',
    ];
    const trackingPaths = ['/track-order', '/order-tracking', '/tracking'];
    const isPrivate = privatePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
    const isTracking = trackingPaths.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
      || /^\/orders\/[^/]+\/tracking\/?$/.test(path);
    const isFilteredProductListing = path === '/products' && (query.has('category') || query.has('subCategory'));
    const isIndexable = !isPrivate && !isTracking && !path.startsWith('/products/category/');
    let canonicalPath = path;

    if (path === '/') canonicalPath = '/';
    else if (productMatch) canonicalPath = `/products/${encodeURIComponent(decodeURIComponent(productMatch[1]))}`;
    else if (path === '/products/category/:categorySlug') canonicalPath = '/products';
    else if (isFilteredProductListing) {
      const canonicalQuery = new URLSearchParams();
      const category = query.get('category');
      const subCategory = query.get('subCategory');
      if (category) canonicalQuery.set('category', category);
      if (subCategory) canonicalQuery.set('subCategory', subCategory);
      canonicalPath = `/products?${canonicalQuery.toString()}`;
    } else if (path === '/products') canonicalPath = '/products';
    else if (path.startsWith('/products/category/')) {
      const slug = path.split('/').filter(Boolean).pop();
      canonicalPath = `/products?category=${encodeURIComponent(slug || '')}`;
    }

    const title = productMatch
      ? 'Product | Honey Vision'
      : path === '/products' || path.startsWith('/products/category/')
        ? 'Products | Honey Vision'
        : path === '/'
          ? SEO_DEFAULTS.title
          : `${path.split('/').filter(Boolean).pop()?.replaceAll('-', ' ') || 'Honey Vision'} | Honey Vision`;
    const description = path === '/' ? SEO_DEFAULTS.description : 'Explore products and services from Honey Vision.';

    setPageMetadata({
      title,
      description,
      canonicalUrl: getCanonicalUrl(canonicalPath),
      robots: isIndexable ? 'index,follow' : 'noindex,follow',
      type: productMatch ? 'product' : 'website',
    });

    if (!productMatch) removeJsonLd('honeyvision-product-jsonld', 'honeyvision-breadcrumb-jsonld');
  }, [location.pathname, location.search]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    const updateBackToTopVisibility = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateBackToTopVisibility);
  }, []);

  const appContent = (
    <div className="app-shell">
      {isOffline && (
        <div className="offline-network-banner" role="alert">
          <strong>No internet connection</strong>
          <span>Turn on your device network to continue using the app.</span>
        </div>
      )}
      {!isAdminRoute && !isDeliveryAgentRoute && !isCheckoutRoute && (
        <Navbar isDarkTheme={isDarkTheme} onToggleTheme={() => setIsDarkTheme((value) => !value)} />
      )}
      <div className={`page-content ${location.pathname === '/' || location.pathname === '/ai-tools' ? 'pb-0' : 'pb-16 lg:pb-0'}`}>
        <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-slate-500" role="status">Loading page…</div>}>
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
          <Route path="/cart" element={<Cart />} />
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
          <Route path="/installation/payment-failure" element={<InstallationPaymentFailure />} />
          <Route path="/installation/history" element={<InstallationHistory />} />
          <Route path="/installation/history/:id" element={<CustomerInstallationDetails />} />
          <Route path="/services/:serviceSlug" element={<ServiceDetail />} />
          <Route path="/amc" element={<AMC />} />
          <Route path="/my-amc" element={<RoleRoute roles={["customer"]}><MyAMC /></RoleRoute>} />
          <Route path="/my-amc/:id" element={<RoleRoute roles={["customer"]}><MyAMC /></RoleRoute>} />
          <Route path="/request-demo" element={<RequestDemo />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/scan-product" element={<ScanProduct />} />
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
        </Suspense>
      </div>
      {!isAdminRoute && !isDeliveryAgentRoute && !isCheckoutRoute && <Footer />}
      {showBackToTop && !isAdminRoute && !isDeliveryAgentRoute && !isCheckoutRoute && (
        <button
          type="button"
          className="back-to-top-button"
          aria-label="Back to top"
          title="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp size={16} strokeWidth={2} />
        </button>
      )}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      {isLoggedIn && user?.role === 'admin' && location.pathname === '/' && (
        <div className="mobile-global-notifications fixed right-4 top-4 z-[60] md:hidden">
          <NotificationCenter />
        </div>
      )}
      {!isAdminRoute && !isDeliveryAgentRoute && !isCheckoutRoute && (
        isChatWidgetLoaded ? (
          <Suspense fallback={null}>
            <ChatWidget initialOpen={openChatOnMount} onReady={handleChatReady} />
          </Suspense>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOpenChatOnMount(true);
              setIsChatWidgetLoaded(true);
            }}
            className="chat-widget-launcher fixed bottom-20 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#f4b400] text-[#071426] shadow-xl shadow-[#071426]/25 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#f4b400]/40 sm:bottom-5"
            aria-label="Open Honey Vision support chat"
          >
            <MessageCircle size={25} />
          </button>
        )
      )}
    </div>
  );

  const content = (
    <>
      {showEntryLoginPrompt ? (
        <WebLoginPrompt onClose={handleDismissWebLoginPrompt} />
      ) : null}
      {appContent}
    </>
  );

  return needsGoogleMaps
    ? (
      <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-slate-500" role="status">Loading page…</div>}>
        <GoogleMapsProvider>{content}</GoogleMapsProvider>
      </Suspense>
    )
    : content;
}

export default App
