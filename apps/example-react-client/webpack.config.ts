import { Configuration, RuleSetRule } from 'webpack';
import getWebpackConfig from '@nx/react/plugins/webpack';
import { AngularWebpackPlugin } from '@ngtools/webpack';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { resolve } from 'path';

const arrayLibsLink = [
  '@angular/common/http',
  '@angular/common',
  '@angular/core',
  '@angular/platform-browser',
  'json-api-nestjs-sdk',
  'environment',
  'database',
];

const rules: RuleSetRule[] = [
  {
    test: new RegExp(arrayLibsLink.join('|')),
    use: [
      {
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          compact: true,
          plugins: ['@angular/compiler-cli/linker/babel'],
        },
      },
      {
        loader: '@angular-devkit/build-angular/src/babel/webpack-loader',
        options: {
          aot: true,
          optimize: true,
          scriptTarget: 7,
        },
      },
      {
        loader: '@ngtools/webpack',
      },
    ],
  },
];

export default function webPackConfig(
  config: Configuration,
  context: ExecutorContext
): Configuration {
  // @ts-ignore
  const resultConfig = getWebpackConfig(config);

  if (resultConfig.optimization && resultConfig.optimization.minimizer) {
    resultConfig.optimization.minimizer
      .filter((i: any) => i.constructor.name === 'TerserPlugin')
      .forEach(
        // @ts-ignore
        (i) => (i['options'].minimizer.options['keep_classnames'] = true)
      );
  }
  if (resultConfig.module && resultConfig.module.rules) {
    resultConfig.module.rules.push(...rules);
  }

  if (resultConfig.plugins) {
    resultConfig.plugins.push(
      new AngularWebpackPlugin({
        // @ts-ignore
        tsconfig: (context['buildOptions'] || context['options']).tsConfig,
        jitMode: false,
        directTemplateLoading: true,
      })
    );
  }

  (resultConfig.resolve || {}).alias = {
    typeorm: resolve(
      __dirname,
      '../../node_modules/typeorm/typeorm-model-shim'
    ),
    validator: resolve(__dirname, '../../node_modules/validator/es'),
  };
  return resultConfig;
}
