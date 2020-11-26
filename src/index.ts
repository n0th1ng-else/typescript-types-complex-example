// index.ts

import { UiCore as _UiCore } from "./namespaces/core";
import { UiLib } from "./interfaces/ui";

export { _UiCore as UiCore };

declare global {
  namespace UiCore {
    export type NotificationButtonConfig = _UiCore.NotificationButtonConfig;

    export type ButtonType = _UiCore.ButtonType;
  }

  let ui: UiLib;
}
