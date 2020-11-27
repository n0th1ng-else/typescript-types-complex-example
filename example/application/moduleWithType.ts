// example/application/moduleWithType.ts

import type { UiCore } from "../../dist";

const showNotificationWithButton = (
  buttonText: string,
  buttonType: UiCore.ButtonType
): void =>
  ui.notification.info("test", [{ text: buttonText, type: buttonType }]);

const myNotification: (
  text: string,
  config: UiCore.NotificationButtonConfig[]
) => void = ui.notification.warning;
