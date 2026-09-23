/**
 * Android Back Button Service
 * Handles Android back button behavior with proper priority
 */

import { App } from '@capacitor/app';

export type BackButtonAction = () => void | Promise<void>;

interface BackButtonPriority {
  closeModal?: BackButtonAction;
  closeDrawer?: BackButtonAction;
  closeImageViewer?: BackButtonAction;
  navigateBack?: BackButtonAction;
  exitApp?: BackButtonAction;
}

export class AndroidBackButtonService {
  private static instance: AndroidBackButtonService;
  private backButtonPriorities: BackButtonPriority = {};
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AndroidBackButtonService {
    if (!AndroidBackButtonService.instance) {
      AndroidBackButtonService.instance = new AndroidBackButtonService();
    }
    return AndroidBackButtonService.instance;
  }

  /**
   * Initialize back button handler
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Listen to back button events
      App.addListener('backButton', async () => {
        await this.handleBackButton();
      });

      // On Android, don't exit on first back press - prompt user
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // App moved to background
        }
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize back button handler:', error);
    }
  }

  /**
   * Register back button action for a specific priority
   */
  registerAction(priority: keyof BackButtonPriority, action: BackButtonAction): void {
    this.backButtonPriorities[priority] = action;
  }

  /**
   * Unregister back button action
   */
  unregisterAction(priority: keyof BackButtonPriority): void {
    delete this.backButtonPriorities[priority];
  }

  /**
   * Handle back button press with priority logic
   */
  private async handleBackButton(): Promise<void> {
    const priorities: (keyof BackButtonPriority)[] = [
      'closeModal',
      'closeDrawer',
      'closeImageViewer',
      'navigateBack',
      'exitApp',
    ];

    for (const priority of priorities) {
      const action = this.backButtonPriorities[priority];
      if (action) {
        try {
          await action();
          return; // Action handled, stop propagation
        } catch (error) {
          console.error(`Error handling back button action (${priority}):`, error);
        }
      }
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    await App.exitApp();
  }
}

export const androidBackButton = AndroidBackButtonService.getInstance();
