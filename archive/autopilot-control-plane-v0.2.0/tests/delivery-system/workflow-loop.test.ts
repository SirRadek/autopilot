import { describe, expect, it } from "vitest";

import { workflowTransitions } from "../../src/data/delivery-system/workflows";

describe("workflow learning loop", () => {
  it("feeds memory and optimization lessons back into future planning", () => {
    expect(workflowTransitions).toContainEqual({
      from: "memory",
      to: "planning",
      condition: "lessons and optimization signals shape the next planning cycle"
    });
  });
});
