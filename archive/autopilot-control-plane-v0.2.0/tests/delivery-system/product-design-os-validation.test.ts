import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { validateJsonSchema } from "../../src/lib/delivery-system/validation";
import {
  formatPdosValidationReport,
  validateProductDesignOs
} from "../../product-design-os/scripts/validate-product-design-os";

interface MutableCatalogEntry extends Record<string, unknown> {
  readonly id?: string;
  readonly slug?: string;
  source?: string;
  source_url?: string;
  status?: string;
  commercial_use?: string;
  provenance_status?: string;
  library_source_id?: string;
  reference_ids?: string[];
  license?: Record<string, unknown>;
  library_links?: ProjectLinks;
}

interface ProjectLinks {
  source_ids: string[];
  reference_ids: string[];
  asset_ids: string[];
  pattern_ids: string[];
}

interface SourceCatalog extends Record<string, unknown> {
  sources: MutableCatalogEntry[];
}

interface ReferenceCatalog extends Record<string, unknown> {
  references: MutableCatalogEntry[];
}

interface AssetManifest extends Record<string, unknown> {
  assets: MutableCatalogEntry[];
}

interface PatternManifest extends Record<string, unknown> {
  patterns: MutableCatalogEntry[];
}

interface ProjectIndex extends Record<string, unknown> {
  projects: MutableCatalogEntry[];
}

