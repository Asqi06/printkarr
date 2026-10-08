param(
    [Parameter(Mandatory=$true)][string]$Printer,
    [Parameter(Mandatory=$true)][string]$Sumatra,
    [Parameter(Mandatory=$true)][string]$File,
    [Parameter(Mandatory=$true)][string]$Settings,
    [Parameter(Mandatory=$true)][string]$AppData,
    [int]$TimeoutSeconds = 1800,
    [string]$CancellationFile = ""
)
$ErrorActionPreference = 'Stop'
$process = $null
$owned = @{}
try {
    foreach ($value in @($Printer, $Sumatra, $File, $Settings, $AppData)) {
        if ($value.Contains('"') -or $value.Contains("`n") -or $value.Contains("`r")) { throw 'Invalid print argument.' }
    }
    function Check-Printer {
        $device = Get-Printer -Name $Printer
        # Windows PRINTER_STATUS flags; busy/printing are allowed.
        if (([int]$device.PrinterStatus -band 0x005418DB) -ne 0) { throw "Printer requires attention: $($device.PrinterStatus)" }
    }
    if($CancellationFile -and (Test-Path -LiteralPath $CancellationFile)){throw 'Print stopped from admin.'}
    Check-Printer
    $pending={ ([int]$_.JobStatus -band 0x1080) -eq 0 -and (([int]$_.JobStatus -band 0x2000) -eq 0 -or ([int]$_.JobStatus -band 0x4018) -ne 0) }
    if (@(Get-PrintJob -PrinterName $Printer | Where-Object $pending).Count) { throw 'Printer queue is busy; clear or finish existing work before retrying.' }
    $arguments = '-appdata "{0}" -print-to "{1}" -print-settings "{2}" -silent "{3}"' -f $AppData, $Printer, $Settings, $File
    $process = Start-Process -FilePath $Sumatra -ArgumentList $arguments -WindowStyle Hidden -PassThru
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $emptySince = $null
    do {
        if($CancellationFile -and (Test-Path -LiteralPath $CancellationFile)){throw 'Print stopped from admin; inspect partial output before retrying.'}
        Check-Printer
        $jobs = @(Get-PrintJob -PrinterName $Printer)
        foreach ($job in $jobs) {
            # Sumatra 3.6 uses the full file path as the spool document name.
            if ($job.DocumentName -eq $File -or $job.DocumentName -eq (Split-Path $File -Leaf)) { $owned[$job.ID] = $true }
            if ($owned.ContainsKey($job.ID) -and (([int]$job.JobStatus -band 0x767) -ne 0)) {
                throw "Print job $($job.ID) requires attention: $($job.JobStatus)"
            }
        }
        $process.Refresh()
        if ($process.HasExited) { $process.WaitForExit() }
        if ($process.HasExited -and $process.ExitCode -ne 0) { throw "Sumatra exited with code $($process.ExitCode)." }
        if ($process.HasExited -and !@($jobs | Where-Object $pending).Count) {
            if (!$emptySince) { $emptySince = Get-Date }
            if (((Get-Date) - $emptySince).TotalSeconds -ge 3) { break }
        } else { $emptySince = $null }
        if ((Get-Date) -gt $deadline) { throw 'Print monitoring timed out; inspect output before retrying.' }
        Start-Sleep -Milliseconds 250
    } while ($true)
    if(!$owned.Count){throw 'No matching spool job was observed; inspect output before retrying.'}
    # ponytail: queue drain cannot prove ink reached every sheet; operator verifies output.
    @{ queueDrained = $true; observedJobs = $owned.Count } | ConvertTo-Json -Compress
} catch {
    if ($process -and !$process.HasExited) { Stop-Process -Id $process.Id -ErrorAction SilentlyContinue }
    # Cancel only this invocation's remaining jobs; never reset the shared spooler.
    Get-PrintJob -PrinterName $Printer -ErrorAction SilentlyContinue | Where-Object { $_.DocumentName -eq $File -or $_.DocumentName -eq (Split-Path $File -Leaf) } | ForEach-Object { $owned[$_.ID] = $true }
    foreach ($jobId in $owned.Keys) { Remove-PrintJob -PrinterName $Printer -ID $jobId -ErrorAction SilentlyContinue }
    Write-Error $_ -ErrorAction Continue
    exit 1
}
