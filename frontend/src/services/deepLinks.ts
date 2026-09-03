/**
 * Deep Link Service
 * Handles deep link navigation for both Android and iOS
 */

import { App } from '@capacitor/app';
import { useState, useEffect } from 'react';

export interface DeepLinkHandler {
  (deepLink: string, path: string): void | Promise<void>;
}

export class DeepLinkService {
  private static instance: DeepLinkService;
  private handlers: Map<string, DeepLinkHandler> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DeepLinkService {
    if (!DeepLinkService.instance) {
      DeepLinkService.instance = new DeepLinkService();
    }
    return DeepLinkService.instance;
  }

  /**
   * Initialize deep link handling
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Handle deep links when app is opened via URL
      App.addListener('appUrlOpen', async (event: any) => {
        const slug = event.url.split('.app').pop();
        if (slug) {
          await this.handleDeepLink(slug);
        }
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize deep link service:', error);
    }
  }

  /**
   * Register handler for a deep link pattern
   * Example: '/product/:id' -> handler called with matched params
   */
  registerHandler(pattern: string, handler: DeepLinkHandler): void {
    this.handlers.set(pattern, handler);
  }

  /**
   * Handle incoming deep link
   */
  private async handleDeepLink(slug: string): Promise<void> {
    console.log('Handling deep link:', slug);

    // Supported patterns:
    // /product/:id
    // /products/:id
    // /orders/:id
    // /orders/:id/tracking

    if (slug.match(/^\/product\/\d+$/) || slug.match(/^\/products\/\d+$/)) {
      const id = slug.split('/').pop();
      window.location.hash = `/product/${id}`;
    } else if (slug.match(/^\/orders\/[^/]+$/)) {
      const id = slug.split('/').pop();
      window.location.hash = `/orders/${id}`;
    } else if (slug.match(/^\/orders\/[^/]+\/tracking$/)) {
      const id = slug.split('/')[2];
      window.location.hash = `/orders/${id}/tracking`;
    } else {
      console.log('Unhandled deep link pattern:', slug);
    }
  }

  /**
   * Get base URL for deep links
   */
  getDeepLinkBaseUrl(): string {
    return 'https://honeyvision.in'; // or your production domain
  }
}

export const deepLinks = DeepLinkService.getInstance();

/**
 * React Hook for deep link handling
 */
export function useDeepLinkHandler(
  pattern: string,
  handler: DeepLinkHandler
): void {
  useEffect(() => {
    deepLinks.registerHandler(pattern, handler);
    return () => {
      // Cleanup if needed
    };
  }, [pattern, handler]);
}
