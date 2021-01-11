### More Than Just Types For A JS Library

The first public version of Typescript appeared more than 8 years ago and now it slowly becomes a standard in Javascript
development. Here in 2021, you can find out more and more companies select Typescript to develop new applications
and services. There are always pros and cons to this decision. One disadvantage is that many npm packages are still
Javascript modules and thus, Typescript can't help you to write safe code. Fortunately, Typescript supports one feature
that made it so popular in the beginning.

### Type Definitions

You can describe all data that are being exported by a particular Javascript module. The Typescript analyzer will pick
it up and will handle the package in a way you defined in the types file. The approach is close to C/C++ declaration
files. Here is a simple example, imagine you have a trivial JS module:

```javascript
// sample.js

export const pageSize = 25;
export const pageSizes = [25, 50, 100];
export const getOffset = (page, pageSize) => page * pageSize;
```

(yes, it is a pretty straightforward `sample.js` module)

Then we can spend a few seconds to write type definitions for the module:

```typescript
// sample.d.ts

export const pageSize: number;
export const pageSizes: number[];
export const getOffset: (page: number, pageSize: number) => number;
```

(standard way to declare types for Typescript is it create `.d.ts` module)

Note that Typescript operates definitions file over the Javascript module. Imagine you removed
`export const pageSizes = [25, 50, 100]` from the `sample.js` module. Typescript would still think it exists, and you
will get a runtime error in the browser. It is a known tradeoff to keep definition files in sync with real Javascript
code. Teams try to update type definitions as soon as possible to provide a smooth experience for other developers.
In the meantime, this approach allowed the Typescript code base to raise gradually without having to rewrite all
Javascript.

There are many examples of how to write type definitions. Most of the time you will meet simple cases and thus would be
able to find something similar in the repository called
[DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped), where developers store definitions for npm
packages. You can also learn more about the type definitions feature in the
[official documentation](https://www.typescriptlang.org/docs/handbook/2/type-declarations.html) as it is not a part of
this article.

### The Thing

In our company, we develop an internal UI components library. We use it in our products from the beginning. You can
imagine how much effort it would take to rewrite such a big thing. In the meantime, we write new features using the
Typescript language. The problem is, every time one team goes to implement a new code, they write a small part of the
UI library definitions. Well, this does not look like a good process, and we decided to have a separate package with
whole type definitions for our UI components. This would allow us to install it as a typical node package when it is
needed, and we would not spend time writing the same things again and again. Though we have some good documentation
resources for the library, having type definitions makes it easier to write the code and refactor when something
changes in UI components API.

### The Problem

Now you may ask me, what is wrong with our UI library? The thing is that we inject some global variable to interact
with the exposed API. In the meantime, we want to import some constant pre-defined values to use them in our products.
For example, we can style a button with one of the types:

```typescript
// lists/button.ts

export enum ButtonType {
  Primary = "ui-primary",
  Secondary = "ui-secondary",
  Danger = "ui-danger"
}
```

(depending on the value, the button will be rendered in a specific color palette)

So this project becomes not just type definitions for the UI library, but a real package! And this is interesting -
how can we combine the best of two worlds? Let's write down what we want to achieve in the end:

1. We want the global variable `ui` to be accessible without having to import anything.
2. We want our UI components definitions to be available without having to import anything.
3. We want to use predefined constants and objects for UI components by importing them from our types package. There
   should not be any conflict to assign some type from the library in this case as well.

Sounds like a small deal, right? Let's write some `.d.ts` file with definitions and... Oh, wait, you can't put real
code (constants, enumerable lists, and other stuff) in the `.d.ts` file! Sounds reasonable. Let's create a regular
`.ts` file and put all these enums there. Then we... well, how can we apply globals in the `.ts` file?! Meh...

We **did not find** an example on how to do that, really. StackOverflow is flooded by the `.d.ts vs .ts` concept war. We
had nothing but digging into Typescript documentation and finally got the code that meets our requirements.

### Start From The Scratch

First things first. We write interfaces and enums as usual. I am going to provide code examples in a simplified matter,
so we would focus on the approach, not the particular code features. Imagine we have a notification dialog, so we
write code like this:

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

(simple notification API allows to assign a text message and buttons)

Where `ButtonType` is the values in the enum (we saw it before):

```typescript
// lists/button.ts

export enum ButtonType {
  Primary = "ui-primary",
  Secondary = "ui-secondary",
  Danger = "ui-danger"
}
```

(we highlight a button according to the type)

Then we let's take a look at the simple case. We don't import anything, as the UI components expose the global
variable, and we want to call a notification:

```typescript
// example/application/moduleNoImport.ts

ui.notification.info("Document has been saved!");
```

(we call a global API for notification dialog without custom button configuration)

What do we need to do to make it available? We are going to enrich the **global** namespace with the `ui` variable:

```typescript
// index.ts

import { UiLib } from "./interfaces/ui";

declare global {
  let ui: UiLib;
}
```

(we simply add a new variable into the global namespace)

`UiLib` here describes everything our UI library exposes into the global scope. In our example, we have a list of
methods that show different kinds of notifications:

```typescript
// interfaces/ui.ts

import { Notification } from "./notification";

export interface UiLib {
  notification: Notification;
}
```

(all the notifications API is collected under the Notification interface)

This's almost it. As the last thing, we adjust the package configuration. We tell Typescript to emit type declarations
by tweaking the `tsconfig.json`:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationDir": "dist/",
    "outDir": "dist/es"
  }
}
```

(always emit declaration files)

We now control how Typescript emits the output. We also specify a path to our types in `package.json`:

```json
{
  "main": "dist/es/index.js",
  "types": "dist/index.d.ts"
}
```

(don't forget to have a build step for your package to compile Typescript files)

Alright then we install the package in our project, and we can see it works!

### What About Values?

Now let's go deeper. What if we want to create a notification with some specific button? We want to be able to write
something similar to this example:

```typescript
// example/application/moduleWithImport.ts

