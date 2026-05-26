import { expect, test } from "@playwright/test";

test.describe("Autopilot command center", () => {
  test("renders the read-only delivery system overview", async ({ page }) => {
    await page.goto("/autopilot");

    await expect(page.getByRole("heading", { name: "Autopilot Command Center" })).toBeVisible();
    await expect(page.getByTestId("read-only-status")).toContainText("Read-only");
    await expect(page.getByTestId("read-only-status")).toContainText("Non-executing");
    await expect(page.getByTestId("governance-gates")).toContainText("architecture compliance");
    await expect(page.getByTestId("ledger-summary")).toContainText("Decision fields");
    await expect(page.getByTestId("workflow-map")).toContainText("business review");
    await expect(page.getByTestId("decision-mesh-coverage")).toContainText("capability routing");
    await expect(page.getByTestId("decision-mesh-coverage")).toContainText("project meshes");
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 1000 }
  ]) {
    test(`has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/autopilot");

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );

      expect(hasHorizontalOverflow).toBe(false);
    });
  }
});
