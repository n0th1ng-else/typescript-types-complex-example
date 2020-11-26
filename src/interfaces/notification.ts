// interfaces/notification.ts

import { ButtonType } from "../lists/button";

interface ButtonConfig {
  text?: string;
  type?: ButtonType;
}

export interface Notification {
  info(text: string, buttons?: ButtonConfig[]): void;
  warning(text: string, buttons?: ButtonConfig[]): void;
  error(text: string, buttons?: ButtonConfig[]): void;
}
