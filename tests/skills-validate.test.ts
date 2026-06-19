import assert from 'node:assert/strict'
import test from 'node:test'

import { detectAdapterDrift, validateSkills, type AdapterManifest, type SkillContract } from '../scripts/validate-skills'

const core: SkillContract = {
  skill_id: 'safe-refactor',
  version: '1.0.0',
  required_steps: ['read_scoped_files', 'run_tests'],
  forbidden_actions: ['rewrite_unrelated_files'],
  output_schema: '.agent/skills-core/safe-refactor/output.schema.json'
}

const validManifest: AdapterManifest = {
  skill_id: 'safe-refactor',
  core_version: '1.0.0',
  step_tools: { read_scoped_files: 'rg + read', run_tests: 'test runner' },
  forbidden_actions: ['rewrite_unrelated_files']
}

const cleanMarkdown = 'Tool mapping only. read_scoped_files uses rg.'

test('passes a thin, faithful adapter', () => {
  assert.deepEqual(detectAdapterDrift(core, validManifest, cleanMarkdown), [])
})

test('catches an unmapped required step', () => {
  const manifest = { ...validManifest, step_tools: { read_scoped_files: 'rg + read' } }
  assert.ok(detectAdapterDrift(core, manifest, cleanMarkdown).includes('required step not mapped to a tool: run_tests'))
})

test('catches a core_version mismatch', () => {
  const manifest = { ...validManifest, core_version: '0.9.0' }
  assert.match(detectAdapterDrift(core, manifest, cleanMarkdown).join(' '), /does not match core version/)
})

test('catches a dropped forbidden action', () => {
  const manifest = { ...validManifest, forbidden_actions: [] }
  assert.ok(detectAdapterDrift(core, manifest, cleanMarkdown).includes('forbidden action not preserved: rewrite_unrelated_files'))
})

test('catches governance language smuggled into the adapter', () => {
  const markdown = 'This adapter is the source of truth for refactors.'
  assert.match(detectAdapterDrift(core, validManifest, markdown).join(' '), /governance language/)
})

test('validates the real committed .agent/skills-core + adapters', () => {
  const report = validateSkills(process.cwd())
  assert.deepEqual(report.errors, [])
  assert.equal(report.ok, true)
})
