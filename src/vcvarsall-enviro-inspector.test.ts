import * as core from '@actions/core';
import * as exec from '@actions/exec';
import {
  Architecture,
  PlatformType,
  isWindowsSdkVersion,
  isToolsetVersion,
  inspectVCVarsAllEnvironmentVariables,
  _testInternals,
} from './vcvarsall-enviro-inspector';
import {arch} from 'os';
import {Inputs} from './inputsResolver';
import {IfNonWindows} from './checkPlatform';
import {CaseInsensitiveStringMap} from './CaseInsensitiveMap';
import path from 'path';

const originalEnv = process.env;

beforeEach(() => {
  process.env = {...originalEnv};
  jest.clearAllMocks();
  core.clear();
  exec.clear();
});
afterEach(() => {
  process.env = originalEnv;
  core.clear();
  exec.clear();
});

describe('Architecture', () => {
  it('should have correct values', () => {
    expect(Architecture.x86).toBe('x86');
    expect(Architecture.x64).toBe('amd64');
    expect(Architecture.x86_x64).toBe('x86_amd64');
    expect(Architecture.x86_arm32).toBe('x86_arm');
    expect(Architecture.x86_arm64).toBe('x86_arm64');
    expect(Architecture.x64_x86).toBe('amd64_x86');
    expect(Architecture.x64_arm32).toBe('amd64_arm');
    expect(Architecture.x64_arm64).toBe('amd64_arm64');
  });
});

describe('PlatformType', () => {
  it('should have correct values', () => {
    expect(PlatformType.Desktop).toBe('desktop');
    expect(PlatformType.Store).toBe('store');
    expect(PlatformType.UWP).toBe('uwp');
  });
});

describe('WindowsSdkVersion', () => {
  it('should allow valid SDK versions', () => {
    expect(isWindowsSdkVersion('10.0')).toBe(true);
    expect(isWindowsSdkVersion('10.0.19041.0')).toBe(true);
  });
  it('should NOT allow invalid formats', () => {
    expect(isWindowsSdkVersion('')).toBe(false);
    expect(isWindowsSdkVersion('10')).toBe(false);
    expect(isWindowsSdkVersion('10.0.1')).toBe(false);
    expect(isWindowsSdkVersion('10.0.1.2.3')).toBe(false);
    expect(isWindowsSdkVersion('abc.def')).toBe(false);
  });
});

describe('ToolsetVersion', () => {
  it('should allow valid toolset versions', () => {
    expect(isToolsetVersion('14')).toBe(true);
    expect(isToolsetVersion('14.0')).toBe(true);
    expect(isToolsetVersion('14.0.25420')).toBe(true);
  });
  it('should NOT allow invalid formats', () => {
    expect(isToolsetVersion('')).toBe(false);
    expect(isToolsetVersion('14.0.25420.1')).toBe(false);
    expect(isToolsetVersion('abc.def')).toBe(false);
  });
});

describe('buildArgumentsFromInputs', () => {
  const buildArgumentsFromInputs = _testInternals?.buildArgumentsFromInputs;
  if (!buildArgumentsFromInputs) {
    throw new Error('buildArgumentsFromInputs is not available for testing');
  }
  const defaultInputs: Inputs = {
    vsVersion: 'latest',
    architecture: Architecture.x86,
    platformType: PlatformType.Desktop,
    windowsSdkVersion: null,
    toolsetVersion: null,
    spectreMode: false,
    canonicalizePaths: false,
    ifNotWindows: IfNonWindows.Fail,
    updateEnv: true,
    debug: false,
  };
  it('should always include the architecture', () => {
    const args = buildArgumentsFromInputs({...defaultInputs, architecture: Architecture.x64_arm64});
    expect(args).toEqual(['amd64_arm64']);
  });
  it('should handle desktop platform type', () => {
    const inputs: Inputs = {
      ...defaultInputs,
      platformType: PlatformType.Desktop,
      windowsSdkVersion: '10.0.19041.0',
    };
    const args = buildArgumentsFromInputs(inputs);
    expect(args).toEqual(['x86', '10.0.19041.0']);
  });
  it('should include platformType and windowsSdkVersion when provided', () => {
    const inputs: Inputs = {
      ...defaultInputs,
      platformType: PlatformType.UWP,
      windowsSdkVersion: '10.0.19041.0',
    };
    const args = buildArgumentsFromInputs(inputs);
    expect(args).toEqual(['x86', 'uwp', '10.0.19041.0']);
  });
  it('should format toolsetVersion with the correct flag', () => {
    const inputs: Inputs = {
      ...defaultInputs,
      toolsetVersion: '14.29',
    };
    const args = buildArgumentsFromInputs(inputs);
    expect(args).toEqual(['x86', '-vcvars_ver=14.29']);
  });
  it('should include spectre flag only when spectreMode is true', () => {
    const withoutSpectre = buildArgumentsFromInputs({...defaultInputs, spectreMode: false});
    expect(withoutSpectre).toEqual(['x86']);
    const withSpectre = buildArgumentsFromInputs({...defaultInputs, spectreMode: true});
    expect(withSpectre).toEqual(['x86', '-vcvars_spectre_libs=spectre']);
  });
  it('should produce the correct array when all optional inputs are set', () => {
    const inputs: Inputs = {
      ...defaultInputs,
      architecture: Architecture.x86,
      platformType: PlatformType.Store,
      windowsSdkVersion: '10.0',
      toolsetVersion: '14.0',
      spectreMode: true,
    };
    const args = buildArgumentsFromInputs(inputs);
    expect(args).toEqual(['x86', 'store', '10.0', '-vcvars_ver=14.0', '-vcvars_spectre_libs=spectre']);
  });
});