import { UiCore } from "ui-types-package";

const showNotification = (message: string): void =>
  ui.notification.info(message, [
    { text: "OK", type: UiCore.ButtonType.Danger }
  ]);
```

(we want to show notifications with the only button OK of Danger type)

Note here and below **UiCore** is a namespace that contains all the enums, configs, interfaces our UI library operates
with. I believe it is a good idea to collect everything under some namespace, so you would not think of names for each
interface. For instance, we have a `Notification` interface. It sounds quite abstract, and it takes a while to
understand we exact object behind the naming. In the meantime `UiCore.Notification` clearly describes where it comes
from. Having a namespace is just an optional but convenient way to handle such things.

Right now we can't import `UiCore` from the library as we don't export anything. Let's improve our code and
form the namespace:

```typescript
// namespaces/core.ts

import * as notificationInterfaces from "../interfaces/notification";
import * as buttonLists from "../lists/button";

export namespace UiCore {
  export import NotificationButtonConfig = notificationInterfaces.NotificationButtonConfig;

  export import ButtonType = buttonLists.ButtonType;
}
```

(we use composite export to create an alias for objects under the namespace)

We basically export all data we have under the namespace with `export import` alias syntax. And, since the main package
module is `index.ts` in the root, we write a global export to expose the namespace into the public:

```typescript
// index.ts

import { UiLib } from "./interfaces/ui";

export { UiCore } from "./namespaces/core";

declare global {
  let ui: UiLib;
}
```

(we export UiCore and now it is available outside)

Two simple steps to achieve our goal! Now we can import some enum and enjoy writing the code. OR. Or we can think of
some other use case. In the example above, we used the `ButtonType.Primary` value to create a notification with some
pre-defined button. But what if we want to use `ButtonType` as a parameter type?

### Make Types Great Again

We are not going to use some particular value, so we expect to access `UiCore.ButtonType` without having to import
anything. Currently, this does not work, as we don't have `UiCore` in the `global` namespace. For instance, the code
below does not work:

```typescript
// example/application/moduleWithType.ts

const showNotificationWithButton = (
  buttonText: string,
  buttonType: UiCore.ButtonType
): void =>
  ui.notification.info("test", [{ text: buttonText, type: buttonType }]);
```

(TS2503: Cannot find namespace 'UiCore')

Obviously, we are going to add the namespace in the `global` scope. Unfortunately, we can't just use the namespace we
created earlier, we need to define a new one. But, instead of importing everything again, we can use our existing
namespace to clone data in form of types:

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

(we create types from the existing namespace using the type alias syntax)

We first rename the `UiCore` import as we want to avoid name conflict. Then we re-export `UiCore` under the
correct name as it was done previously. Finally, we copy the `UiCore` namespace items under the global scope. Both
namespaces (`UiCore` and global `UiCore`) export the same data. The only thing I want to draw your attention to is the
way how we write export statements:

```typescript
// UiCore under the global scope
export type ButtonType = buttonLists.ButtonType;

// UiCore that can be used as a value
export import ButtonType = lButton.ButtonType;
```

(different syntax for different cases)

You can see the global namespace uses
[type alias](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-aliases) syntax to define objects.
For import, we actually want to have values accessible, so we can't use the same approach there. Instead, we import
values and re-export them under the namespace using the composite `export import` operator. Thus, we collect all the
constants, models, enums, interfaces under some common name, we can name it whatever we want, and it will be a single
entry point for all our UI library-related data.

This part is a tradeoff to have all usage cases working. it adds some copy-paste routine, but then it is a comfortable
way to supply developers with type definitions: We can use global variable exposed by the UI library, we can use any
related type to define other variables and functions without having to import `UiCore` for no reason. Then we can
import it and use types the same way we did before along with enum values and other constants. And for sure we do
support new `import type { UiCore } from "ui-types-package"` syntax last Typescript versions provide to define types.

### Conclusion

In this article, I tried to show how we can create a package with type definitions. Taking into account thousands of
examples for existing Javascript libraries, my research covers some rare edge case, when the package should behave
the same way as a global type and while importing some value. The idea is to have two namespaces, the first namespace
contains all available objects and the second namespace for types as part of the global scope.

The name `UiCore`, the package `ui-types-package` and all objects in the article are placeholders to show the
approach. You can use whatever names you want for your libraries and follow the idea described here.

Complete code example is located [here](https://github.com/n0th1ng-else/typescript-types-complex-example).
