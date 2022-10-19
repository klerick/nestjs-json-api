import { BuilderContext, createBuilder } from '@angular-devkit/architect';
import semanticRelease from 'semantic-release';

import { ReleaseExecutorSchema } from './schema';
import { releaseNotesGenerator } from './release-notes-generator';
import { commitAnalyzer } from './commit-analyzer';
import { npm } from './npm';
import { plugins } from './plugins';
import { preparePlugin } from './prepare-plugin';
import { platformPlugin } from './platform-plugin';

export async function runRelease(
  options: ReleaseExecutorSchema,
  builderContext: BuilderContext
) {
  const {
    npm: { pkgRoot },
    dryRun,
    publishable,
    branches,
  } = options;

  const { project } = builderContext.target;

  const { outputPath } = await builderContext
    .getTargetOptions({
      project,
      target: 'build',
    })
    .catch(() => ({ outputPath: null }));

  const publishPath = outputPath ?? pkgRoot;

  if (publishable && !publishPath) {
    return {
      success: false,
      error: `Builder can't detect output path for the '${project}' project automatically. Please, provide the 'npm.pkgRoot' option`,
    };
  } else if (publishable) {
    builderContext.logger.info(
      `The directory ${publishPath} will be used for publishing`
    );
  }

  return semanticRelease(
    {
      tagFormat: `${project}@\${version}`,
      branches,
      extends: undefined,
      dryRun,
      plugins: plugins([
        // preparePlugin({ publishable, publishPath }),
        commitAnalyzer({ project }),
        releaseNotesGenerator({ project }),
        // npm({ publishable, publishPath }),
        // platformPlugin(options, builderContext),
      ]),
    },
    {
      env: { ...process.env },
      cwd: '.',
    }
  )
    .then((result) => {
      if (result) {
        const {
          nextRelease: { version },
        } = result;

        builderContext.logger.info(
          `The '${project}' project released with version ${version}`
        );
      } else {
        builderContext.logger.info(
          `No new release for the '${project}' project`
        );
      }

      return { success: true };
    })
    .catch((err) => {
      builderContext.logger.error(err);

      return {
        success: false,
        error: `The automated release failed with error: ${err}`,
      };
    });
}

export const SemrelBuilder = createBuilder(runRelease);

export default SemrelBuilder;
