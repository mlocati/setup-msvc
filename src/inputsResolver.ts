import * as core from '@actions/core';
import * as os from 'node:os';

import {IfNonWindows} from './checkPlatform';
import {Architecture, PlatformType, ToolsetVersion, WindowsSdkVersion} from './vcvarsall-enviro-inspector';
import {
  getVisualStudioVersionBySpecificVersion,
  LatestVersion,
  type VisualStudioVersion,
  versions as VisualStudioVersions,
} from './VisualStudio';

export interface EnvVarFilter {
  readonly negated: boolean;
  readonly upperCaseNames: Readonly<[string, ...string[]]>;
}

function resolveVisualStudioVersion(version: string): VisualStudioVersion | LatestVersion {
  version = version.trim();
  if (version === '' || ['latest', 'last'].includes(version.toLowerCase())) {
    return 'latest';
  }
  const byYear = VisualStudioVersions.find((v) => v.year === version);
  if (byYear) {
    return byYear;
  }
  const byVersion = getVisualStudioVersionBySpecificVersion(version);
  if (byVersion) {
    return byVersion;
  }
  throw new Error(`Invalid Visual Studio version: ${version}`);
}

function resolveArchitecture(architecture: string): Architecture {
  architecture = architecture.trim();
  if (architecture === '') {
    architecture = os.machine();
  }
  switch (architecture.toLowerCase().replace(/-/g, '_') || '') {
    case '32':
    case 'i386':
    case 'i686':
    case 'ia32':
    case 'win32':
    case 'x86':
      return Architecture.x86;
    case '64':
    case 'amd64':
    case 'win64':
    case 'x64':
    case 'x86_64':
      return Architecture.x64;
    case 'x86_amd64':
    case 'x86_x64':
      return Architecture.x86_x64;
    case 'x86_arm':
    case 'x86_arm32':
      return Architecture.x86_arm;
    case 'x86_arm64':
      return Architecture.x86_arm64;
    case 'amd64_x86':
    case 'x64_x86':
      return Architecture.x64_x86;
    case 'amd64_arm':
    case 'x64_arm':
    case 'amd64_arm32':
    case 'x64_arm32':
      return Architecture.x64_arm;
    case 'amd64_arm64':
    case 'x64_arm64':
      return Architecture.x64_arm64;
    default:
      throw new Error(`Unsupported architecture: ${architecture}`);
  }
}

function resolvePlatformType(platformType: string): PlatformType {
  platformType = platformType.trim();
  switch (platformType.toLowerCase()) {
    case '':
    case 'desktop':
      return PlatformType.Desktop;
    case 'store':
      return PlatformType.Store;
    case 'uwp':
      return PlatformType.UWP;
  }
  throw new Error(`Unsupported platform type: ${platformType}`);
}

function resolveWindowsSdkVersion(version: string): WindowsSdkVersion | null {
  version = version.trim();
  if (version === '') {
    return null;
  }
  if (/^\d+\.\d+$/.test(version)) {
    return version as `${number}.${number}`;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(version)) {
    return version as `${number}.${number}.${number}.${number}`;
  }
  throw new Error(`Invalid Windows SDK version: ${version}`);
}

function resolveToolsetVersion(version: string): ToolsetVersion | null {
  version = version.trim();
  if (version === '') {
    return null;
  }
  if (/^\d+(\.\d+){0,2}$/.test(version)) {
    return version as ToolsetVersion;
  }
  throw new Error(`Invalid toolset version: ${version}`);
}

function resolveIfNonWindows(value: string): IfNonWindows {
  value = value.trim();
  switch (value.toLowerCase()) {
    case '':
    case 'fail':
      return IfNonWindows.Fail;
    case 'warn':
      return IfNonWindows.Warn;
    case 'ignore':
      return IfNonWindows.Ignore;
    default:
      throw new Error(`Invalid value for if-not-windows: ${value}`);
  }
}

function resolveUpdateEnv(value: string): boolean | EnvVarFilter {
  value = value.trim();
  if (value === '' || value.toLowerCase() === 'true') {
    return true;
  }
  if (value.toLowerCase() === 'false') {
    return false;
  }
  let vars: string[] = value
    .replace(/\r/g, '\n')
    .split('\n')
    .map((v) => v.trim())
    .filter((v) => v !== '' && v !== '!');
  const someIsNotNegated = vars.some((v) => !v.startsWith('!'));
  if (someIsNotNegated) {
    return {
      negated: false,
      upperCaseNames: vars.filter((v) => !v.startsWith('!')).map((v) => v.toUpperCase()) as [string, ...string[]],
    };
  }
  return {
    negated: true,
    upperCaseNames: vars.map((v) => v.substring(1).toUpperCase()) as [string, ...string[]],
  };
}

export interface Inputs {
  vsVersion: VisualStudioVersion | LatestVersion;
  architecture: Architecture;
  platformType: PlatformType;
  windowsSdkVersion: WindowsSdkVersion | null;
  toolsetVersion: ToolsetVersion | null;
  spectreMode: boolean;
  canonicalizePaths: boolean;
  ifNotWindows: IfNonWindows;
  updateEnv: boolean | EnvVarFilter;
  debug: boolean;
}

export default function resolveInputs(): Inputs {
  return {
    vsVersion: resolveVisualStudioVersion(core.getInput('vs-version')),
    architecture: resolveArchitecture(core.getInput('architecture')),
    platformType: resolvePlatformType(core.getInput('platform-type')),
    windowsSdkVersion: resolveWindowsSdkVersion(core.getInput('windows-sdk-version')),
    toolsetVersion: resolveToolsetVersion(core.getInput('toolset-version')),
    spectreMode: core.getBooleanInput('spectre-mode'),
    canonicalizePaths: core.getBooleanInput('canonicalize-paths'),
    ifNotWindows: resolveIfNonWindows(core.getInput('if-not-windows')),
    updateEnv: resolveUpdateEnv(core.getInput('update-env')),
    debug: core.getBooleanInput('debug'),
  };
}

export const _testInternals =
  process.env.SETUP_MSVC_TESTING === 'true'
    ? {
        resolveVisualStudioVersion,
        resolveArchitecture,
        resolvePlatformType,
        resolveWindowsSdkVersion,
        resolveToolsetVersion,
        resolveIfNonWindows,
        resolveUpdateEnv,
      }
    : undefined;
