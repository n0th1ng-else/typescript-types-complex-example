### Больше, Чем Просто Типизация JS Библиотек

Первая публичная версия Typescript увидела свет больше 8 лет назад. За это время язык повзрослел и медленно, но верно
становится стандартом Javascript разработки. Сейчас, в 2021 году, всё больше компаний выбирают Typescript для
разработки новых приложений как для браузера, так и NodeJS сервисов. Конечно, в любом подходе всегда есть плюсы и минусы.
Один из минусов заключается в том, что многие NPM библиотеки написаны на Javascript. Таким образом, статический анализ
не может вывести типы для таких библиотек и все преимущества типизированного кода сходят на нет. К счастью, у Typescript
есть способ решения таких проблем, который позволил ему заработать популярность с самого начала.

### Объявление типов

Для любого JS модуля мы всегда можем создать d.ts файл, в котором легко описать интерфейс данного модуля. Typescript
анализатор будет использовать объявленные типы данных из d.ts модуля каждый раз, когда мы делаем импорт соответствующего
JS модуля. Такой подход очень напоминает заголовочные файлы в Си и позволяет легко наполнить проект контекстом в период
миграции на Typescript. На практике это выглядит достаточно тривиально, и пример ниже показывает суть подхода:

```javascript
// sample.js

export const pageSize = 25;
export const pageSizes = [25, 50, 100];
export const getOffset = (page, pageSize) => page * pageSize;
```

(yes, it is a pretty straightforward `sample.js` module)

Мы можем сделать импорт `sample.js` в нашем Typescript модуле. Но ни авто дополнение, ни вывод типов — ничего этого
работать не будет. Для того, чтобы описать, какой экспорт представляем наш JS модуль, мы пользуемся соглашением и
создаем файл с объявлением типов:

```typescript
// sample.d.ts

export const pageSize: number;
export const pageSizes: number[];
export const getOffset: (page: number, pageSize: number) => number;
```

(standard way to declare types for Typescript is it create `.d.ts` module)

Важный момент - как мы убедились, Typescript оперируем объявлениями типов для JS модулей. Таким образом, если мы удалим
`export const pageSizes = [25, 50, 100]` из файла `sample.js`, это никак не повлияет на анализатор кода. В результате
мы получим ошибку уже в процессе выполнения скрипта. Получается, что разработчики должны следить за этим и держать
файлы с объявлениями типов синхронизованными с исходным кодом модуля. С другой стороны, данный подход позволяет
пользоваться всеми преимуществами статического анализа без необходимости переписывать весь Javascript код приложения.

