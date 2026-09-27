/**
 * Deep Link Service
 * Handles deep link navigation for both Android and iOS
 */

import { App } from '@capacitor/app';
import { useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';

export interface DeepLinkHandler {
  (deepLink: string, path: string): void | Promise<void>;
}

export class DeepLinkService {
  private static instance: DeepLinkService;
  private handlers: Map<string, DeepLinkHandler> = new Map();
  private isInitialized = false;
  private navigate: NavigateFunction | null = null;
  private lastHandledUrl = '';
  private lastHandledAt = 0;

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
  async init(navigate: NavigateFunction): Promise<void> {
    this.navigate = navigate;
    if (this.isInitialized) {
      return;
    }

    try {
      await App.addListener('appUrlOpen', ({ url }) => {
        void this.handleDeepLink(url);
      });
      this.isInitialized = true;

      const launch = await App.getLaunchUrl();
      if (launch?.url) {
        await this.handleDeepLink(launch.url);
      }
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
  private async handleDeepLink(deepLink: string): Promise<void> {
    if (!this.navigate) return;

    try {
      const url = new URL(deepLink);
      const isAllowedHttpsHost =
        url.protocol === 'https:' &&
        ['honeyvision.co.in', 'www.honeyvision.co.in'].includes(url.hostname);
      const isCustomScheme = url.protocol === 'honeyvision:';

      if (!isAllowedHttpsHost && !isCustomScheme) return;

      const path = isCustomScheme && url.host
        ? `/${url.host}${url.pathname}`
        : url.pathname;
      const normalizedUrl = `${url.protocol}//${url.host}${path}${url.search}`;
      const now = Date.now();
      if (normalizedUrl === this.lastHandledUrl && now - this.lastHandledAt < 2000) return;

      let target: string | null = null;
      const categoryMatch = path.match(/^\/products\/category\/([A-Za-z0-9_-]{1,120})\/?$/);
      const productMatch = path.match(/^\/products\/([A-Za-z0-9_-]{1,128})\/?$/);
      const trackingMatch = path.match(/^\/track-order\/([A-Za-z0-9_-]{1,128})\/?$/);

      if (categoryMatch) {
        target = `/products?category=${encodeURIComponent(categoryMatch[1])}`;
      } else if (productMatch) {
        target = `/products/${encodeURIComponent(productMatch[1])}`;
      } else if (trackingMatch) {
        target = `/track-order/${encodeURIComponent(trackingMatch[1])}`;
      } else if (path === '/products' || path === '/products/') {
        const category = url.searchParams.get('category');
        const subCategory = url.searchParams.get('subCategory');
        const validFilter = (value: string | null) =>
          value === null || /^[A-Za-z0-9_-]{1,120}$/.test(value);

        if (validFilter(category) && validFilter(subCategory) && (category || !subCategory)) {
          const params = new URLSearchParams();
          if (category) params.set('category', category);
          if (subCategory) params.set('subCategory', subCategory);
          target = params.size ? `/products?${params.toString()}` : '/products';
        }
      }

      if (target) {
        const currentPath = `${window.location.pathname}${window.location.search}`;
        if (target === currentPath) return;
        this.lastHandledUrl = normalizedUrl;
        this.lastHandledAt = now;
        this.navigate(target);
      }
    } catch {
      // Ignore malformed or unsupported external URLs.
    }
  }

  /**
   * Get base URL for deep links
   */
  getDeepLinkBaseUrl(): string {
    return 'https://honeyvision.co.in';
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
