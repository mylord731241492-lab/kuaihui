$ErrorActionPreference = 'Stop'
$trialRoot = $PSScriptRoot
$trialNode = (Get-Command node).Source
try {
  $trialHealth = Invoke-RestMethod -Uri 'http://127.0.0.1:47831/health' -TimeoutSec 2 -NoProxy
  if ($trialHealth.service -ne 'juhe-local-auth') { throw 'Port occupied by another service' }
} catch {
  Start-Process -FilePath $trialNode -ArgumentList 'server.mjs' -WorkingDirectory $trialRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $trialRoot 'server.log') -RedirectStandardError (Join-Path $trialRoot 'server-error.log')
  $trialReady = $false
  for ($trialAttempt = 0; $trialAttempt -lt 20; $trialAttempt++) {
    Start-Sleep -Milliseconds 250
    try { $trialHealth = Invoke-RestMethod -Uri 'http://127.0.0.1:47831/health' -TimeoutSec 1 -NoProxy; if ($trialHealth.service -eq 'juhe-local-auth') { $trialReady = $true; break } } catch {}
  }
  if (-not $trialReady) { throw 'Local account server failed to start; see server-error.log' }
}
$trialElectron = Join-Path $trialRoot '../release-auth/win-unpacked/聚禾账号试运行.exe'
$trialOldElectronMode = $env:ELECTRON_RUN_AS_NODE
$trialOldDataDir = $env:JUHE_TRIAL_DATA_DIR
try {
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
  $env:JUHE_TRIAL_DATA_DIR = Join-Path $trialRoot 'data'
  Start-Process -FilePath $trialElectron -WorkingDirectory $trialRoot -WindowStyle Normal
} finally {
  if ($null -ne $trialOldElectronMode) { $env:ELECTRON_RUN_AS_NODE = $trialOldElectronMode }
  if ($null -ne $trialOldDataDir) { $env:JUHE_TRIAL_DATA_DIR = $trialOldDataDir } else { Remove-Item Env:JUHE_TRIAL_DATA_DIR -ErrorAction SilentlyContinue }
}
