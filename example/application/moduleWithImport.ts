// example/application/moduleWithImport.ts

import { UiCore } from "../../dist";

const showNotification = (message: string): void =>
  ui.notification.info(message, [
    { text: "Sad!", type: UiCore.ButtonType.Danger }
  ]);

const showNotificationWithButton = (
  buttonText: string,
  buttonType: UiCore.ButtonType
): void =>
  ui.notification.info("You are lucky to see the button!", [
    { text: buttonText, type: buttonType }
  ]);

const myNotification: (
  text: string,
  config: UiCore.NotificationButtonConfig[]
) => void = ui.notification.warning;

// Usage

ui.notification.error("Failed");

showNotificationWithButton("OK", UiCore.ButtonType.Secondary);

myNotification("Some warning", [
  { text: "Oops", type: UiCore.ButtonType.Danger }
]);
