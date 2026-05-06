@echo off
setlocal enabledelayedexpansion

rem Initialize VS BuildTools environment (link.exe, MSVC libs, Windows SDK)
set "PATH=C:\Program Files (x86)\Microsoft Visual Studio\Installer;%PATH%"
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul
if errorlevel 1 (
  echo Failed to initialize VS environment
  exit /b 1
)

rem Prepend cargo + perl to PATH (delayed expansion picks up vcvars changes)
set "PATH=%USERPROFILE%\.cargo\bin;C:\Strawberry\perl\bin;C:\Strawberry\c\bin;!PATH!"

rem Forward to whatever was passed
%*
