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
// sample.js

export const pageSize = 25;
export const pageSizes = [25, 50, 100];
export const getOffset = (page, pageSize) => page * pageSize;
```

```typescript
// sample.d.ts

export const pageSize: number;
export const pageSizes: number[];
export const getOffset: (page: number, pageSize: number) => number;
```

Note that Typescript operates definitions file over the Javascript module. Imagine you removed
`export const pageSizes = [25, 50, 100];` from the `sample.js` module. Typescript would still
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
// example/application/moduleNoImport.ts

ui.notification.info("Document has been saved!");
```

What we need to do to make it available? We are going to enrich the **global** namespace with the `ui` variable:

```typescript
// index.ts

import { UiLib } from "./interfaces/ui";

declare global {
  let ui: UiLib;
}
```

`UiLib` here describes everything our UI library exposes into this global object. In our example, we have a list of  
methods that show different kinds of notifications:

```typescript
// interfaces/ui.ts

import { Notification } from "./notification";

export interface UiLib {
  notification: Notification;
}
```

This's almost it. As the last thing we set up package properly. We tell Typescript to emit type declarations by
tweaking the `tsconfig.json`:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationDir": "dist/",
    "outDir": "dist/es"
  }
}
```

We now control how Typescript emits the output. We also specify a path to our types in `package.json`:

```json
{
  "main": "dist/es/index.js",
  "types": "dist/index.d.ts"
}
```

Alright then we install the package in our project, and we can see it works!

Now let's play with it. What if we want to pass some `ButtonConfig` variable as the parameter?
We want to have a way to write something like this:

```typescript
// example/application/moduleWithImport.ts

import { UiCore } from "ui-types-package";

const showNotificationWithButton = (message: string): void =>
  ui.notification.info(message, [
    { text: "OK", type: UiCore.ButtonType.Primary }
  ]);
```

Note here and below `UiCore` is a namespace that contains all the enums, configs, interfaces out UI library operates with.
I think it is a good idea to collect everything under some namespace, so you would not think of naming for each interface.
For instance, we have `Notification` interface, but it is too generic, in the meantime `UiCore.Notification` clearly describes
where it comes from.

Right now we can't import `UiCore` from the library yet since we don't export anything. Let's improve our code and form the namespace:

```typescript
// namespaces/core.ts

import * as iNotification from "../interfaces/notification";
import * as lButton from "../lists/button";

export namespace UiCore {
  export import NotificationButtonConfig = iNotification.NotificationButtonConfig;

  export import ButtonType = lButton.ButtonType;
}
```

We basically export all data we have under the namespace with specific syntax. And, since the main file in the package is `index.ts`,
we pick a global export to expose the namespace into public:

```typescript
// index.ts

import { UiLib } from "./interfaces/ui";

export { UiCore } from "./namespaces/core"; // <<<-- We apply this export

declare global {
  let ui: UiLib;
}
```

This is that simple! Now we can import some enum and enjoy writing the code. OR. Or we can think of some other use case!
In the example above, we used `ButtonType` enum value to create some notification with pre-defined button type. What if we
want to use `ButtonType` as a parameter type? We are not going to use some particular value, so we expect to access
`UiCore.ButtonType` without having to import something. Currently, this does not work, as we dont have `UiCore` in the
`global` namespace. Then let's add it:

```typescript
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
```

We first rename the `UiCore` import as we want to avoid namespace name conflict. We re-export `UiCore` under the correct
name is it was done previously. Finally, we copy `UiCore` namespace under the global scope. Both `UiCore` and global
`UiCore` export the same data. The only thing I want to draw your attention to is the way how we write export statements:

```typescript
// UiCore for import
export import ButtonType = lButton.ButtonType;

// UiCore under the global scope
export type ButtonType = _UiCore.ButtonType;
```

You can see the global namespace uses [type alias](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-aliases)
approach to export data. For import, we actually want to have enum values accessible, so we can't use the
same syntax there. Instead, we
