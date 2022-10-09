import { Context } from 'semantic-release';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { firstValueFrom, from } from 'rxjs';
import { concatMap, filter } from 'rxjs/operators';
import semver from 'semver';

export const STABLE_CHANNEL = 'stable';

export interface Tag {
  version: string;
  channel: string;
  project?: string;
}

export interface SemanticReleaseContext extends Context {
  branch: { name: string; channel?: string };
}

export function parseTag(tag: string): Tag {
  const [project, version = project] = tag.split('@');

  const channel = semver.parse(version)?.prerelease?.[0] ?? STABLE_CHANNEL;

  return {
    project,
    version,
    channel: typeof channel === 'string' ? channel : undefined,
  };
}

export async function getTags(branch: string): Promise<Tag[]> {
  const { execa } = await import('execa');
  const { stdout } = await execa('git', ['tag', '--merged', branch]);

  return stdout
    .split('\n')
    .map((tag) => tag.trim())
    .filter((tag) => !!tag)
    .map(parseTag);
}

export function getSortedVersions(
  tags: Tag[],
  { project, channel = STABLE_CHANNEL }: { project: string; channel?: string }
): string[] {
  const versions = tags
    .filter((tag) => tag.project === project && tag.channel === channel)
    .map((tag) => tag.version);

  if (channel !== STABLE_CHANNEL && !versions.length) {
    // try to find some stable versions
    return getSortedVersions(tags, { project });
  }

  return semver.rsort(versions);
}

export async function prepare(
  { publishPath }: { publishPath: string },
  context: SemanticReleaseContext
): Promise<void> {
  const pckg = JSON.parse(
    readFileSync(join(publishPath, 'package.json')).toString()
  );

  const obsForPromise = await from([
    'dependencies',
    'peerDependencies',
    'devDependencies',
  ]).pipe(
    filter((type) => !!pckg[type]),
    concatMap((type: string) =>
      from(Object.entries(pckg[type])).pipe(
        filter(([, version]) => version === '0.0.0-development'),
        concatMap(async ([name]) => {
          const [, project = name] = name.split('/');

          const tags = await getTags(context.branch.name);
          const [latest] = await getSortedVersions(tags, {
            project,
            channel: context.branch.channel,
          });

          pckg[type][name] = latest;
        })
      )
    )
  );
  await firstValueFrom(obsForPromise);

  writeFileSync(
    join(publishPath, 'package.json'),
    JSON.stringify(pckg, null, 2)
  );
}
