/// <reference types="vite/client" />

import type { OnjeomApi } from '../electron/preload';

declare global {
  interface Window {
    onjeom?: OnjeomApi & {
      paths?: () => Promise<Record<string, unknown>>;
      pdfWorkerBase64?: () => Promise<{
        name: string;
        base64: string;
        path: string;
        bytes: number;
      } | null>;
    };
    onjeomReady?: boolean;
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  }

  const __ONJEOM_TARGET__: string;
}

export {};
