// --- Advanced Utility Types ---

// 1. Extracts ONLY the keys of T that do not have a '?'
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// 2. Custom Type Error to show users exactly which required keys they forgot to plan
type MissingKeysError<Missing> = {
  "ERROR: Missing required keys in plan": Missing;
};

// 3. Subtracts keys we already have from the keys we expect
type Remaining<
  ExpectedKeys extends PropertyKey,
  Current extends object,
> = Exclude<ExpectedKeys, keyof Current>;

// 4. Cosmestic type to flatten intersections for IDE readability
type Compute<T> = { [K in keyof T]: T[K] } & {};

// --- Core Logic ---

// If no expected keys are remaining, output the final Current object!
// Otherwise, return the next iteration of the Builder.
type StepResult<
  Target extends object,
  ExpectedKeys extends keyof Target,
  NextState extends object,
> =
  Remaining<ExpectedKeys, NextState> extends never
    ? Compute<NextState> // The finalized object!
    : AutoBuilderType<Target, ExpectedKeys, NextState>;

// --- Interface & Implementation ---

export interface AutoBuilderType<
  Target extends object,
  ExpectedKeys extends keyof Target,
  Current extends object,
> {
  with<K extends Remaining<ExpectedKeys, Current>>(
    key: K,
    value: Target[K],
  ): StepResult<Target, ExpectedKeys, Compute<Current & Record<K, Target[K]>>>;
}

class AutoBuilderImpl<
  Target extends object,
  ExpectedKeys extends keyof Target,
  Current extends object,
> implements AutoBuilderType<Target, ExpectedKeys, Current> {
  constructor(
    private targetKeys: ExpectedKeys[],
    private state: Current,
  ) {}

  with<K extends Remaining<ExpectedKeys, Current>>(
    key: K,
    value: Target[K],
  ): StepResult<Target, ExpectedKeys, Compute<Current & Record<K, Target[K]>>> {
    const newState = { ...this.state, [key]: value } as any;

    // Check if every key in our plan has been provided
    const hasAllKeys = this.targetKeys.every((k) => k in newState);

    if (hasAllKeys) {
      return newState; // Auto-build triggers!
    }

    return new AutoBuilderImpl<Target, ExpectedKeys, any>(
      this.targetKeys,
      newState,
    ) as any;
  }
}

// --- Entry Point ---

export const autoBuilder = {
  // Step 1: Explicitly define the target interface (Schema)
  returns: <Target extends object>() => ({
    // Step 2: Dynamically infer the chosen keys (The Plan)
    plan: <K extends keyof Target>(
      ...keys: K[]
    ): [RequiredKeys<Target>] extends [K]
      ? AutoBuilderType<Target, K, {}> // Valid plan! Start building.
      : MissingKeysError<Exclude<RequiredKeys<Target>, K>> => {
      // ^ If required keys are missing, we return a custom Error Interface
      return new AutoBuilderImpl<Target, K, {}>(keys, {} as any) as any;
    },
  }),
};