describe('buildMinimalEnv', () => {
  const buildMinimalEnv = _testInternals?.buildMinimalEnv;
  if (!buildMinimalEnv) {
    throw new Error('buildMinimalEnv is not available for testing');
  }
  it('should include PROCESSOR_ARCHITECTURE', () => {
    process.env = {
      ComSpec: 'C:\\Windows\\System32\\cmd.exe',
      windir: 'C:\\Windows',
      SystemRoot: 'C:\\Windows',
    };
    const env = buildMinimalEnv();
    expect(env).toEqual({
      ComSpec: 'C:\\Windows\\System32\\cmd.exe',
      Path: `C:\\Windows${path.sep}System32;C:\\Windows`,
      SystemRoot: 'C:\\Windows',
      windir: 'C:\\Windows',
    });
  });
});

describe('getRandomString', () => {
  const getRandomString = _testInternals?.getRandomString;
  if (!getRandomString) {
    throw new Error('getRandomString is not available for testing');
  }
  it('should return a string of the specified length', () => {
    const str = getRandomString(16);
    expect(typeof str).toBe('string');
    expect(str).toMatch(/^[a-zA-Z0-9]{16}$/);
  });
  it('should return different strings on subsequent calls', () => {
    const str1 = getRandomString(16);
    const str2 = getRandomString(16);
    expect(str1).not.toBe(str2);
  });
});

describe('inspectVCVarsAllEnvironmentVariables', () => {
  it('should throw an error if vcvarsall.bat fails', async () => {
    const inputs: Inputs = {
      vsVersion: 'latest',
      architecture: Architecture.x86,
      platformType: null,
      windowsSdkVersion: null,
      toolsetVersion: null,
      spectreMode: false,
      canonicalizePaths: false,
      ifNotWindows: IfNonWindows.Fail,
      updateEnv: true,
      debug: false,
    };
    exec.addExecResult({
      stdout: '',
      stderr: 'Error: vcvarsall.bat failed to execute',
      exitCode: 1,
    });
    await expect(inspectVCVarsAllEnvironmentVariables(inputs, 'C:\\Invalid\\Path\\To\\vcvarsall.bat')).rejects.toThrow(
      /Failed to get environment variables/,
    );
  });
  it('should return environment variables when vcvarsall.bat succeeds', async () => {
    const inputs: Inputs = {
      vsVersion: 'latest',
      architecture: Architecture.x86,
      platformType: null,
      windowsSdkVersion: null,
      toolsetVersion: null,
      spectreMode: false,
      canonicalizePaths: true,
      ifNotWindows: IfNonWindows.Fail,
      updateEnv: true,
      debug: false,
    };
    const fixedChars = '1234567890abcdef';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let callCount = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      const char = fixedChars[callCount % fixedChars.length];
      callCount++;
      return chars.indexOf(char) / chars.length;
    });
    const mockEnvBefore = ['COMMON=common', 'ONLY_BEFORE=before', 'CHANGED=before,'].join('\r\n');
    const mockEnvAfter = ['COMMON=common', 'ONLY_AFTER=after', 'CHANGED=after,'].join('\r\n');
    exec.addExecResult({
      stdout: `${mockEnvBefore}[----------SEPARATOR-1234567890abcdef----------]\r\n ignored [----------SEPARATOR-1234567890abcdef----------]\r\n${mockEnvAfter}`,
      stderr: '',
      exitCode: 0,
    });
    const envVars = await inspectVCVarsAllEnvironmentVariables(inputs, 'C:\\Path\\To\\vcvarsall.bat');
    expect(envVars).toEqual(
      new CaseInsensitiveStringMap([
        ['ONLY_AFTER', 'after'],
        ['CHANGED', 'after,'],
      ]),
    );
  });
  it('should handle cases where separator is not found', async () => {
    const inputs: Inputs = {
      vsVersion: 'latest',
      architecture: Architecture.x86,
      platformType: null,
      windowsSdkVersion: null,
      toolsetVersion: null,
      spectreMode: false,
      canonicalizePaths: true,
      ifNotWindows: IfNonWindows.Fail,
      updateEnv: true,
      debug: false,
    };
    exec.addExecResult({
      stdout: 'Unexpected output without separator',
      stderr: '',
      exitCode: 0,
    });
    await expect(inspectVCVarsAllEnvironmentVariables(inputs, 'C:\\Path\\To\\vcvarsall.bat')).rejects.toThrow(
      /Failed to parse environment variables/,
    );
  });
});
