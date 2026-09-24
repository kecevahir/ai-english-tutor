@echo off
REM Windows: commit + push. Do NOT npm install / npm run build on Windows.
setlocal
cd /d "%~dp0\.."

set MSG=%~1
if "%MSG%"=="" set MSG=chore: update

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo Not a git repo. Run setup on Mac first or clone the GitHub repo.
  exit /b 1
)

git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%MSG%"
) else (
  echo No local changes to commit.
)

for /f "delims=" %%b in ('git branch --show-current') do set BRANCH=%%b
git push -u origin %BRANCH%
echo Pushed to origin/%BRANCH%
echo NAS pulls every ~2 min. Then hard-refresh https://dmportal.com.tr/englishtutor/
endlocal
