### Types For A JS Library. Hard Way

The first public version of Typescript appeared # years ago and now it slowly becomes a standard
in Javascript development. Here in 2020 you can find out more and more companies select Typescript
to write new applications and services. There are always pros and cons on this decision. One
disadvantage is that many npm packages are still Javascript modules and thus, Typescript can't
help you to write safe code. Fortunately, Typescript supports one feature that made it so popular
in the beginning. You can declare type definitions for particular Javascript module. Typescript
analyzer will pick it up and will handle the package in a way you defined in types file. The concept
is close to C/C++ declaration files. Here is a simple example:

```javascript
// page.js
export const pageSize = 25;
export const pageSizes = [25, 50, 100];
export const getOffset = (page, pageSize) => page * pageSize;
```

```typescript
// page.d.ts
export const pageSize: number;
export const pageSizes: number[];
export const getOffset: (page: number, pageSize: number) => number;
```

Note that Typescript operates definitions file over the Javascript module. Imagine you removed
`export const pageSizes = [25, 50, 100];` from the `page.js` module. Typescript would still
think it exists, and you will get the error during the runtime. It is a known tradeoff to keep
definition files in sync with real Javascript code. And this approach allowed Typescript code base
to raise gradually without having to rewrite all Javascript.

There are many examples on how to write type definitions. Most of the time you will meet simple
cases and thus would be able to find something similar in >DefinitelyTyped< repository, where
developers store definitions for npm packages. In our company, we faced some tricky case. We
develop UI components framework-independent library. We use it in our products from the beginning.
You can imagine how much effort needs to be made to rewrite such a big thing. In the meantime,
we write new features using the Typescript. The problem is, every time one of the teams goes to
implement a new code, they write a small part of the UI library definitions. Well, this does not
look like a good process, and we decided to have a separate package with whole type definitions
for our library. This will allow us to install it as a regular node package when it is needed, and
we would not spend time on writing the same things again and again. Though we have some good
documentation resource for the UI library, having type definitions makes it easier to write the
code and refactor when something changes in UI components interfaces.

Now you may ask me, what is wrong this our UI library? The thing is that we inject some global
variable to interact with UI, and it can be easily defined in type definitions file.

```typescript
// index.d.ts
import { UiLib } from "./namespaces/ui";

declare global {
  let ui: UiLib;
}
```

(UiLib here is an interface that describes all UI library API we can use)

Then imagine you have a notification window with a button. THe button can be the one of three
types:

```typescript
// lists/button.ts

export enum ButtonType {
  Primary = "ui-primary",
  Secondary = "ui-secondary",
  Danger = "ui-danger"
}
```

We wan to import lists like this and use them in our applications. So
this becomes not just a type definitions library, but real package! And
this is interesting - how can we combine the best of two worlds? Let's
write down what we want to have in the end:

1. We want our UI components definitions to be available without having
   to import anything.
2. We want to use pre-defined constants and lists for UI components by
   importing them from our types package. Type definition are still being
   applied.

Sounds like a small deal, right? Let's write `.d.ts` file with
definitions and... Oh, wait, you can't put real code (constants,
enumerable lists etc) in the `.d.ts` file! Sounds reasonable. Let's
create a regular `.ts` file and pur all these enums there. Then we...
well, how can we apply globals in `.ts` file?! Meh...

We did not find an example on how to do that, really. StackOverflow
is flooded by the `.d.ts vs .ts` concept war. We had nothing but
digging into Typescript documentation and finally got the code that
meets our requirements.

First things first. We write interfaces and enums as usual. I am going
to provide code examples in a simplified matter, so we would focus
on the approach, not the particular code features. Imagine we have
a notification dialog, so we write code like this:

```typescript
// lists/button.ts

export enum ButtonType {
  Primary = "ui-primary",
  Secondary = "ui-secondary",
  Danger = "ui-danger"
}
```

```typescript
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
```

Then we let's take a look on the simple case. We don't import anything, as the UI components expose
the global variable, and we want to call a notification:

```typescript
ui.notification.info("Document has been saved!");
```

What we need to do to make it available? We add the `ui` variable into global namespace:

```typescript
// index.ts

import { UiLib } from "./interfaces/ui";

declare global {
  let ui: UiLib;
}
```

Where `UiLib` defines a number of methods the notifications support:

```typescript
// namespaces/core.ts

import * as iNotification from "../interfaces/notification";
import * as lButton from "../lists/button";

export namespace UiCore {
  export import NotificationButtonConfig = iNotification.NotificationButtonConfig;

  export import ButtonType = lButton.ButtonType;
}
```

We also specify a path to our types in `package.json`:

```json
{
  "...": "somewhere in package.json we specify types module",

  "main": "dist/es/index.js",
  "types": "dist/index.d.ts"
}
```

Alright then we install the package in our project, and we can see it works!

Now let's play with it. What if we want to pass some `ButtonConfig` variable as the parameter?
We want to have a way to write something like this:

```typescript
import type { UiCore } from "ui-types-package";

const showNotificationWithButton = (
  buttonText: string,
  buttonType: UiCore.ButtonType
): void =>
  ui.notification.info("test", [{ text: buttonText, type: buttonType }]);
```

But hey, we did not export `ButtonConfig`! We are going to add an export statement:

```typescript
const btnYes: UiCore.NotificationButtonConfig = {
  text: "Yes",
  type: UiCore.ButtonType.Primary
};
const btnNo: UiCore.NotificationButtonConfig = {
  text: "Cancel",
  type: UiCore.ButtonType.Secondary
};

ui.notification.warning("Are you sure?", [btnYes, btnNo]);
```

To do that, we need to import

\

---
