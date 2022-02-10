import { Configuration } from 'webpack';
import { CustomWebpackBrowserSchema, TargetOptions } from '@angular-builders/custom-webpack';
import {resolve} from 'path';

export default function webPackConfig(
  config: Configuration,
  options: CustomWebpackBrowserSchema,
  targetOptions: TargetOptions): Configuration {

  (config.resolve || {}).alias = {
    typeorm: resolve(__dirname, "../../node_modules/typeorm/typeorm-model-shim"),
    validator: resolve(__dirname, "../../node_modules/validator/es")
  }

  return config;
}

