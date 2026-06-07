import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

interface ProjectIndexEntry {
  readonly slug: string;
  readonly name: string;
  readonly status: string;
  readonly architecture_path: string;
  readonly work_log_path: string;
  readonly project_mesh_path: string;
  readonly mesh_status: "present" | "missing";
  readonly library_links: {
    readonly source_ids: readonly string[];
    readonly reference_ids: readonly string[];
    readonly asset_ids: readonly string[];
    readonly pattern_ids: readonly string[];
  };
  readonly notes: string;
}

interface ProjectIndex {
  readonly version: 1;
  readonly updated: string;
  readonly source: string;
  readonly projects: readonly ProjectIndexEntry[];
}

const repoRoot = process.cwd();
const projectsRoot = join(repoRoot, "docs", "projects");
const libraryRoot = join(repoRoot, "product-design-os", "library");
const outputPath = join(libraryRoot, "project-index.json");

function toRepoPath(path: string): string {
  return relative(repoRoot, path).replace(/\\/g, "/");
}

function extractName(slug: string, architecturePath: string): string {
  if (!existsSync(architecturePath)) {
    return slug;
  }

  const content = readFileSync(architecturePath, "utf8");
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading && heading.length > 0 ? heading : slug;
}

function extractStatus(architecturePath: string): string {
  if (!existsSync(architecturePath)) {
    return "unknown";
  }

  const content = readFileSync(architecturePath, "utf8");
  const status = content.match(/^Status:\s*`?([^`\r\n]+)`?/m)?.[1]?.trim();
  return status && status.length > 0 ? status : "unknown";
}

function buildIndex(): ProjectIndex {
  const projects = existsSync(projectsRoot)
    ? readdirSync(projectsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry): ProjectIndexEntry => {
          const slug = basename(entry.name);
          const root = join(projectsRoot, slug);
          const architecturePath = join(root, "architecture.md");
          const workLogPath = join(root, "work-log.md");
          const meshPath = join(root, "decision-mesh");
          const meshPresent = existsSync(meshPath);

          return {
            slug,
            name: extractName(slug, architecturePath),
            status: extractStatus(architecturePath),
            architecture_path: existsSync(architecturePath) ? toRepoPath(architecturePath) : "",
            work_log_path: existsSync(workLogPath) ? toRepoPath(workLogPath) : "",
            project_mesh_path: meshPresent ? toRepoPath(meshPath) : "",
            mesh_status: meshPresent ? "present" : "missing",
            library_links: {
              source_ids: [],
              reference_ids: [],
              asset_ids: [],
              pattern_ids: []
            },
            notes: "Generated from docs/projects. Enrich library links during project design work."
          };
        })
        .sort((a, b) => a.slug.localeCompare(b.slug))
    : [];

  return {
    version: 1,
    updated: new Date().toISOString().slice(0, 10),
    source: "product-design-os/scripts/update-project-library.ts",
    projects
  };
}

mkdirSync(libraryRoot, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(buildIndex(), null, 2)}\n`, "utf8");
console.log(`Updated ${toRepoPath(outputPath)}.`);
