import { PluginSpec } from 'semantic-release';
import { join } from 'path';

export function preparePlugin({
  publishable,
  publishPath,
}: {
  publishable: boolean;
  publishPath: string;
}): PluginSpec | null {
  let plugin: string;
  try {
    require.resolve('@nestjs-json-api/sevrel');
    plugin = '@ng-builders/semrel';
  } catch (e) {
    plugin = join(process.cwd(), './dist/libs/semrel');
  }

  return publishable ? [plugin, { publishPath }] : null;
}
