param(
  [switch]$LaunchApp,
  [int]$MaxSeconds = 0
)

$ErrorActionPreference = "SilentlyContinue"
$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = [System.IO.Directory]::GetParent($ScriptDir).FullName
$AppName = "$([char]0x5FEB)$([char]0x56DE)"
$AppExe = Join-Path $Root "$AppName.exe"
$AppDataDir = Join-Path $env:APPDATA $AppName
$LogsDir = Join-Path $AppDataDir "logs"
$OutDir = Join-Path $Root "test-listens"
[System.IO.Directory]::CreateDirectory($OutDir) | Out-Null

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$SessionLog = Join-Path $OutDir "listen-$Stamp.log"
$StopFile = Join-Path $OutDir "listen-$Stamp.stop"
$PidFile = Join-Path $OutDir "listener.pid"
$EncodingNoBom = [System.Text.UTF8Encoding]::new($false)

function Add-ListenLine {
  param([string]$Text)
  $line = "$(Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff") $Text`r`n"
  [System.IO.File]::AppendAllText($SessionLog, $line, $EncodingNoBom)
}

function Read-NewText {
  param(
    [string]$Path,
    [long]$Offset
  )
  $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
  try {
    $stream.Seek($Offset, [System.IO.SeekOrigin]::Begin) | Out-Null
    $length = [int]($stream.Length - $stream.Position)
    if ($length -le 0) { return "" }
    $buffer = New-Object byte[] $length
    $read = $stream.Read($buffer, 0, $length)
    return [System.Text.Encoding]::UTF8.GetString($buffer, 0, $read)
  } finally {
    $stream.Dispose()
  }
}

[System.IO.File]::WriteAllText($PidFile, "$PID", $EncodingNoBom)
Add-ListenLine "[listen-start] root=$Root"
Add-ListenLine "[listen-start] logs=$LogsDir"
Add-ListenLine "[listen-start] session=$SessionLog"
Write-Host "listenerPid=$PID"
Write-Host "listenLog=$SessionLog"

if ($LaunchApp -and (Test-Path -LiteralPath $AppExe)) {
  $app = Start-Process -FilePath $AppExe -PassThru
  Add-ListenLine "[app-start] pid=$($app.Id), exe=$AppExe"
}

$positions = @{}
$lastProcessState = ""
$StartedAt = Get-Date

while (-not (Test-Path -LiteralPath $StopFile)) {
  if ($MaxSeconds -gt 0 -and ((Get-Date) - $StartedAt).TotalSeconds -ge $MaxSeconds) {
    break
  }

  if (Test-Path -LiteralPath $LogsDir) {
    Get-ChildItem -LiteralPath $LogsDir -File -Filter "*.log" | ForEach-Object {
      $file = $_
      if (-not $positions.ContainsKey($file.FullName)) {
        $positions[$file.FullName] = $file.Length
        Add-ListenLine "[watch-file] $($file.Name), size=$($file.Length)"
      } else {
        $offset = [long]$positions[$file.FullName]
        if ($file.Length -lt $offset) {
          $offset = 0
        }
        if ($file.Length -gt $offset) {
          $text = Read-NewText -Path $file.FullName -Offset $offset
          $positions[$file.FullName] = $file.Length
          $text -split "`r?`n" | Where-Object { $_ -ne "" } | ForEach-Object {
            $level = if ($_ -match "error|fail|exception|崩溃|失败|网络异常|timeout|denied|拒绝") { "WARN" } else { "LOG" }
            Add-ListenLine "[$level][$($file.Name)] $_"
          }
        }
      }
    }
  } else {
    Add-ListenLine "[WARN] logs directory missing: $LogsDir"
  }

  $processes = Get-Process | Where-Object { $_.ProcessName -eq $AppName } | Select-Object -ExpandProperty Id
  $state = ($processes -join ",")
  if ($state -ne $lastProcessState) {
    $lastProcessState = $state
    Add-ListenLine "[process] $AppName pid=$state"
  }

  Start-Sleep -Milliseconds 800
}

Add-ListenLine "[listen-stop] stop-file=$StopFile"
