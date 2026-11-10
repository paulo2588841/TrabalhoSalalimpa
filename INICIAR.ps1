$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if ($npmCommand) {
  & $npmCommand.Source run dev
} elseif (Test-Path -LiteralPath (Join-Path $PSScriptRoot '.tools/package/bin/npm-cli.js')) {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  $nodeBinary = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' }
  if (-not (Test-Path -LiteralPath $nodeBinary)) { throw 'Instale Node.js 22.12+ com npm e rode npm install.' }
  $env:PATH = (Split-Path -Parent $nodeBinary) + [IO.Path]::PathSeparator + $env:PATH
  & $nodeBinary (Join-Path $PSScriptRoot '.tools/package/bin/npm-cli.js') run dev
} else {
  throw 'Instale Node.js 22.12+ com npm, rode npm install e depois npm run dev.'
}
