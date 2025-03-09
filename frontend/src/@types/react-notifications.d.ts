declare module "react-notifications" {
  import { ReactNode } from "react";

  export const NotificationContainer: React.FC<{ children?: ReactNode }>;
  export const NotificationManager: {
    info: (message: string, title?: string, timeOut?: number) => void;
    success: (message: string, title?: string, timeOut?: number) => void;
    warning: (message: string, title?: string, timeOut?: number) => void;
    error: (message: string, title?: string, timeOut?: number) => void;
  };
}