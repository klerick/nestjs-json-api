import { PluginSpec } from 'semantic-release';

export function npm({
  publishable,
  publishPath
}: {
  publishable: boolean;
  publishPath: string;
}): PluginSpec | null {
  return publishable
    ? ['@semantic-release/npm', { pkgRoot: publishPath }]
    : null;
}
