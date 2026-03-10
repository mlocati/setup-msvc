import {IfNonWindows} from './checkPlatform';
import {Architecture, PlatformType} from './vcvarsall-enviro-inspector';
import resolveInputs, {_testInternals} from './inputsResolver';
import * as core from '@actions/core';

afterEach(() => {
  core.clear();
});

describe('resolveVisualStudioVersion', () => {
  const resolveVisualStudioVersion = _testInternals?.resolveVisualStudioVersion;
  if (!resolveVisualStudioVersion) {
    throw new Error('resolveVisualStudioVersion is not available for testing');
  }

  it('should resolve versions correctly', () => {
    expect(resolveVisualStudioVersion('latest')).toBe('latest');
    expect(resolveVisualStudioVersion(' \n LaTeSt  \n\t')).toBe('latest');
    expect(resolveVisualStudioVersion('')).toBe('latest');
    expect(resolveVisualStudioVersion('\n \t 2022 ')).toEqual(expect.objectContaining({year: '2022', version: '17.0'}));
    expect(resolveVisualStudioVersion('16.0')).toEqual(expect.objectContaining({year: '2019', version: '16.0'}));
    expect(resolveVisualStudioVersion('15.9')).toEqual(expect.objectContaining({year: '2017', version: '15.0'}));
    expect(() => resolveVisualStudioVersion('invalid')).toThrow('Invalid Visual Studio version: invalid');
  });
});

describe('resolveArchitecture', () => {
  const resolveArchitecture = _testInternals?.resolveArchitecture;
  if (!resolveArchitecture) {
    throw new Error('resolveArchitecture is not available for testing');
  }

  const x86Variants = ['32', 'i386', '   I386 ', '\ni686', 'iA32\t', 'wIn32', 'x86'];
  it.each(x86Variants)('should resolve x86 architectures correctly for %s', (variant) => {
    expect(resolveArchitecture(variant)).toBe(Architecture.x86);
  });

  const x64Variants = ['64', 'AmD64', '\nwIn64\t', '\nX64', 'X86-64', 'X86_64'];
  it.each(x64Variants)('should resolve x64 architectures correctly for %s', (variant) => {
    expect(resolveArchitecture(variant)).toBe(Architecture.x64);
  });

  const x86amd64Variants = ['x86_amd64', 'x86-x64', '\tX86_AMD64', 'X86-X64\n'];
  it.each(x86amd64Variants)('should resolve x86_amd64 architectures correctly for %s', (variant) => {
    expect(resolveArchitecture(variant)).toBe(Architecture.x86_x64);
  });

  const x86armVariants = ['x86_arm', 'x86-arm', '\tx86_ARM', '\tx86-ARM32'];
  it.each(x86armVariants)('should resolve x86_arm architectures correctly for %s', (variant) => {
    expect(resolveArchitecture(variant)).toBe(Architecture.x86_arm);
  });

  const x86arm64Variants = ['x86_arm64', 'x86-arm64', '\tx86_ARM64'];
  it.each(x86arm64Variants)('should resolve x86_arm64 architectures correctly for %s', (variant) => {
    expect(resolveArchitecture(variant)).toBe(Architecture.x86_arm64);
  });

  const x64x86Variants = ['amd64_x86', 'x64_x86', '\tx64_X86', '\tAMD64_X86'];
  it.each(x64x86Variants)('should resolve x64_x86 architectures correctly for %s', (variant) => {
    expect(resolveArchitecture(variant)).toBe(Architecture.x64_x86);
  });

  const x64armVariants = ['amd64_arm', 'x64_arm', '\tX64_ARM', '\tAMD64_ARM', 'x64-arm32', 'amd64-arm32'];
  it.each(x64armVariants)('should resolve x64_arm architectures correctly for %s', (variant) => {
    expect(resolveArchitecture(variant)).toBe(Architecture.x64_arm);
  });

  const x64arm64Variants = ['amd64_arm64', 'x64_arm64', '\tX64_ARM64', '\tAMD64_ARM64', '\tAMD64-ARM64\n'];
  it.each(x64arm64Variants)('should resolve x64_arm64 architectures correctly for %s', (variant) => {
    expect(resolveArchitecture(variant)).toBe(Architecture.x64_arm64);
  });

  it('should default to os.machine() when input is empty', () => {
    const originalOsMachine = jest.requireActual('os').machine;
    jest.spyOn(require('os'), 'machine').mockReturnValue('x64');
    expect(resolveArchitecture('')).toBe(Architecture.x64);
    jest.spyOn(require('os'), 'machine').mockReturnValue('i386');
    expect(resolveArchitecture('\n')).toBe(Architecture.x86);
    jest.spyOn(require('os'), 'machine').mockReturnValue('amd64');
    expect(resolveArchitecture('   ')).toBe(Architecture.x64);
    jest.spyOn(require('os'), 'machine').mockRestore();
  });

  it('should throw an error for unsupported architectures', () => {
    expect(() => resolveArchitecture('unsupported')).toThrow('Unsupported architecture: unsupported');
  });
});

