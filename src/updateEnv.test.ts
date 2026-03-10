import * as core from '@actions/core';
import updateEnv from './updateEnv';
import {CaseInsensitiveStringMap} from './CaseInsensitiveMap';

const originalEnv = {...process.env};

beforeEach(() => {
  jest.clearAllMocks();
  core.clear();
});

afterEach(() => {
  process.env = {...originalEnv};
});

const originalPath = 'C:\\Windows\\System32';
const sampleVars = new CaseInsensitiveStringMap([
  ['Path', 'C:\\bin'],
  ['INCLUDE', 'C:\\include'],
  ['A', 'Avalue'],
  ['B', 'Bvalue'],
  ['C', 'Cvalue'],
]);
const exportedPath = sampleVars.get('Path') + ';' + originalPath;

describe('updateEnv', () => {
  it('should call core.exportVariable for all variables', () => {
    process.env.PATH = originalPath;
    updateEnv(sampleVars);
    const exportedVariables = core.getExportedVariables();
    expect(exportedVariables).toEqual({
      Path: exportedPath,
      INCLUDE: 'C:\\include',
      A: 'Avalue',
      B: 'Bvalue',
      C: 'Cvalue',
    });
  });
  it('should filter variables when filter is a list', () => {
    process.env.PATH = originalPath;
    updateEnv(sampleVars, {negated: false, upperCaseNames: ['INCLUDE', 'B']});
    const exportedVariables = core.getExportedVariables();
    expect(exportedVariables).toEqual({
      INCLUDE: 'C:\\include',
      B: 'Bvalue',
    });
  });
  it('should filter variables when filter is a negated list', () => {
    process.env.PATH = originalPath;
    updateEnv(sampleVars, {negated: true, upperCaseNames: ['INCLUDE', 'B']});
    const exportedVariables = core.getExportedVariables();
    expect(exportedVariables).toEqual({
      Path: exportedPath,
      A: 'Avalue',
      C: 'Cvalue',
    });
  });
});