describe("Product & Design OS validation", () => {
  it("validates the current Product & Design OS foundation", () => {
    const report = validateProductDesignOs(process.cwd());

    expect(report.ok).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.checkedFiles).toContain("product-design-os/briefs/project-brief.schema.json");
    expect(report.checkedFiles).toContain("product-design-os/recipes/creative-motion.json");
    expect(report.checkedFiles).toContain("product-design-os/assets/asset-manifest.json");
    expect(report.checkedFiles).toContain("product-design-os/patterns/pattern-manifest.json");
  });

  it("formats validation reports for CLI output", () => {
    const report = validateProductDesignOs(process.cwd());
    const formatted = formatPdosValidationReport(report);

    expect(formatted).toContain("PDOS validation passed.");
    expect(formatted).toContain("Errors: 0");
  });

  it("rejects project index entries with free-form status values", () => {
    const schema = JSON.parse(
      readFileSync(join(process.cwd(), "product-design-os", "library", "project-entry.schema.json"), "utf8")
    ) as unknown;
    const errors = validateJsonSchema(
      {
        slug: "demo",
        name: "Demo",
        status: "active",
        status_label: "active",
        architecture_path: "docs/projects/demo/architecture.md",
        work_log_path: "docs/projects/demo/work-log.md",
        project_mesh_path: "docs/projects/demo/decision-mesh",
        mesh_status: "present",
        library_links: {
          source_ids: [],
          reference_ids: [],
          asset_ids: [],
          pattern_ids: []
        }
      },
      schema
    );

    expect(errors.map((error) => error.message).join("\n")).toContain(
      "must be one of: not_started, ready, in_progress"
    );
  });

  it("rejects duplicate IDs inside individual Product & Design OS catalogs", () => {
    const root = createProductDesignOsFixture();

    try {
      const sourceCatalog = readFixtureJson<SourceCatalog>(root, "product-design-os/library/source-catalog.json");
      sourceCatalog.sources.push({ ...firstEntry(sourceCatalog.sources, "source catalog") });
      writeFixtureJson(root, "product-design-os/library/source-catalog.json", sourceCatalog);

      const referenceCatalog = readFixtureJson<ReferenceCatalog>(root, "product-design-os/library/reference-catalog.json");
      referenceCatalog.references.push({ ...firstEntry(referenceCatalog.references, "reference catalog") });
      writeFixtureJson(root, "product-design-os/library/reference-catalog.json", referenceCatalog);

      const assetManifest = readFixtureJson<AssetManifest>(root, "product-design-os/assets/asset-manifest.json");
      assetManifest.assets.push({ ...firstEntry(assetManifest.assets, "asset manifest") });
      writeFixtureJson(root, "product-design-os/assets/asset-manifest.json", assetManifest);

      const patternManifest = readFixtureJson<PatternManifest>(root, "product-design-os/patterns/pattern-manifest.json");
      patternManifest.patterns.push({ ...firstEntry(patternManifest.patterns, "pattern manifest") });
      writeFixtureJson(root, "product-design-os/patterns/pattern-manifest.json", patternManifest);

      const projectIndex = readFixtureJson<ProjectIndex>(root, "product-design-os/library/project-index.json");
      projectIndex.projects.push({ ...firstEntry(projectIndex.projects, "project index") });
      writeFixtureJson(root, "product-design-os/library/project-index.json", projectIndex);

      const messages = validateProductDesignOs(root).errors.map((error) => error.message).join("\n");

      expect(messages).toContain("sources[");
      expect(messages).toContain("duplicates id");
      expect(messages).toContain("references[");
      expect(messages).toContain("assets[");
      expect(messages).toContain("patterns[");
      expect(messages).toContain("projects[");
      expect(messages).toContain("duplicates slug");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects unknown asset and project catalog links", () => {
    const root = createProductDesignOsFixture();

    try {
      const assetManifest = readFixtureJson<AssetManifest>(root, "product-design-os/assets/asset-manifest.json");
      const asset = firstEntry(assetManifest.assets, "asset manifest");
      const assetId = requiredString(asset.id, "asset id");
      asset.library_source_id = "missing-source";
      asset.reference_ids = ["missing-reference"];
      writeFixtureJson(root, "product-design-os/assets/asset-manifest.json", assetManifest);

      const projectIndex = readFixtureJson<ProjectIndex>(root, "product-design-os/library/project-index.json");
      firstEntry(projectIndex.projects, "project index").library_links = {
        source_ids: ["missing-source"],
        reference_ids: ["missing-reference"],
        asset_ids: ["missing-asset"],
        pattern_ids: ["missing-pattern"]
      };
      writeFixtureJson(root, "product-design-os/library/project-index.json", projectIndex);

      const messages = validateProductDesignOs(root).errors.map((error) => error.message).join("\n");

      expect(messages).toContain(`Asset ${assetId} references missing library_source_id missing-source.`);
      expect(messages).toContain(`Asset ${assetId} references unknown reference_ids value missing-reference.`);
      expect(messages).toContain("Project autopilot-control-plane references unknown source_ids value missing-source.");
      expect(messages).toContain("Project autopilot-control-plane references unknown reference_ids value missing-reference.");
      expect(messages).toContain("Project autopilot-control-plane references unknown asset_ids value missing-asset.");
      expect(messages).toContain("Project autopilot-control-plane references unknown pattern_ids value missing-pattern.");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects source-recorded assets backed by inspiration-only or unknown-license provenance", () => {
    const root = createProductDesignOsFixture();

    try {
      const sourceCatalog = readFixtureJson<SourceCatalog>(root, "product-design-os/library/source-catalog.json");
      const primarySource = firstEntry(sourceCatalog.sources, "source catalog");
      const secondarySource = entryAt(sourceCatalog.sources, 1, "source catalog");
      const primarySourceId = requiredString(primarySource.id, "primary source id");
      const secondarySourceId = requiredString(secondarySource.id, "secondary source id");
      primarySource.status = "inspiration_only";
      const sourceLicense = primarySource.license ?? {};
      sourceLicense.type = "unknown";
      primarySource.license = sourceLicense;
      primarySource.commercial_use = "unknown";
      writeFixtureJson(root, "product-design-os/library/source-catalog.json", sourceCatalog);

      const referenceCatalog = readFixtureJson<ReferenceCatalog>(root, "product-design-os/library/reference-catalog.json");
      const reference = firstEntry(referenceCatalog.references, "reference catalog");
      const referenceId = requiredString(reference.id, "reference id");
      const referenceSourceUrl = requiredString(reference.source_url, "reference source_url");
      reference.status = "inspiration_only";
      writeFixtureJson(root, "product-design-os/library/reference-catalog.json", referenceCatalog);

      const assetManifest = readFixtureJson<AssetManifest>(root, "product-design-os/assets/asset-manifest.json");
      const primaryAsset = firstEntry(assetManifest.assets, "asset manifest");
      const secondaryAsset = entryAt(assetManifest.assets, 1, "asset manifest");
      const primaryAssetId = requiredString(primaryAsset.id, "primary asset id");
      const secondaryAssetId = requiredString(secondaryAsset.id, "secondary asset id");
      primaryAsset.source = "https://example.com/source-recorded.svg";
      primaryAsset.library_source_id = primarySourceId;
      primaryAsset.provenance_status = "source-recorded";
      secondaryAsset.source = referenceSourceUrl;
      secondaryAsset.library_source_id = secondarySourceId;
      secondaryAsset.provenance_status = "source-recorded";
      writeFixtureJson(root, "product-design-os/assets/asset-manifest.json", assetManifest);

      const messages = validateProductDesignOs(root).errors.map((error) => error.message).join("\n");

      expect(messages).toContain(
        `Asset ${primaryAssetId} uses inspiration-only source ${primarySourceId} and must stay inspiration-only.`
      );
      expect(messages).toContain(
        `Asset ${primaryAssetId} cannot use non-adoptable source ${primarySourceId} for source-recorded provenance.`
      );
      expect(messages).toContain(
        `Asset ${secondaryAssetId} cannot use inspiration-only reference ${referenceId} as source-recorded provenance.`
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects legacy project status labels in the status field through the full validator", () => {
    const root = createProductDesignOsFixture();

    try {
      const projectIndex = readFixtureJson<ProjectIndex>(root, "product-design-os/library/project-index.json");
      const project = firstEntry(projectIndex.projects, "project index");
      project.status = "active";
      project.status_label = "active process layer";
      writeFixtureJson(root, "product-design-os/library/project-index.json", projectIndex);

      const messages = validateProductDesignOs(root).errors.map((error) => error.message).join("\n");

      expect(messages).toContain("Project autopilot-control-plane has invalid status active; use status_label for free-form labels.");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

function createProductDesignOsFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "pdos-validation-"));
  copyDirectory(join(process.cwd(), "product-design-os"), join(root, "product-design-os"));

  return root;
}

function copyDirectory(source: string, target: string): void {
  mkdirSync(target, { recursive: true });

  for (const entry of readdirSync(source)) {
    const sourcePath = join(source, entry);
    const targetPath = join(target, entry);
    const stats = statSync(sourcePath);

    if (stats.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    copyFileSync(sourcePath, targetPath);
  }
}

function readFixtureJson<T extends Record<string, unknown>>(root: string, path: string): T {
  return JSON.parse(readFileSync(join(root, path), "utf8")) as T;
}

function writeFixtureJson(root: string, path: string, value: unknown): void {
  writeFileSync(join(root, path), `${JSON.stringify(value, null, 2)}\n`);
}

function firstEntry<T>(entries: readonly T[], label: string): T {
  return entryAt(entries, 0, label);
}

function entryAt<T>(entries: readonly T[], index: number, label: string): T {
  const entry = entries[index];
  if (entry === undefined) {
    throw new Error(`Expected ${label} fixture to contain entry at index ${index}.`);
  }

  return entry;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected ${label} fixture value to be a non-empty string.`);
  }

  return value;
}
