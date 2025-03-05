declare module "react-notifications" {
  export const NotificationContainer: any;
  export const NotificationManager: {
    info: (message: string, title?: string, timeOut?: number) => void;
    success: (message: string, title?: string, timeOut?: number) => void;
    warning: (message: string, title?: string, timeOut?: number) => void;
    error: (message: string, title?: string, timeOut?: number) => void;
  };
}
