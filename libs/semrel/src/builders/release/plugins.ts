import { PluginSpec } from 'semantic-release';

export function plugins(pluginSpecs: (PluginSpec | null)[]): PluginSpec[] {
  return pluginSpecs.filter(plugin => !!plugin);
}
