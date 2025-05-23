// src/types/global.d.ts
export {};

declare global {
  interface Window {
    gtag: {
      (command: 'config', targetId: string, config?: GtagConfigParams): void;
      (command: 'event', eventName: string, eventParams?: GtagEventParams): void;
      (command: 'js', config: Date): void;
    };
  }
}

interface GtagConfigParams {
  page_path?: string;
  send_page_view?: boolean;
  cookie_domain?: string;
  cookie_flags?: string;
  [key: string]: any;
}

interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: any;
}