import * as core from '@actions/core';
import {CaseInsensitiveStringMap} from './CaseInsensitiveMap';
import {EnvVarFilter} from './inputsResolver';

export default function updateEnv(vars: CaseInsensitiveStringMap, filter?: EnvVarFilter): void {
  for (const [key, value] of vars) {
    const upperKey = key.toUpperCase();
    if (filter) {
      const inList = filter.upperCaseNames.includes(upperKey);
      if (filter.negated === inList) {
        continue;
      }
    }
    switch (upperKey) {
      case 'PATH':
        const currentPath = process.env.PATH!;
        core.exportVariable(key, `${value};${currentPath}`);
        break;
      default:
        core.exportVariable(key, value);
        break;
    }
  }
}
