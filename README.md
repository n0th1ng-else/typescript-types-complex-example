Enhance `tsconfig.json` to put type into action:

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
