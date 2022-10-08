import { PluginSpec } from 'semantic-release';

export function commitAnalyzer({ project }: { project: string }): PluginSpec {
  return [
    '@semantic-release/commit-analyzer',
    {
      parserOpts: {
        headerPattern: new RegExp(`^(\\w*)(?:\\((${project})\\))?: (.*)$`),
      },
    },
  ];
}
