import {computeEnvDelta, parseSetOutput, canonicalizePaths} from './envVars';
import * as log from './log';
import * as path from 'node:path';
import run, {Result as RunResult} from './runner';
import {type CaseInsensitiveStringMap} from './CaseInsensitiveMap';
import {Inputs} from './inputsResolver';

export enum Architecture {
  /**
   * Host: x86 or x64
   * Target: x86
   */
  x86 = 'x86',
  /**
   * Host: x64
   * Target: x64
   */
  x64 = 'amd64',
  /**
   * Host: x86 or x64
   * Target: x64
   */
  x86_x64 = 'x86_amd64',
  /**
   * Host: x86 or x64
   * Target: ARM
   */
  x86_arm = 'x86_arm',
  /**
   * Host: x86 or x64
   * Target: ARM64
   */
  x86_arm64 = 'x86_arm64',
  /**
   * Host: x64
   * Target: x86
   */
  x64_x86 = 'amd64_x86',
  /**
   * Host: x64
   * Target: ARM
   */
  x64_arm = 'amd64_arm',
  /**
   * Host: x64
   * Target: ARM64
   */
  x64_arm64 = 'amd64_arm64',
}

export enum PlatformType {
  Desktop = 'desktop',
  Store = 'store',
  UWP = 'uwp',
}

export type WindowsSdkVersion = `${number}.${number}` | `${number}.${number}.${number}.${number}`;

export function isWindowsSdkVersion(s: string): s is WindowsSdkVersion {
  return /^\d+\.\d+(\.\d+\.\d+)?$/.test(s);
}

export type ToolsetVersion = `${number}` | `${number}.${number}` | `${number}.${number}.${number}`;

export function isToolsetVersion(s: string): s is ToolsetVersion {
  return /^\d+(\.\d+){0,2}$/.test(s);
}

/**
 * @see https://learn.microsoft.com/en-us/cpp/build/building-on-the-command-line?view=msvc-170#vcvarsall-syntax
 */
function buildArgumentsFromInputs(inputs: Inputs): string[] {
  const args: string[] = [];
  args.push(inputs.architecture);
  if (inputs.platformType !== PlatformType.Desktop) {
    args.push(inputs.platformType);
  }
  if (inputs.windowsSdkVersion !== null) {
    args.push(inputs.windowsSdkVersion);
  }
  if (inputs.toolsetVersion !== null) {
    args.push(`-vcvars_ver=${inputs.toolsetVersion}`);
  }
  if (inputs.spectreMode) {
    args.push('-vcvars_spectre_libs=spectre');
  }
  return args;
}

function buildMinimalEnv(): Record<string, string> {
  return {
    ComSpec:
      process.env.ComSpec ||
      path.join(process.env.SystemRoot || process.env.windir || 'C:\\Windows', 'System32', 'cmd.exe'),
    Path: [
      path.join(process.env.SystemRoot || process.env.windir || 'C:\\Windows', 'System32'),
      process.env.SystemRoot || process.env.windir || 'C:\\Windows',
    ].join(';'),
    SystemRoot: process.env.SystemRoot || process.env.windir || 'C:\\Windows',
    windir: process.env.SystemRoot || process.env.windir || 'C:\\Windows',
  };
}

function getRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function inspectVCVarsAllEnvironmentVariables(
  inputs: Inputs,
  vcVarsAllPath: string,
): Promise<CaseInsensitiveStringMap> {
  const sep = '[----------SEPARATOR-' + getRandomString(16) + '----------]';
  log.startDebugGroup('Running vcvarsall.bat');
  let result: RunResult;
  try {
    const args = buildArgumentsFromInputs(inputs);
    log.debug(`vcvarsall.bat arguments: ${JSON.stringify(args)}`);
    result = await run(
      'cmd.exe',
      ['/c', `set && echo ${sep} && "${vcVarsAllPath}" ${args.join(' ')} && echo ${sep} && set`],
      {
        env: buildMinimalEnv(),
      },
    );
    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to get environment variables: ${result.stderr || result.stdout || `Exited with code ${result.exitCode}`}`,
      );
    }
  } finally {
    log.endDebugGroup();
  }
  const [rawEnvBefore, _, rawEnvAfter] = result.stdout.split(sep).map((s) => s.trim());
  if (!rawEnvBefore || !rawEnvAfter) {
    throw new Error(`Failed to parse environment variables: ${result.stdout}`);
  }
  log.startDebugGroup('Environment variables before vcvarsall.bat');
  log.debug(rawEnvBefore);
  log.endDebugGroup();
  const envBefore = parseSetOutput(rawEnvBefore);
  log.startDebugGroup('Environment variables after vcvarsall.bat');
  log.debug(rawEnvAfter);
  log.endDebugGroup();
  const envAfter = parseSetOutput(rawEnvAfter);
  let delta: CaseInsensitiveStringMap = computeEnvDelta(envBefore, envAfter);
  if (inputs.canonicalizePaths) {
    delta = canonicalizePaths(delta);
  }
  return delta;
}

export const _testInternals =
  process.env.SETUP_MSVC_TESTING === 'true'
    ? {
        buildArgumentsFromInputs,
        buildMinimalEnv,
        getRandomString,
      }
    : undefined;