describe('resolvePlatformType', () => {
  const resolvePlatformType = _testInternals?.resolvePlatformType;
  if (!resolvePlatformType) {
    throw new Error('resolvePlatformType is not available for testing');
  }

  it('should resolve platform types correctly', () => {
    expect(resolvePlatformType('')).toBe('desktop');
    expect(resolvePlatformType('   ')).toBe('desktop');
    expect(resolvePlatformType('\r\n\t \n')).toBe('desktop');
    expect(resolvePlatformType('store')).toBe('store');
    expect(resolvePlatformType('   StOrE   ')).toBe('store');
    expect(resolvePlatformType('\nuWp')).toBe('uwp');
    expect(resolvePlatformType('uwp')).toBe('uwp');
    expect(() => resolvePlatformType('invalid')).toThrow('Unsupported platform type: invalid');
  });
});

describe('resolveWindowsSdkVersion', () => {
  const resolveWindowsSdkVersion = _testInternals?.resolveWindowsSdkVersion;
  if (!resolveWindowsSdkVersion) {
    throw new Error('resolveWindowsSdkVersion is not available for testing');
  }

  it('should resolve Windows SDK versions correctly', () => {
    expect(resolveWindowsSdkVersion('')).toBeNull();
    expect(resolveWindowsSdkVersion('   ')).toBeNull();
    expect(resolveWindowsSdkVersion('\r\n\t \n')).toBeNull();
    expect(resolveWindowsSdkVersion('1.2')).toBe('1.2');
    expect(resolveWindowsSdkVersion('\n1234.4567890 ')).toBe('1234.4567890');
    expect(resolveWindowsSdkVersion('1.2.3.4')).toBe('1.2.3.4');
    expect(resolveWindowsSdkVersion('\n\r10.0.19041.0\n')).toBe('10.0.19041.0');
    expect(() => resolveWindowsSdkVersion('1')).toThrow('Invalid Windows SDK version: 1');
    expect(() => resolveWindowsSdkVersion('1.2.3')).toThrow('Invalid Windows SDK version: 1.2.3');
    expect(() => resolveWindowsSdkVersion('1.2.3.4.5')).toThrow('Invalid Windows SDK version: 1.2.3.4.5');
    expect(() => resolveWindowsSdkVersion('1.2.3.4.5.6')).toThrow('Invalid Windows SDK version: 1.2.3.4.5.6');
    expect(() => resolveWindowsSdkVersion('\nInVaLiD ')).toThrow('Invalid Windows SDK version: InVaLiD');
  });
});

describe('resolveToolsetVersion', () => {
  const resolveToolsetVersion = _testInternals?.resolveToolsetVersion;
  if (!resolveToolsetVersion) {
    throw new Error('resolveToolsetVersion is not available for testing');
  }

  it('should resolve toolset versions correctly', () => {
    expect(resolveToolsetVersion('')).toBeNull();
    expect(resolveToolsetVersion('   ')).toBeNull();
    expect(resolveToolsetVersion('\r\n\t \n')).toBeNull();
    expect(resolveToolsetVersion('14')).toBe('14');
    expect(resolveToolsetVersion('\n14.1 ')).toBe('14.1');
    expect(resolveToolsetVersion('14.2.3')).toBe('14.2.3');
    expect(resolveToolsetVersion('\n\r15.0.123\n')).toBe('15.0.123');
    expect(() => resolveToolsetVersion('1.2.3.4')).toThrow('Invalid toolset version: 1.2.3.4');
    expect(() => resolveToolsetVersion('\n1.2.3.4.5 ')).toThrow('Invalid toolset version: 1.2.3.4.5');
  });
});

