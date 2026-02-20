import { describe, it, expect, expectTypeOf } from "vitest";
import { autoBuilder } from "../src/index.js";

// --- Mock Schemas ---
interface UserSchema {
  id: number;
  username: string;
  bio?: string;
  isActive?: boolean;
}

interface ComplexSchema {
  data: string | null;
  count: number;
  config: { retries: number } | undefined;
}

describe("autoBuilder-ts", () => {
  it("Scenario 1: Auto-builds immediately when the final required key is provided", () => {
    const builder = autoBuilder.returns<UserSchema>().plan("id", "username");

    const step1 = builder.with("id", 101);

    // Provide the final planned key
    const finalUser = step1.with("username", "admin");

    expect(finalUser).toEqual({ id: 101, username: "admin" });

    // Type Assertion: Ensure the final output matches the expected type, not a Builder
    expectTypeOf(finalUser).toEqualTypeOf<{ id: number; username: string }>();
  });

  it("Scenario 2: Waits for optional keys if they are part of the plan", () => {
    const builder = autoBuilder.returns<UserSchema>().plan("id", "username", "bio");

    const step1 = builder.with("id", 1).with("username", "user1");

    // It should STILL be a builder, not the final object!
    expect(typeof (step1 as any).with).toBe("function");

    // Final trigger
    const finalUser = step1.with("bio", "Hello world");

    expect(finalUser).toEqual({ id: 1, username: "user1", bio: "Hello world" });
  });

  it("Scenario 3: Safely handles Falsy values (0, false, null, undefined)", () => {
    const builder = autoBuilder.returns<ComplexSchema>().plan("data", "count", "config");

    const finalObject = builder
      .with("data", null) // Falsy
      .with("count", 0) // Falsy
      .with("config", undefined); // Falsy but explicitly provided!

    expect(finalObject).toEqual({ data: null, count: 0, config: undefined });
    // If it didn't auto-build, it would still have the '.with' function
    expect((finalObject as any).with).toBeUndefined();
  });

  it("Scenario 4: Immutability and Branching (No cross-contamination)", () => {
    // Because we use { ...this.state }, a builder can be branched!
    const baseBuilder = autoBuilder
      .returns<UserSchema>()
      .plan("id", "username", "isActive")
      .with("isActive", true);

    // Branch A
    const userA = baseBuilder.with("id", 1).with("username", "Alice");

    // Branch B
    const userB = baseBuilder.with("id", 2).with("username", "Bob");

    expect(userA).toEqual({ id: 1, isActive: true, username: "Alice" });
    expect(userB).toEqual({ id: 2, isActive: true, username: "Bob" });

    // Ensure A did not mutate B's state
    expect(userA.id).not.toEqual(userB.id);
  });

  it("Scenario 5: Plan rejection via types (Type-only test)", () => {
    // This is a type test. We check that omitting a required key returns our custom Error type.
    const badPlan = autoBuilder.returns<UserSchema>().plan("username");

    expectTypeOf(badPlan).toEqualTypeOf<{
      "ERROR: Missing required keys in plan": "id";
    }>();
  });
});
