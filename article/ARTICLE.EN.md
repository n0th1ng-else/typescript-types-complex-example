### More Than Just Types For A JS Library

The first public version of TypeScript appeared more than
[6 years ago](https://devblogs.microsoft.com/typescript/announcing-typescript-1-0). Since that time it grew up and
brought many incredible features for developers. Today it slowly becomes a standard in the JavaScript world. Slack,
AirBnB, Lyft, and many others add TypeScript into their tech stack. Teams use TypeScript for both browser applications
and NodeJS services. There are always pros and cons to this decision. One disadvantage is that many NPM packages are
still written as JavaScript modules. We experienced this issue as well when decided to migrate our applications to
TypeScript. We had to implement type definitions for our internal UI components library. We wanted to get a tool, that
could serve developers as additional documentation. We also wanted to collect everything one can use while working with
the JS library, in one place. I am going to tell you what steps did we take to achieve the desired solution.

### Type definitions

You can describe all data that are being exported by a particular JavaScript module. The TypeScript analyzer will pick
it up and will handle the package in a way you defined it in the type definitions file. The approach is close to C/C++
declaration files. Here is a simple example, imagine you have a trivial JS module:

```javascript
// sample.js

export const pageSize = 25;
export const pageSizes = [25, 50, 100];
export const getOffset = (page, pageSize) => page * pageSize;
```

(one simple `sample.js` module might look like this)

You can use the `sample.js` module in TypeScript code without any problems. But guess what? The analyzer would not be
able to run autocomplete and infer types properly. If we want to rely on help from smart tools, we need to describe the
API our JS module provides manually. Usually, it is pretty straightforward to do:

```typescript
// sample.d.ts

export const pageSize: number;
export const pageSizes: number[];
export const getOffset: (page: number, pageSize: number) => number;
```

(standard way to declare types for TypeScript is to create an appropriate `.d.ts` module)

Note that definition files have priority over the JavaScript modules. Imagine you removed
`export const pageSizes = [25, 50, 100]` from the `sample.js` module. TypeScript would still think it exists, and you
will get a runtime error. It is a known tradeoff to keep definition files in sync with real JavaScript code. Teams try
to update type definitions as soon as possible to provide a smooth experience for other developers. In the meantime,
this approach allowed the TypeScript codebase to raise gradually without having to rewrite all JavaScript ecosystem.

There are many examples of how to write type definitions. Most of the time you will meet simple cases and thus would be
able to find something similar in the repository called
[DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped), where developers store definitions for NPM
packages. You can also learn more about the type definitions feature in the
[official documentation](https://www.typescriptlang.org/docs/handbook/2/type-declarations.html) as it is not a part of
this article.

### Our JavaScript library

In our company, we develop an internal UI components library. We use it in our products from the beginning, and the
current production version is 12. You could only imagine how much effort it would take to rewrite such a big thing. In
the meantime, we write new features using the TypeScript language. The problem is, every time one team goes to implement
a new code, they write a small copy of the UI library definitions. Well, this does not sound like a good process, and we
decided to have a separate package with complete type definitions for our UI components. And that's because:

- We would be able to import this package during the new repository initialization. This will allow controlling the
  version and simplify the refactoring during the version update.
- We would stop copy-pasting the same code again and again.
- Type definitions is a great documentation source. I bet developers would rather select the method via
  **IntelliSense** suggestions than go to the web page with all API descriptions and copy the method name.

### So what is wrong?

Now you may ask me, what is wrong with our UI library? The thing is that we inject some global variable to interact
with the exposed API. In addition, we want to import some constant pre-defined values (icons, table cell types, tag
colors, etc) that are being used in our web pages. It usually comes in form of constant identifiers that help to style
components.

For example, we can style a button with one of the types:

```typescript
// lists/button.ts

export enum ButtonType {
  Primary = "ui-primary",
  Secondary = "ui-secondary",
  Danger = "ui-danger"
}
```

(depending on the value, the button will be rendered in a specific size and color palette)

We came to an idea to store all library-specific values in one place. So this project became not just type definitions
for the UI library, but a real package! It should represent the exact library state at some specific version. And this
is interesting - how can we implement this? Let's state what we want to achieve as the result:

1. We want the global variable `ui` to be accessible without having to import anything.
2. We want our UI components definitions to be available without having to import anything as well.
3. We want to use predefined constants and objects for UI components by importing them from our types package. There
   should not be any conflict to assign some type from the library in this case.

Sounds like a small deal, right? Let's write some `.d.ts` file with type definitions and... Oh, wait, you can't put real
code (constants, enumerable lists, and other stuff) in the `.d.ts` file! Sounds reasonable. Let's create a regular
`.ts` file and put all these enums there. Then we... well, how can we apply globals in the `.ts` file?! Meh...

We **did not find** an example on how to do that, really. StackOverflow is flooded with the `.d.ts vs .ts` concept war.
We had nothing but digging into TypeScript documentation and finally got the code that meets our requirements.

### Start from the scratch

First things first. We write interfaces and enums as usual. I am going to provide code examples in a simplified matter,
so we would focus on the approach, not the particular code features. Imagine we have a notification dialog, so we
write something like this:

```typescript
// interfaces/notification.ts

import { ButtonType } from "../lists/button";

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

(we call a global API to show the notification dialog without custom button configuration)

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

This's almost it. Lastly, we adjust the package configuration. We tell TypeScript to emit type declarations by adjusting
the `tsconfig.json`:

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

We now control how TypeScript emits the output. We also specify a path to our types in `package.json`:

```json
{
  "main": "dist/es/index.js",
  "types": "dist/index.d.ts"
}
```

(don't forget to set up a build step for your package to compile TypeScript files)

Alright, then we install the package in our project. Finally, we specify the package path in `tsconfig.json` (since we
don't use the default `@types` folder) to see that it works!

### Using the values

Now let's go deeper. What if we want to create a notification with some specific button? We want to be able to write
something similar to this example:

```typescript
// example/application/moduleWithImport.ts

import { UiCore } from "ui-types-package";

const showNotification = (message: string): void =>
  ui.notification.info(message, [
    { text: "Failed to read the document", type: UiCore.ButtonType.Danger }
  ]);
```

(we want to show notifications with the button of Danger type)

Note here and below **UiCore** is a namespace that contains all the enums, configs, interfaces our UI library operates
with. I think it is a good idea to collect everything under some namespace, so you would not think of names for each
interface. For instance, we have a `Notification` interface. It sounds quite abstract, and it takes a while to
understand the exact object behind the naming. In the meantime `UiCore.Notification` clearly describes where it comes
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
module is `index.ts` in the root, we write a global export to expose the namespace to the public:

```typescript
// index.ts

import { UiLib } from "./interfaces/ui";

export { UiCore } from "./namespaces/core";

declare global {
  let ui: UiLib;
}
```

(we export UiCore and now it is available from the outside)

Two simple steps to achieve our goal! Now we can import some enum and enjoy writing the code. OR. Or we can think of
some other use case. In the example above, we used the `ButtonType.Danger` value to create a notification with some
pre-defined button. What if we want to use `ButtonType` as a parameter type?

### Covering edge cases

We are not going to use some particular value, so we expect to access the type `UiCore.ButtonType` without having to
import anything. Currently, this does not work, as we don't have `UiCore` in the `global` scope. For instance, the
code below does not work:

```typescript
// example/application/moduleWithType.ts

const showNotificationWithButton = (
  buttonText: string,
  buttonType: UiCore.ButtonType // <-- TS2503: Cannot find namespace 'UiCore'
): void =>
  ui.notification.info("hello world!", [
    { text: buttonText, type: buttonType }
  ]);
```

(TS2503: Cannot find namespace 'UiCore')

Obviously, we are going to add the namespace in the `global` scope. Unfortunately, we can't just use the namespace we
created earlier, we need to define a new one. The trick is to create a new namespace with the same name and with almost
the same data included. Good news: instead of importing everything again, we can use our existing namespace to clone
data in form of types:

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

(different syntax for each case)

You can see the global namespace uses
[type alias](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-aliases) syntax to define objects.
For import statements, we actually want to have values (not types) accessible, so we can't use the same approach there.
Instead, we import values and re-export them under the namespace using the composite `export import` operator. Thus, we
collect all the constants, models, enums, interfaces under some common name, we can name it whatever we want, and it
will be a single entry point for all our UI library-related data. As the result, we collected all data in one place, and
the developer experience does not change from using the global object to having to import something.

This part is a tradeoff to get all usage cases working. It adds some copy-paste routine, but then it is a comfortable
way to supply developers with type definitions: we can use the global variable exposed by the UI library as we do in
JavaScript modules — without having to import anything. Then we can import the package and use constant values. All of
them are defined and ready to use. The existing code will remain the same. And yes, we do support the new
`import type { UiCore } from "ui-types-package"` syntax which was introduced in TypeScript v3.8 to define types. There
is no conflict with our implementation.

### Conclusion

You can find thousands of existing type definitions for JavaScript libraries. In this article, I tried to explain some
specific edge case, when along with type definitions, the package needs to contain real values. We use this approach for
our UI components library to style table cells, specify icons, and more. You can achieve such capabilities by following
these steps:

- Create and set up a new NPM package.
- Describe the whole interface supported by the JavaScript library.
- Declare the global object that is being injected into `window`.
- Create a namespace made of objects you have defined already - we will use it for import statements.
- Create a namespace made of types based on the previous namespace. It will be located in the global scope.
- Verify that we assigned the same name for both namespaces.

This small guide makes it possible to cover all potential use cases for any available JS library. In the end, you will
get a package, that is easy to use, support, and extend.

The name `UiCore`, the package `ui-types-package` and all objects in the article are placeholders to show the
approach. You can use whatever names you want for your libraries and follow the idea described here.

Complete code example is located [here](https://github.com/n0th1ng-else/typescript-types-complex-example).