describe('resolveIfNonWindows', () => {
  const resolveIfNonWindows = _testInternals?.resolveIfNonWindows;
  if (!resolveIfNonWindows) {
    throw new Error('resolveIfNonWindows is not available for testing');
  }

  it('should return the input string on non-Windows platforms', () => {
    expect(resolveIfNonWindows('')).toBe(IfNonWindows.Fail);
    expect(resolveIfNonWindows(' \r\n \t')).toBe(IfNonWindows.Fail);
    expect(resolveIfNonWindows('fail')).toBe(IfNonWindows.Fail);
    expect(resolveIfNonWindows('\n\tfAiL   \n')).toBe(IfNonWindows.Fail);
    expect(resolveIfNonWindows('warn')).toBe(IfNonWindows.Warn);
    expect(resolveIfNonWindows('\n\twArN   \n')).toBe(IfNonWindows.Warn);
    expect(resolveIfNonWindows('ignore')).toBe(IfNonWindows.Ignore);
    expect(resolveIfNonWindows('\n\tiGnOrE   \n')).toBe(IfNonWindows.Ignore);
    expect(() => resolveIfNonWindows(' iNvAlId\n')).toThrow('Invalid value for if-not-windows: iNvAlId');
  });
});

describe('resolveUpdateEnv', () => {
  const resolveUpdateEnv = _testInternals?.resolveUpdateEnv;
  if (!resolveUpdateEnv) {
    throw new Error('resolveUpdateEnv is not available for testing');
  }

  const updateEnvCases: Array<[string, string | boolean | {negated: boolean; upperCaseNames: string[]}]> = [
    ['', true],
    [' \n \t\n', true],
    ['TRUE', true],
    [' \n  TrUe \t ', true],
    [' FaLsE ', false],
    ['Path', {negated: false, upperCaseNames: ['PATH']}],
    ['Path\n', {negated: false, upperCaseNames: ['PATH']}],
    ['Path\nInclude', {negated: false, upperCaseNames: ['PATH', 'INCLUDE']}],
    ['Path\nInclude\n', {negated: false, upperCaseNames: ['PATH', 'INCLUDE']}],
    [' \n Path \n Include \n ', {negated: false, upperCaseNames: ['PATH', 'INCLUDE']}],
    ['A\n!B\nC', {negated: false, upperCaseNames: ['A', 'C']}],
    ['!A\n!B\n!C', {negated: true, upperCaseNames: ['A', 'B', 'C']}],
  ];
  it.each(updateEnvCases)('should resolve updateEnv values correctly for "%s"', (input, expected) => {
    const actual = resolveUpdateEnv(input);
    expect(actual).toEqual(expected);
  });
});

describe('resolveInputs', () => {
  const architecturesMap = [
    ['x64', Architecture.x64],
    ['x86', Architecture.x86],
  ];
  it.each(architecturesMap)('should resolve default inputs (%s)', (osMachine, expectedArchitecture) => {
    jest.spyOn(require('os'), 'machine').mockReturnValue(osMachine);
    const inputs = resolveInputs();
    expect(inputs.vsVersion).toBe('latest');
    expect(inputs.architecture).toBe(expectedArchitecture);
    expect(inputs.platformType).toBe(PlatformType.Desktop);
    expect(inputs.windowsSdkVersion).toBeNull();
    expect(inputs.toolsetVersion).toBeNull();
    expect(inputs.spectreMode).toBe(false);
    expect(inputs.canonicalizePaths).toBe(false);
    expect(inputs.ifNotWindows).toBe(IfNonWindows.Fail);
    expect(inputs.updateEnv).toBe(true);
    expect(inputs.debug).toBe(false);
  });

  it('should resolve custom inputs', () => {
    core.setInput('vs-version', '   2022   ');
    core.setInput('architecture', '   X86   ');
    core.setInput('platform-type', ' Store ');
    core.setInput('windows-sdk-version', ' 10.0.19041.0 ');
    core.setInput('toolset-version', ' 14.2 ');
    core.setInput('spectre-mode', ' true ');
    core.setInput('canonicalize-paths', ' true ');
    core.setInput('if-not-windows', ' warn ');
    core.setInput('update-env', ' false ');
    core.setInput('debug', ' true');
    const inputs = resolveInputs();
    expect(inputs.vsVersion).toEqual({
      maxVersion: '17.999.999.999',
      minVersion: '17.0.0.0',
      version: '17.0',
      year: '2022',
    });
    expect(inputs.architecture).toBe(Architecture.x86);
    expect(inputs.platformType).toBe('store');
    expect(inputs.windowsSdkVersion).toBe('10.0.19041.0');
    expect(inputs.toolsetVersion).toBe('14.2');
    expect(inputs.spectreMode).toBe(true);
    expect(inputs.canonicalizePaths).toBe(true);
    expect(inputs.ifNotWindows).toBe(IfNonWindows.Warn);
    expect(inputs.updateEnv).toBe(false);
    expect(inputs.debug).toBe(true);
  });
});
