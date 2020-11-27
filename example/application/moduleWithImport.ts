// example/application/moduleWithImport.ts

import { UiCore } from "../../dist";

const showNotificationWithButton = (
  buttonText: string,
  buttonType: UiCore.ButtonType
): void =>
  ui.notification.info("test", [{ text: buttonText, type: buttonType }]);

const myNotification: (
  text: string,
  config: UiCore.NotificationButtonConfig[]
) => void = ui.notification.warning;

// Usage

ui.notification.error("Failed");

showNotificationWithButton("OK", UiCore.ButtonType.Secondary);

myNotification("Some warning", [
  { text: "OOps", type: UiCore.ButtonType.Danger }
]);
