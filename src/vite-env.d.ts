/// <reference types="vite/client" />

import type { OnjeomApi } from '../electron/preload';

declare global {
  interface Window {
    onjeom?: OnjeomApi;
    onjeomReady?: boolean;
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  }

  const __ONJEOM_TARGET__: string;
}

export {};
