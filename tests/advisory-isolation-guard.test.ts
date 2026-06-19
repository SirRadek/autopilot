import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'

// Enforces the advisory isolation invariant (3-vendor review, 2026-06-19): model
// credentials and model SDK access may live ONLY in `src/server/advisory/**`. If a model
// SDK import or a model `*_API_KEY` env access leaks anywhere else, the boundary is
// theatre — so this fails the build. (Note: ClientOps' own MESH_SERVICE_TOKEN /
// WORKFLOW_MUTATION_TOKEN are deliberately NOT matched; only model-provider keys are.)

const SANCTIONED_PREFIX = 'server/advisory/'

const MODEL_ENV = /process\.env\.(OPENAI|ANTHROPIC|GEMINI|GOOGLE_GENAI|GROQ|MISTRAL|COHERE|DEEPSEEK)_API_KEY/
const MODEL_IMPORT = /(from|require\()\s*['"](openai|@anthropic-ai\/|@google\/generative-ai|@google\/genai|groq-sdk|cohere-ai|ollama|@mistralai\/)/

function sourceFiles(): string[] {
  const root = join(process.cwd(), 'src')
  return (readdirSync(root, { recursive: true }) as string[])
    .map((entry) => entry.replace(/\\/g, '/'))
    .filter((entry) => entry.endsWith('.ts') || entry.endsWith('.tsx'))
    .filter((entry) => !entry.startsWith(SANCTIONED_PREFIX))
}

test('no model SDK import or model API key access outside src/server/advisory/**', () => {
  const root = join(process.cwd(), 'src')
  const offenders: string[] = []

  for (const rel of sourceFiles()) {
    const content = readFileSync(join(root, rel), 'utf8')
    if (MODEL_ENV.test(content)) {
      offenders.push(`${rel}: reads a model *_API_KEY env var`)
    }
    if (MODEL_IMPORT.test(content)) {
      offenders.push(`${rel}: imports a model SDK`)
    }
  }

  assert.deepEqual(offenders, [], `model access leaked outside the sanctioned executor:\n${offenders.join('\n')}`)
})

test('the scan actually covers source files (guard is not vacuous)', () => {
  assert.ok(sourceFiles().length > 5)
})
