import * as core from '@actions/core';
import checkPlatform from './checkPlatform';
import resolveInputs from './inputsResolver';
import findVisualC from './findVisualC';
import {Architecture, inspectVCVarsAllEnvironmentVariables} from './vcvarsall-enviro-inspector';
import {run} from './main';

// Mock all local dependencies
jest.mock('./checkPlatform');
jest.mock('./findVCVarsAll');
jest.mock('./vcvarsall-enviro-inspector');
jest.mock('./inputsResolver');
jest.mock('./setOutputs');
jest.mock('./findVisualC');
jest.mock('./updateEnv');

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  core.clear();
});

describe('main.ts execution flow', () => {
  it('should complete the full flow on Windows with valid inputs', async () => {
    (resolveInputs as jest.Mock).mockReturnValue({
      vsVersion: 'latest',
      architecture: Architecture.x64,
      platformType: null,
      windowsSdkVersion: null,
      toolsetVersion: null,
      spectreMode: false,
      canonicalizePaths: false,
      ifNotWindows: 'fail',
      updateEnv: true,
      debug: false,
    });
    (checkPlatform as jest.Mock).mockReturnValue(true);
    (findVisualC as jest.Mock).mockResolvedValue({
      vsVersion: {year: '2022', version: '17.0', minVersion: '17.0.0.0', maxVersion: '17.999.999.999'},
      path: 'C:\\VS\\Path',
    });
    (inspectVCVarsAllEnvironmentVariables as jest.Mock).mockResolvedValue(
      new Map([
        ['VCToolsVersion', '14.44.35207'],
        ['WindowsSDKVersion', '10.0.26100.0\\'],
        ['VSCMD_ARG_HOST_ARCH', 'x64'],
        ['VSCMD_ARG_TGT_ARCH', 'x86'],
      ]),
    );
    await run();
    expect(checkPlatform).toHaveBeenCalled();
    expect(findVisualC).toHaveBeenCalledWith('latest');
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.getLoggedMessages()).toContain('INFO: Visual Studio: 2022');
    expect(core.getLoggedMessages()).toContain('INFO: Visual C++ path: C:\\VS\\Path');
    expect(core.getLoggedMessages()).toContain('INFO: Toolset version: 14.44.35207');
    expect(core.getLoggedMessages()).toContain('INFO: Windows SDK version: 10.0.26100.0');
    expect(core.getLoggedMessages()).toContain('INFO: Host architecture: x64');
    expect(core.getLoggedMessages()).toContain('INFO: Target architecture: x86');
  });

  it('should call core.setFailed when an error occurs', async () => {
    (resolveInputs as jest.Mock).mockImplementation(() => {
      throw new Error('Configuration error');
    });
    await run();
    expect(core.getFailed()).toEqual(new Error('Configuration error'));
  });

  it('should stop execution if checkPlatform returns false', async () => {
    (resolveInputs as jest.Mock).mockReturnValue({ifNotWindows: 'ignore'});
    (checkPlatform as jest.Mock).mockReturnValue(false);
    await run();
    expect(findVisualC).not.toHaveBeenCalled();
    expect(core.getFailed()).toBeNull();
  });
});
