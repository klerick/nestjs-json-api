import { ReleaseExecutorSchema } from './schema';
import { BuilderContext } from '@angular-devkit/architect';
import { PluginSpec } from 'semantic-release';
import { isObject } from 'util';

const GITLAB_PACKAGE_NAME = '@semantic-release/gitlab';
const GITHUB_PACKAGE_NAME = '@semantic-release/github';

export function platformPlugin(
  { gitlab }: ReleaseExecutorSchema,
  builderContext: BuilderContext
): PluginSpec {
  if (gitlab === true) {
    return GITLAB_PACKAGE_NAME;
  }

  if (gitlab && isObject(gitlab)) {
    return [GITLAB_PACKAGE_NAME, gitlab];
  }

  return [
    GITHUB_PACKAGE_NAME,
    {
      successComment: `:tada: This \${issue.pull_request ? 'pull request' : 'issue'} is included in version ${builderContext.target.project}@\${nextRelease.version} :tada:

The release is available on [GitHub release](<github_release_url>)`,
      releasedLabels: [
        `released<%= nextRelease.channel ? " on @\${nextRelease.channel}" : "" %>`,
        builderContext.target.project,
      ],
    },
  ];
}
