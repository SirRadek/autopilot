import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  {
    ignores: [
      '.next/**',
      'build/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'payload-types.ts',
      'src/payload-types.ts'
    ]
  }
]

export default config
