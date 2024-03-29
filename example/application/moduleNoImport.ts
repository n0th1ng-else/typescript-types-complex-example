// example/application/moduleNoImport.ts

ui.notification.info("Document has been saved!");

ui.notification.warning("Sounds scary", [{ text: "Yes" }]);

const showNotificationWithButton = (
  buttonText: string,
  buttonType: UiCore.ButtonType
): void =>
  ui.notification.info("hello world!", [
    { text: buttonText, type: buttonType }
  ]);
