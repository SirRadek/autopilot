import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  checkDocumentReaderRuntime,
  formatDocumentReaderRuntimeCheck,
  runDocumentReader
} from "../../product-design-os/reader/document-reader-adapter";

const pythonAvailable = spawnSync("python", ["--version"], { encoding: "utf8" }).status === 0;

describe("Product & Design OS document reader adapter", () => {
  let tempRoot = "";

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "pdos-document-reader-"));
  });

  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  test("reports missing pdf-supervisor root without pretending OCR is available", async () => {
    const report = await checkDocumentReaderRuntime({ supervisor_root: "" });
    expect(report.ok).toBe(false);
    expect(report.missing).toContain("PDOS_PDF_SUPERVISOR_ROOT");
    expect(formatDocumentReaderRuntimeCheck(report)).toContain("Status: not ready");
  });

  test("resolves path-like Python overrides before switching worker directories", async () => {
    const python = join(".", "tools", "python.exe");
    const report = await checkDocumentReaderRuntime({ python, supervisor_root: "" });
    expect(report.python).toBe(resolve(python));
  });

  test.skipIf(!pythonAvailable)("runs a bounded external worker and records expected artifacts", async () => {
    const supervisorRoot = await createFakePdfSupervisor(tempRoot);
    const source = join(tempRoot, "sample.csv");
    const outputDir = join(tempRoot, "output");
    await writeFile(source, "A,B\n1,2\n", "utf8");

    const runtime = await checkDocumentReaderRuntime({ supervisor_root: supervisorRoot });
    expect(runtime.ok).toBe(true);
    expect(runtime.checks.find((check) => check.id === "document_supervisor_cli")?.ok).toBe(true);

    const run = await runDocumentReader({
      source,
      output_dir: outputDir,
      supervisor_root: supervisorRoot
    });

    expect(run.ok).toBe(true);
    expect(run.command).toEqual([
      "python",
      "-m",
      "document_supervisor.cli",
      "--source",
      source,
      "--out",
      outputDir
    ]);
    expect(run.artifacts.every((artifact) => artifact.exists)).toBe(true);
    await expect(readFile(join(outputDir, "document.clean.md"), "utf8")).resolves.toContain("Converted sample.csv");
  });
});

async function createFakePdfSupervisor(parent: string): Promise<string> {
  const root = join(parent, "pdf-supervisor");
  const moduleRoot = join(root, "document_supervisor");
  await mkdir(moduleRoot, { recursive: true });
  await writeFile(join(moduleRoot, "__init__.py"), "", "utf8");
  await writeFile(
    join(moduleRoot, "cli.py"),
    [
      "import argparse",
      "import json",
      "from pathlib import Path",
      "",
      "parser = argparse.ArgumentParser()",
      "parser.add_argument('--source', required=True)",
      "parser.add_argument('--out', required=True)",
      "args = parser.parse_args()",
      "source = Path(args.source)",
      "out = Path(args.out)",
      "out.mkdir(parents=True, exist_ok=True)",
      "for name in ['validation.report.json', 'hybrid.routing.json', 'backcheck.report.json', 'semantic.review.json']:",
      "    (out / name).write_text(json.dumps({'source': str(source), 'status': 'ok'}), encoding='utf-8')",
      "(out / 'document.raw.md').write_text(f'# Raw {source.name}\\n', encoding='utf-8')",
      "(out / 'document.clean.md').write_text(f'# Converted {source.name}\\n', encoding='utf-8')",
      "print(out / 'document.clean.md')"
    ].join("\n"),
    "utf8"
  );
  await writeFile(join(root, "requirements-commercial.txt"), "pypdfium2\npdfplumber\npillow\nftfy\n", "utf8");

  for (const dependency of ["pypdfium2", "pdfplumber", "PIL", "ftfy"]) {
    const dependencyRoot = join(root, dependency);
    await mkdir(dependencyRoot, { recursive: true });
    await writeFile(join(dependencyRoot, "__init__.py"), "", "utf8");
  }

  return root;
}
