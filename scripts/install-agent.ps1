param([ValidateSet('Install','Status','Uninstall')][string]$Mode = 'Install')
$ErrorActionPreference = 'Stop'
$taskName = 'PrintKarr Print Agent'
$project = Split-Path $PSScriptRoot -Parent
if ($Mode -eq 'Status') {
    Get-ScheduledTask -TaskName $taskName | Select-Object TaskName, State | Format-List
    Get-ScheduledTaskInfo -TaskName $taskName | Select-Object LastRunTime, LastTaskResult, NextRunTime | Format-List
    Write-Output "Log: $env:LOCALAPPDATA\PrintKarr\logs\agent.log"
    exit 0
}
if ($Mode -eq 'Uninstall') {
    # Remove future starts without interrupting a document already being printed.
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Output 'Automatic startup removed. A running agent can finish its current work.'
    exit 0
}
$node = (Get-Command node.exe -ErrorAction Stop).Source
$runner = Join-Path $project 'agent\run-background.ps1'
if ($runner.Contains('"') -or $node.Contains('"')) { throw 'Unsupported quote in installation path.' }
Set-Location -LiteralPath $project
& $node --input-type=module -e "import 'dotenv/config'; if(!process.env.AGENT_TOKEN || process.env.DRY_RUN==='1' || process.env.RUN_ONCE==='1') { console.error('Set AGENT_TOKEN and remove DRY_RUN=1 / RUN_ONCE=1 before installing automatic printing.'); process.exit(1); }"
if ($LASTEXITCODE -ne 0) { throw 'Print agent configuration is incomplete.' }
$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$action = New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$runner`" -NodePath `"$node`"" -WorkingDirectory $project
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'PrintKarr queue worker. Starts at sign-in, runs hidden, restarts after a crash.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Output 'Automatic startup installed. Background task started; it waits for any existing manual agent to exit before taking over.'
Write-Output "Log: $env:LOCALAPPDATA\PrintKarr\logs\agent.log"
