### The article

You can read the article:

- [English](https://github.com/n0th1ng-else/typescript-types-complex-example/blob/main/article/ARTICLE.EN.md)
- [Русский](https://github.com/n0th1ng-else/typescript-types-complex-example/blob/main/article/ARTICLE.RU.md)

### Build

To see how TypeScript compiler analyzes the example, build the package via `npm run build`

### Set up the package in the tsconfig.json

Enhance `tsconfig.json` to put types into action:

```json
{
  "compilerOptions": {
    "*": "Any typescript config options"
  },
  "files": ["node_modules/YOUR_PACKAGE_NAME/dist/index.d.ts"],
  "exclude": ["node_modules"],
  "include": ["YOUR_CUSTOM_TYPES.d.ts", "src/**/*"]
}
```

This is needed since we use some custom package directory. Only types from
[@types](https://github.com/DefinitelyTyped/DefinitelyTyped) folder is being picked up automatically.
