// interfaces/notification.ts

import type { ButtonType } from "../lists/button";

export interface NotificationButtonConfig {
  text?: string;
  type?: ButtonType;
}

export interface Notification {
  info(text: string, buttons?: NotificationButtonConfig[]): void;
  warning(text: string, buttons?: NotificationButtonConfig[]): void;
  error(text: string, buttons?: NotificationButtonConfig[]): void;
}
