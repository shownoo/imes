import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'http://localhost:3200/graphql',
  documents: ['src/graphql/**/*.graphql'],
  generates: {
    './src/gql/': {
      preset: 'client',
    },
  },
}

export default config