В интернете можно найти множество примеров типизации JS модулей. В большинстве случаев вы не будете испытывать проблем
с объявлением типов и найдете пример среди тысячи d.ts файлов в репозитории
[DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped). Это репозиторий, который используют разработчики,
чтобы публиковать объявления типов для NPM библиотек. Вы также всегда можете прочитать
[официальную документацию](https://www.typescriptlang.org/docs/handbook/2/type-declarations.html), я не буду заострять
внимание на этом.

### Суть

Во всех наших продуктах мы используем библиотеку UI компонентов, написанную внутри компании. Она отметила уже 12 версию
и с нами с самого начала. Есть план мигрировать на веб-компоненты, но пока мы в самом начале пути. С другой стороны,
мы используем Typescript в новых приложениях. Проблема в том, что когда команда начинает писать очередной функционал,
им приходится восстанавливать часть объявлений типов из возможностей UI библиотеки. Так мы пришли к тому, чтобы создать
отдельный NPM пакет и описать все возможности UI библиотеки в нем. Таким образом, мы будем подключать этот пакет при
инициализации нового репозитория, перестанем дублировать код и, таким образом, сэкономим немного времени на разработку.
Дополнительно объявления типов будут выступать в качестве дополнительной документации к UI компонентам и позволили бы
с легкостью переходить на очередную версию библиотеки.

### Проблема

Можно спросить, что же тут особенного? Проблема в том, что мы добавляем на страницу глобальный объект для того, чтобы
использовать функционал UI библиотеки. То есть, она доступна глобально. В то же время, у нас есть наборы константных
значений (например для акцента кнопок, для цвета тегов или для типа клетки в таблице), которые мы используем в наших
приложениях. Обычно это набор заданных значений, используя который мы можем стилизовать тот или иной компонент.
Например, мы можем отрисовать один из несколько типов кнопок:

```typescript
// lists/button.ts

export enum ButtonType {
  Primary = "ui-primary",
  Secondary = "ui-secondary",
  Danger = "ui-danger"
}
```

(цвет, размер и шрифт кнопки зависит от значения, которое мы передали)

Выходит, что результатом работы должен стать не просто файл с объявлением типов всех сущностей UI библиотеки, но
по-настоящему целый пакет, который бы полностью отображать состояние библиотеки на данный момент. Объединяя все
сказанное выше, наша цель состояла из трех пунктов:

1. Глобальный объект `ui` должен быть доступен всегда без необходимости объявлять импорт библиотеки.
2. Все типы из библиотеки должны быть доступны всегда без необходимости объявлять импорт библиотеки.
3. Мы также хотим иметь возможность объявить импорт для констант и пред-заданных значений из UI библиотеки (не хранятся
   внутри глобальной переменной `ui`). В этом случае не должно быть никаких конфликтов с пунктами 1 и 2.

Кажется, что это несложно, ведь так? Мы просто создаем `d.ts` модуль, прописываем все объявления типов для нашей
библиотеки и... так, ок, мы не можем объявлять реальные код (константы, объекты и т.п.) внутри `d.ts` файлов. Ок, не
страшно. Тогда мы создадим реальный Typescript модуль и положим все этим списки и интерфейсы туда. Затем, мы...
как мы тогда объявим нашу глобальную переменную? Хм...

Я не смог найти подходящий пример для такого случая, как не пытался. StackOverflow переполнен вопросами относительно
концепта `.d.ts против .ts`, и ничего похожего на задачу, которую я решаю, найти не удалось. Всё что мне оставалось, это
пойти читать официальную документацию и пробовать разные варианты. Вот что получилось в результате.

### Начнем с нуля

Итак, у нас ничего нет. Начнем с того, чтобы напишем интерфейсы и списки значений для нашей библиотеки, как мы это
делаем всегда. Здесь и ниже я буду приводить примеры в упрощенном виде, так как в этой статье я делаю акцент на подходе
к объявлению типов, а не на конкретной реализации интерфейсов или enum-списков. Итак, представим, что наша библиотека
содержит компонент нотификации - это простое модельное окно с текстом и, может быть, кнопками. В таком случае, один из
вариантов описания такого окна может выглядеть следующим образом:

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

(Мы описали объект с методами вызовы разных видов нотификаций, состоящих из текста и кнопок)

Мы используем enum-список `ButtonType`, который уже объявляли раньше:

```typescript
// lists/button.ts

export enum ButtonType {
  Primary = "ui-primary",
  Secondary = "ui-secondary",
  Danger = "ui-danger"
}
```

(мы подсвечиваем кнопку в определенном стиле в зависимости от типа)

Теперь давайте рассмотрим самый простой случай. Наша UI библиотека предоставляет API для работы с компонентами. Значит,
у нас должен быть доступ к глобальному объекту библиотеки без необходимости делать импорт чего-либо:

```typescript
// example/application/moduleNoImport.ts

ui.notification.info("Document has been saved!");
```

(мы вызываем модальное окно с текстом, `ui` здесь просто глобальный объект)

Как мы можем сделать объект `ui` доступным? Мы объявляем наш объект в глобальной области видимости:

```typescript
// index.ts

import { UiLib } from "./interfaces/ui";

declare global {
  let ui: UiLib;
}
```

(мы объявили новый глобальный объект)

Интерфейс `UiLib` здесь содержит описания для всего API, которое поддерживает наша UI библиотека. В нашем упрощенном
случае, здесь объявлены методы для отображения нотификаций на странице:

```typescript
// interfaces/ui.ts

import { Notification } from "./notification";

export interface UiLib {
  notification: Notification;
}
```

(разные типы уведомлений собраны в интерфейсе Notification, как мы могли увидеть выше)

И на этом можно закончить со случаем, который мы рассматриваем. Остается только настроить наш только что приготовленный
NPM пакет. Мы попросим Typescript разнести код и объявления типов в разные директории, а также явно укажем сохранять
объявления типов при компиляции в Javascript. Часть нашего `tsconfig.json` будет выглядеть следубщим образом:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationDir": "dist/",
    "outDir": "dist/es"
  }
}
```

Последним шагом мы укажем правильные пути в нашем `package.json`:

```json
{
  "main": "dist/es/index.js",
  "types": "dist/index.d.ts"
}
```

(не забудьте добавить компиляцию из Typescript при публикации пакета)

Теперь точно все. Мы можем установить новый пакет в очередном репозитории, указать в `tsconfig.json` путь для
объявлений типов (так как наш npm пакет не попадем в директорию `@types`) и увидеть как всё работает!

### А как же пользоваться значениями?

Усложним задачу. У нас есть enum-список ButtonType и мы хотим им воспользоваться. Для этого нам нужно сделать импорт
значения, например вот так:

```typescript
// example/application/moduleWithImport.ts

import { UiCore } from "ui-types-package";

const showNotification = (message: string): void =>
  ui.notification.info(message, [
    { text: "OK", type: UiCore.ButtonType.Danger }
  ]);
```

(мы хотим показать модальное окно с большой красной кнопкой)

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
