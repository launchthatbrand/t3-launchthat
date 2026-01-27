import { bucketForUser, isUserInRollout } from "../lib/rollout";

describe("rollout", () => {
  test("bucketForUser is deterministic and bounded", () => {
    const a = bucketForUser("flag_a", "user_1");
    const b = bucketForUser("flag_a", "user_1");
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(100);
  });

  test("rollout percent boundaries behave as expected", () => {
    expect(isUserInRollout("flag_a", "user_1", 0)).toBe(false);
    expect(isUserInRollout("flag_a", "user_1", 100)).toBe(true);
  });
});

