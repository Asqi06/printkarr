param([Parameter(Mandatory=$true)][string]$NodePath)
$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $project
$logDirectory = Join-Path $env:LOCALAPPDATA 'PrintKarr\logs'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$log = Join-Path $logDirectory 'agent.log'
# Let an existing manual agent finish; take over when that process exits.
$existing = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match 'agent[\\/]print-agent\.mjs' }
if ($existing) {
    Add-Content -LiteralPath $log -Value ('{0:o} Waiting for the existing manual agent to exit before taking over.' -f (Get-Date)) -Encoding UTF8
    $existing | ForEach-Object { Wait-Process -Id $_.ProcessId -ErrorAction SilentlyContinue }
}
# Keep one 5 MB archive; print documents and credentials are never copied here.
$ErrorActionPreference = 'Continue'
& $NodePath (Join-Path $PSScriptRoot 'print-agent.mjs') 2>&1 | ForEach-Object {
    if ((Test-Path -LiteralPath $log) -and (Get-Item -LiteralPath $log).Length -gt 5MB) {
        Move-Item -LiteralPath $log -Destination ($log + '.1') -Force
    }
    Add-Content -LiteralPath $log -Value ('{0:o} {1}' -f (Get-Date), $_) -Encoding UTF8
}
exit $LASTEXITCODE
