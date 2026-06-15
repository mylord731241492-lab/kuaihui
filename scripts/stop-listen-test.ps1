$ErrorActionPreference = "SilentlyContinue"
$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$OutDir = Join-Path $Root "test-listens"
$EncodingNoBom = [System.Text.UTF8Encoding]::new($false)

if (Test-Path -LiteralPath $OutDir) {
  Get-ChildItem -LiteralPath $OutDir -File -Filter "listen-*.log" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 |
    ForEach-Object {
      $stopFile = [System.IO.Path]::ChangeExtension($_.FullName, ".stop")
      [System.IO.File]::WriteAllText($stopFile, "stop", $EncodingNoBom)
      Write-Output "stop-file=$stopFile"
    }
}

$PidFile = Join-Path $OutDir "listener.pid"
if (Test-Path -LiteralPath $PidFile) {
  $listenerPid = [System.IO.File]::ReadAllText($PidFile, [System.Text.Encoding]::UTF8).Trim()
  if ($listenerPid) {
    Start-Sleep -Milliseconds 1200
    $proc = Get-Process -Id ([int]$listenerPid) -ErrorAction SilentlyContinue
    if ($proc) {
      Stop-Process -Id ([int]$listenerPid) -Force
      Write-Output "listener-stopped=$listenerPid"
    }
  }
}
