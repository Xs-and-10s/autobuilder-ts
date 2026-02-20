# autobuilder-ts

A "mad science", strongly-typed AutoBuilder for TypeScript. It automatically 
collapses into your final object as soon as your planned keys are fulfilled, 
eliminating the need for a trailing `.build()` method.

## Installation

```bash
npm install autobuilder-ts
```

## Usage

```ts
import { autoBuilder } from "autobuilder-ts";

interface User {
  id: number;
  username: string;
  age?: number;
}

// 1. Define your target schema and plan your required/optional keys
const builder = autoBuilder.returns<User>().plan("id", "username");

// 2. Start chaining!
// The moment the final planned key is provided, the builder returns 
// the finalized object.
const user = builder.with("id", 1).with("username", "admin");

console.log(user.username); // "admin"
```
