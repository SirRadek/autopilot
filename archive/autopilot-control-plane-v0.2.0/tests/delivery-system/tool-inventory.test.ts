import { describe, expect, it } from "vitest";

import {
  selectToolInventoryForTask,
  toolInventorySnapshot
} from "../../src/data/delivery-system/toolInventory";

describe("tool inventory routing policy", () => {
  it("distinguishes session-callable plugins from cached-only bundles", () => {
    const browser = toolInventorySnapshot.items.find((item) => item.id === "browser_plugin");
    const clickup = toolInventorySnapshot.items.find((item) => item.id === "cached_clickup_bundle");

    expect(toolInventorySnapshot.observedAt).toBe("2026-06-11");
    expect(browser).toMatchObject({
      category: "plugin",
      status: "session_callable"
    });
    expect(clickup).toMatchObject({
      category: "plugin",
      status: "cached_not_session_callable"
    });
    expect(clickup?.stopConditions).toContain("cached_plugin_treated_as_callable");
  });

  it("routes local web QA to the browser and web-app tool lanes", () => {
    const route = selectToolInventoryForTask({
      task: "Use Browser for localhost web app testing and screenshot QA"
    });

    expect(route.matchingItems).toEqual(expect.arrayContaining(["browser_plugin", "build_web_apps_plugin"]));
    expect(route.requiredChecks).toEqual(expect.arrayContaining(["known_local_target", "responsive_check"]));
    expect(route.notes).toContain("Cached-only plugin bundles are evidence of local cache state, not callable capability.");
  });

  it("keeps cached plugin requests behind tool-search confirmation", () => {
    const route = selectToolInventoryForTask({
      task: "Use ClickUp project management integration"
    });

    expect(route.matchingItems).toContain("cached_clickup_bundle");
    expect(route.requiredChecks).toContain("tool_search_confirms_callable");
    expect(route.stopConditions).toContain("cached_plugin_treated_as_callable");
  });
});
