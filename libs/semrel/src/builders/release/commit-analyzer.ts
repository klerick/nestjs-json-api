import { PluginSpec } from 'semantic-release';

export function commitAnalyzer({ project }: { project: string }): PluginSpec {
  return [
    '@semantic-release/commit-analyzer',
    {
      parserOpts: {
        headerPattern: new RegExp(`^(\\w*)(?:\\((${project})\\))?: (.*)$`),
      },
      releaseRules: [
        { breaking: true, scope: project, release: 'major' },
        { revert: true, scope: project, release: 'patch' },
        // Angular
        { type: 'feat', scope: project, release: 'minor' },
        { type: 'fix', scope: project, release: 'patch' },
        { type: 'perf', scope: project, release: 'patch' },
      ],
    },
  ];
}
