[![Continuous Integration for dev](https://img.shields.io/github/actions/workflow/status/mlocati/setup-msvc/ci.yml?label=dev)](https://github.com/mlocati/setup-msvc/actions/workflows/ci.yml)
[![Continuous Integration for v1](https://img.shields.io/github/actions/workflow/status/mlocati/setup-msvc/ci.yml?label=v1&branch=v1)](https://github.com/mlocati/setup-msvc/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/mlocati/setup-msvc/badge.svg)](https://coveralls.io/github/mlocati/setup-msvc)

# Setup MSVC GitHub Action

This GitHub Action configures a complete **Microsoft Visual C++ (MSVC)** development environment on Windows by invoking `vcvarsall.bat`.
It automatically detects installed Visual Studio instances, selects the correct toolset, Windows SDK, and architecture, and exposes all environment variables required to build C and C++ projects with MSVC.

## Examples

### Minimal

```yml
steps:
  - name: Setup MSVC
    uses: mlocati/setup-msvc@v1
```

### Full

```yml
steps:
  - name: Setup MSVC
    uses: mlocati/setup-msvc@v1
    id: msvc
    with:
      vs-version: latest
      architecture: x64
      platform-type: store
      windows-sdk-version: 10.0.26100.0
      toolset-version: '14.44'
      spectre-mode: true
      canonicalize-paths: true
      if-not-windows: fail
      update-env: |
        !Path
      debug: true
  - name: Dump value of INCLUDE detected by by the setup-msvc action
    run: echo "${{ steps.msvc.outputs.include }}$"
```

## Features

- Automatic detection of installed Visual Studio versions
- Support for all MSVC architectures: `x86`, `x64`, `x86_x64`, `x86_arm`, `x86_arm64`, `x64_x86`, `x64_arm`, `x64_arm64`
- Optional selection of:
  - Windows SDK version
  - MSVC toolset version
  - Spectre mitigation mode
  - Platform type (desktop, Store, UWP)
- Outputs all environment variables set by `vcvarsall.bat`
- Updates the environment for all subsequent workflow steps (by default, but it can be disabled)
- Includes a debug mode for troubleshooting
- Fully tested

## Inputs

### `vs-version`

Specify the Visual Studio version.

Allowed values (case insensitive):

- `latest` (default)  
  Aliases: `last`, empty string
-  `2026`  
  Aliases: `18`, `18.…`
-  `2022`  
  Aliases: `17`, `17.…`
-  `2019`  
  Aliases: `16`, `16.…`
-  `2017`  
  Aliases: `15`, `15.…`
-  `2015`  
  Aliases: `14`, `14.…`
-  `2013`  
  Aliases: `12`, `12.…`
-  `2012`  
  Aliases: `11`, `11.…`
-  `2010`  
  Aliases: `10`, `10.…`
-  `2008`  
  Aliases: `9`, `9.…`
-  `2005`  
  Aliases: `8`, `8.…`

### `architecture`

Architecture for the MSVC tools.

Allowed values (case insensitive):

- `x86` (default in case of 32-bit OS)  
  Aliases: `32`, `i386`, `i686`, `ia32`, `win32`  
  Host: x86 or x64  
  Target: x86  
- `x64` (default in case of 64-bit OS)  
  Aliases: `64`, `amd64`, `win64`, `x86_64`, `x86-64`  
  Host: x64  
  Target: x64
- `x86_x64`  
  Aliases: `x86_amd64`, `x86-amd64`, `x86-x64`  
  Host: x86 or x64  
  Target: x64
- `x86_arm`  
  Aliases: `x86-arm`, `x86_arm32`, `x86-arm32`  
  Host: x86 or x64  
  Target: ARM
- `x86_arm64`  
  Aliases: `x86-arm64`  
  Host: x86 or x64  
  Target: ARM64
- `x64_x86`  
  Aliases: `amd64_x86`, `amd64-x86`, `x64-x86`  
  Host: x64  
  Target: x86
- `x64_arm`  
  Aliases: `amd64_arm`, `amd64-arm`, `x64-arm`, `amd64_arm32`, `amd64-arm32`, `x64_arm32`, `x64-arm32`  
  Host: x64  
  Target: ARM
- `x64_arm64`  
  Aliases: `amd64_arm64`, `amd64-arm64`, `x64_arm64`, `x64-arm64`, `arm64`  
  Host: x64  
  Target: ARM64

### `platform-type`

Configure the target application model.

Allowed values (case insensitive):

- `desktop` (default)  
  For building desktop / console applications
- `uwp`  
  For building Universal Windows Platform applications (Microsoft Store apps, ...)
- `store`  
  Legacy alias of `uwp`

### `windows-sdk-version`

Version of the Windows SDK.

The full version of the Windows SDK (eg `10.0.26100.0`).
Use `8.1` to use the Windows 8.1 SDK.

Default value: use the most recent installed version.

### `toolset-version`

Version of the Visual C++ compiler toolset.

It can be a major version (eg `14`), a major.minor version (eg `14.44`) or major.minor.patch version (eg `14.44.35207`).

Default value: use the most recent installed version.

### `spectre-mode`

Whether spectre mode should be enabled.

Allowed values:

- `false` (default)  
  for libraries without spectre mitigations
- `true`  
  for libraries with spectre mitigations

### `canonicalize-paths`

Use this input to standardize the paths in the environment variables set by Visual Studio.

Allowed values:

- `false` (default)  
  Don't touch the environment variables
- `true`  
  Standardize existing paths.  
  For example, this may change the value of `VCINSTALLDIR` from  
  `C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\`  
  to  
  `C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC`

### `if-not-windows`

This action only works on Windows runners.  
With this option, you can control what to do when the runner is not Windows.

Allowed values (case insensitive):

- `fail` (default)  
  The action will fail
- `warn`  
  The action will raise a warning, without failing
- `ignore`  
  The action won't do anything

### `update-env`

Use this option to control whether environment variables should be set for subsequent workflow steps.

Allowed values:

- `true` (default)  
  The environment variables configured by Visual Studio (eg `Path`, `INCLUDE`, `LIB`, ...) will be available in subsequent workflow steps
- `false`  
  No environment variable will be set
- newline-separated list of variable names to only update a subset of them (case insensitive)  
  Prepend `!` to a variable name to exclude it from updating.  
  Examples:
  - Set all environment variables except `Path` and `LIB`
    ```yml
    update-env: |
      !Path
      !LIB
    ```
  - Set only the `Path` and `LIB` environment variables
    ```yml
    update-env: |
      Path
      LIB
    ```


### `debug`

Use this option to control whether you want to see debug details.

Allowed values:

- `false` (default)  
  No debug message will be printed
- `true`  
  Debug messages will be sent to the workflow

## Outputs

### `vcvarsall-path`

The path of the detected `vcvarsall.bat` file Visual Studio.

Example:  
`C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat`

### `path`

The directories **added** by Visual Studio to the `Path` environment variables.

Example:  
`C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.44.35207\bin\HostX64\x64;C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\IDE\VC\VCPackages;…`

### `include`

The value of the `INCLUDE` environment variable set by Visual Studio.

Example:  
`C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.44.35207\include;C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.44.35207\ATLMFC\include;…`

### `lib`

The value of the `LIB` environment variable set by Visual Studio.

Example:  
`C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.44.35207\ATLMFC\lib\x64;C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.44.35207\lib\x64;…`

### `libpath`

The value of the `LIBPATH` environment variable set by Visual Studio.

Example:  
`C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.44.35207\ATLMFC\lib\x64;C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.44.35207\lib\x64;…`

### `vc-installdir`

The value of the `VCINSTALLDIR` environment variable set by Visual Studio.

Example:  
`C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\`

### `vs-installdir`

The value of the `VSINSTALLDIR` environment variable set by Visual Studio.

Example:  
`C:\Program Files\Microsoft Visual Studio\2022\Enterprise\`

### `vs-version`

The value of the `VisualStudioVersion` environment variable set by Visual Studio.

Example:  
`17.0`

### `vctools-installdir`

The value of the `VCTOOLSINSTALLDIR` environment variable set by Visual Studio.

Example:  
`C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\MSVC\14.44.35207\`

### `vctools-version`

The value of the `VCTOOLSVERSION` environment variable set by Visual Studio.

Example:  
`14.44.35207`

### `windows-sdk-dir`

The value of the `WindowsSdkDir` environment variable set by Visual Studio.

Example:  
`C:\Program Files (x86)\Windows Kits\10\`

### `windows-sdk-version`

The value of the `WindowsSDKVersion` environment variable set by Visual Studio.

Example:  
`10.0.26100.0\`

### `windows-sdk-lib-version`

The value of the `WindowsSDKLibVersion` environment variable set by Visual Studio.

Example:  
`10.0.26100.0\`

### `ucrt-version`

The value of the `UCRTVersion` environment variable set by Visual Studio.

Example:  
`10.0.26100.0`

### `platform`

The value of the `Platform` environment variable set by Visual Studio.

Example:  
`x64`

### `vcmd-arg-host-arch`

The value of the `VSCMD_ARG_HOST_ARCH` environment variable set by Visual Studio.

Example:  
`x64`

### `vcmd-arg-tgt-arch`

The value of the `VSCMD_ARG_TGT_ARCH` environment variable set by Visual Studio.

Example:  
`x64`

### `all`

All the environment variables configured by Visual Studio, in JSON format.
Please remark that `Path` will only include the directories **added** by Visual Studio.

Example:  
```json
{
  "Path": "C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\VC\\Tools\\MSVC\\14.44.35207\\bin\\HostX64\\x64;C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\Common7\\IDE\\VC\\VCPackages;…"
  "CommandPromptType": "Native",
  "DevEnvDir": "C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\Common7\\IDE\\",
  "Framework40Version": "v4.0",
  ...
}
```
