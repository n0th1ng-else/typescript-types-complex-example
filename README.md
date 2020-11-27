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
