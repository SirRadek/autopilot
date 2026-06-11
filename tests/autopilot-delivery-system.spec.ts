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
    await expect(page.getByTestId("decision-mesh-graph")).toContainText("27 nodes / 55 links");
    await expect(page.getByTestId("decision-mesh-graph")).toContainText("Observability Mesh");
    await expect(page.getByTestId("mesh-svg")).toBeVisible();
    await expect(page.getByTestId("project-delivery-workflow")).toContainText("8 ordered phases");
    await expect(page.getByTestId("project-delivery-workflow")).toContainText("Owner");
    await expect(page.getByTestId("project-delivery-workflow")).toContainText("Qwen Worker");
    await expect(page.getByTestId("project-delivery-workflow")).toContainText("GitHub");
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

  test("has basic accessibility labels on interactive and media elements", async ({ page }) => {
    await page.goto("/autopilot");

    const unlabeledInteractiveCount = await page.evaluate(() => {
      const controls = [...document.querySelectorAll("a, button, input, select, textarea")];
      return controls.filter((control) => {
        const ariaLabel = control.getAttribute("aria-label")?.trim();
        const labelledBy = control.getAttribute("aria-labelledby")?.trim();
        const text = control.textContent?.trim();
        const title = control.getAttribute("title")?.trim();
        return !ariaLabel && !labelledBy && !text && !title;
      }).length;
    });

    const imageWithoutAltCount = await page.evaluate(
      () => [...document.querySelectorAll("img")].filter((image) => !image.hasAttribute("alt")).length
    );

    expect(unlabeledInteractiveCount).toBe(0);
    expect(imageWithoutAltCount).toBe(0);
  });
});
