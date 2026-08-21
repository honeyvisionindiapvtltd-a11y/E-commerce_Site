import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Toast Notification Component
 * Displays real-time notifications to users
 */
export function Toast({ message, type = 'info', onClose, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-800',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: AlertCircle,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-800',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-800',
      icon: Info,
    },
  };

  const { bg, border, text, icon: Icon } = config[type] || config.info;

  return (
    <div className={`${bg} border-l-4 ${border} ${text} p-4 rounded-lg shadow-lg flex items-start gap-3`}>
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <p className="flex-1">{message}</p>
      <button onClick={onClose} className="flex-shrink-0 hover:opacity-70">
        <X size={18} />
      </button>
    </div>
  );
}

/**
 * Notification Banner Component
 */
export function NotificationBanner({ title, message, type = 'info', action, onClose }) {
  const config = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600',
  };

  return (
    <div className={`${config[type]} text-white p-4 rounded-lg flex items-center justify-between`}>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm opacity-90">{message}</p>
      </div>
      <div className="flex gap-2">
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-white text-gray-900 rounded font-bold hover:bg-gray-100 transition"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className="px-2 py-1 hover:bg-white hover:bg-opacity-20 rounded transition"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

/**
 * Real-time Order Status Notification
 */
export function OrderStatusNotification({ order, onClose }) {
  return (
    <Toast
      type="info"
      message={`Order #${order.orderId} status: ${order.orderStatus?.replace(/_/g, ' ')}`}
      onClose={onClose}
    />
  );
}

/**
 * Delivery Update Notification
 */
export function DeliveryUpdateNotification({ delivery, onClose }) {
  const messages = {
    out_for_delivery: 'Your order is out for delivery!',
    delivered: 'Your order has been delivered!',
    delayed: 'Your delivery may be delayed',
  };

  return (
    <Toast
      type={delivery.status === 'delivered' ? 'success' : 'info'}
      message={messages[delivery.status] || `Delivery update: ${delivery.location}`}
      onClose={onClose}
    />
  );
}

/**
 * Inventory Alert Notification
 */
export function InventoryAlertNotification({ product, onClose }) {
  const message = product.status === 'out_of_stock' 
    ? `${product.productName} is back in stock!`
    : `${product.productName} stock is running low`;

  return (
    <Toast
      type={product.status === 'out_of_stock' ? 'success' : 'warning'}
      message={message}
      onClose={onClose}
    />
  );
}

/**
 * Price Change Notification
 */
export function PriceChangeNotification({ product, oldPrice, newPrice, onClose }) {
  const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);

  return (
    <Toast
      type="info"
      message={`${product.name} price reduced! Was ₹${oldPrice}, now ₹${newPrice} (-${discount}%)`}
      onClose={onClose}
    />
  );
}

/**
 * Chat Message Notification
 */
export function ChatMessageNotification({ sender, message, onClose, onOpen }) {
  return (
    <div className="bg-white border-l-4 border-blue-500 p-4 rounded-lg shadow-lg">
      <p className="text-sm text-gray-600">New message from <strong>{sender}</strong></p>
      <p className="text-gray-800 mt-1">{message}</p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onOpen}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
        >
          Reply
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/**
 * Notification Container
 * Manages multiple toast notifications
 */
export function NotificationContainer({ notifications, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-md">
      {notifications.map((notif) => (
        <div key={notif.id}>
          <Toast
            type={notif.type}
            message={notif.message}
            onClose={() => onRemove(notif.id)}
            duration={notif.duration || 5000}
          />
        </div>
      ))}
    </div>
  );
}