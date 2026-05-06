import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  {
    ignores: [
      '.claude/**',
      '.next/**',
      'coverage/**',
      'dogfood-output/**',
      'node_modules/**',
      'public/logo_files/**',
    ],
  },
  ...nextVitals,
  {
    rules: {
      'react-hooks/incompatible-library': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default config
