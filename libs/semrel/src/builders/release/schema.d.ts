import { JsonObject } from '@angular/compiler-cli/ngcc/src/packages/entry_point';

export interface ReleaseExecutorSchema extends JsonObject {
  publishable: boolean;
  npm?: { pkgRoot?: string };
  dryRun?: boolean;
  gitlab?:
    | boolean
    | {
        gitlabUrl?: string;
        gitlabApiPathPrefix?: string;
        assets?: Array<{ path: string; label?: string }>;
      };
  branches: Array<string | { name: string; prerelease?: boolean }>;
}
