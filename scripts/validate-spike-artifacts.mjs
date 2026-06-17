#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const [, , type, file] = process.argv;

if (!["worker", "reviewer"].includes(type) || !file) {
  console.error("Usage: node scripts/validate-spike-artifacts.mjs <worker|reviewer> <artifact.json>");
  process.exit(2);
}

const schemaPath = resolve(`model-output-evals/${type}-output.schema.json`);
const artifactPath = resolve(file);
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const ajv = new Ajv({ strict: true, allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);

if (!validate(artifact)) {
  console.error("VALIDATION FAILED:");
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

console.log(`OK: ${file} validates against model-output-evals/${type}-output.schema.json`);
