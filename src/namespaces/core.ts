// namespaces/core.ts

import * as notificationInterfaces from "../interfaces/notification";
import * as buttonLists from "../lists/button";

export namespace UiCore {
  export import NotificationButtonConfig = notificationInterfaces.NotificationButtonConfig;

  export import ButtonType = buttonLists.ButtonType;
}
