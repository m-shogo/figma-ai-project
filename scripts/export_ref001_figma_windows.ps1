param(
    [switch]$Commit,
    [switch]$Push,
    [string]$Branch = "agent/ref001-windows-local-export",
    [string]$BackupBranch = "backup/ref001-drive-bridge-assets-20260813"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Fail([string]$Message) {
    throw "REF-001 Windows local export: $Message"
}

function Get-GitOutput([string[]]$Args) {
    $output = & git @Args 2>&1
    if ($LASTEXITCODE -ne 0) {
        Fail "git $($Args -join ' ') failed: $output"
    }
    return ($output | Out-String).Trim()
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
Push-Location $repoRoot

try {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Fail "git is required"
    }

    $currentBranch = Get-GitOutput @("branch", "--show-current")
    if ($currentBranch -ne $Branch) {
        Fail "run this from branch '$Branch' (current: '$currentBranch')"
    }

    $dirty = Get-GitOutput @("status", "--porcelain")
    if ($dirty) {
        Fail "working tree must be clean before export"
    }

    if ($Push -and -not $Commit) {
        Fail "-Push requires -Commit"
    }

    if (-not $env:FIGMA_TOKEN) {
        Fail "FIGMA_TOKEN is not set. Use a Figma token with file_content:read scope in the current PowerShell session. Never commit the token."
    }

    $registryPath = Join-Path $repoRoot "research/figma-assets/ref001/rendered-asset-registry.json"
    if (-not (Test-Path $registryPath)) {
        Fail "registry not found: $registryPath"
    }

    $registry = Get-Content -Raw -Encoding UTF8 $registryPath | ConvertFrom-Json
    if ($registry.reference_id -ne "REF-001") {
        Fail "unexpected registry reference_id"
    }
    if ($registry.assets.Count -ne 32) {
        Fail "registry must contain exactly 32 assets; got $($registry.assets.Count)"
    }

    $fileKey = [string]$registry.source.figma_file_key
    $nodeIds = @($registry.assets | ForEach-Object { [string]$_.node_id })
    if (($nodeIds | Select-Object -Unique).Count -ne 32) {
        Fail "registry node IDs must be unique across the 32 assets"
    }

    # One Figma render request for all 32 nodes. The returned URLs are used only
    # in memory and are never written to Git or the report.
    $idsQuery = [Uri]::EscapeDataString(($nodeIds -join ","))
    $renderEndpoint = "https://api.figma.com/v1/images/$fileKey?ids=$idsQuery&format=png&scale=1"
    $headers = @{ "X-Figma-Token" = $env:FIGMA_TOKEN }

    Write-Host "Requesting 32 Figma 1x PNG renders..."
    $renderResponse = Invoke-RestMethod -Method Get -Uri $renderEndpoint -Headers $headers
    if (-not $renderResponse.images) {
        Fail "Figma response did not include an images map"
    }

    Add-Type -AssemblyName System.Drawing

    $stagingRoot = Join-Path $env:TEMP ("figma-ai-project-ref001-" + [Guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $stagingRoot | Out-Null

    $reportAssets = @()
    $allValidated = $false

    try {
        foreach ($asset in $registry.assets) {
            $slot = [string]$asset.slot
            $viewport = [string]$asset.viewport
            $nodeId = [string]$asset.node_id
            $repoPath = [string]$asset.path
            $expectedWidth = [int]$asset.width
            $expectedHeight = [int]$asset.height

            $urlProperty = $renderResponse.images.PSObject.Properties[$nodeId]
            if (-not $urlProperty -or -not $urlProperty.Value) {
                Fail "Figma did not render $slot.$viewport ($nodeId)"
            }

            $targetPath = Join-Path $repoRoot ($repoPath -replace '/', [IO.Path]::DirectorySeparatorChar)
            $tempName = (($slot + "-" + $viewport + "-" + ($nodeId -replace ':', '-')) + ".png")
            $tempPath = Join-Path $stagingRoot $tempName

            Write-Host "Downloading $slot.$viewport ($nodeId)..."
            Invoke-WebRequest -Uri ([string]$urlProperty.Value) -OutFile $tempPath

            $image = [System.Drawing.Image]::FromFile($tempPath)
            try {
                $actualWidth = [int]$image.Width
                $actualHeight = [int]$image.Height
            }
            finally {
                $image.Dispose()
            }

            if ($actualWidth -ne $expectedWidth -or $actualHeight -ne $expectedHeight) {
                Fail "$slot.$viewport dimensions mismatch: ${actualWidth}x${actualHeight} != ${expectedWidth}x${expectedHeight}"
            }

            $newHash = (Get-FileHash -Algorithm SHA256 $tempPath).Hash.ToLowerInvariant()
            $oldHash = $null
            if (Test-Path $targetPath) {
                $oldHash = (Get-FileHash -Algorithm SHA256 $targetPath).Hash.ToLowerInvariant()
            }

            $reportAssets += [ordered]@{
                slot = $slot
                viewport = $viewport
                node_id = $nodeId
                path = $repoPath
                width = $actualWidth
                height = $actualHeight
                old_sha256 = $oldHash
                new_sha256 = $newHash
                identical_to_backup_bytes = ($oldHash -and $oldHash -eq $newHash)
            }
        }

        # Only replace canonical files after all 32 downloads and dimension checks pass.
        foreach ($asset in $registry.assets) {
            $slot = [string]$asset.slot
            $viewport = [string]$asset.viewport
            $nodeId = [string]$asset.node_id
            $repoPath = [string]$asset.path
            $tempName = (($slot + "-" + $viewport + "-" + ($nodeId -replace ':', '-')) + ".png")
            $tempPath = Join-Path $stagingRoot $tempName
            $targetPath = Join-Path $repoRoot ($repoPath -replace '/', [IO.Path]::DirectorySeparatorChar)
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $targetPath) | Out-Null
            Copy-Item -Force $tempPath $targetPath
        }

        $allValidated = $true
    }
    finally {
        if (-not $allValidated) {
            Write-Warning "Validation failed before canonical replacement completed. Check the working tree before retrying."
        }
        Remove-Item -Recurse -Force $stagingRoot -ErrorAction SilentlyContinue
    }

    $reportPath = Join-Path $repoRoot "research/figma-assets/ref001/windows-local-export-report.json"
    $report = [ordered]@{
        schema_version = 1
        reference_id = "REF-001"
        exported_at_utc = [DateTime]::UtcNow.ToString("o")
        source = [ordered]@{
            figma_file_key = $fileKey
            method = "FIGMA_REST_GET_IMAGES_TO_WINDOWS_LOCAL"
            format = "png"
            scale = 1
        }
        transport = [ordered]@{
            drive_desktop_used = $false
            google_drive_used = $false
            git_working_branch = $Branch
            backup_branch = $BackupBranch
        }
        assets = $reportAssets
    }
    $report | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $reportPath

    $python = Get-Command python -ErrorAction SilentlyContinue
    $php = Get-Command php -ErrorAction SilentlyContinue
    if ($python -and $php) {
        Write-Host "Running REF-001 complete validator..."
        & python "scripts/validate_ref001_asset_map.py" "--require-complete"
        if ($LASTEXITCODE -ne 0) {
            Fail "validate_ref001_asset_map.py --require-complete failed"
        }
    }
    else {
        Write-Warning "python and/or php is unavailable; local complete validator skipped. GitHub CI must run before merge."
    }

    $changed = Get-GitOutput @("status", "--short")
    Write-Host ""
    Write-Host "Windows local export completed."
    Write-Host "Backup branch: $BackupBranch"
    Write-Host "Working branch: $Branch"
    if ($changed) {
        Write-Host $changed
    }
    else {
        Write-Host "All exported bytes are identical to the current canonical Git files; only the report may be unchanged."
    }

    if ($Commit) {
        & git add -- "implementation/theme/assets/images/ref001/rendered" "research/figma-assets/ref001/windows-local-export-report.json"
        if ($LASTEXITCODE -ne 0) { Fail "git add failed" }

        & git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            Write-Host "No staged byte changes; nothing to commit."
        }
        elseif ($LASTEXITCODE -eq 1) {
            & git commit -m "assets: refresh REF-001 from Windows local Figma export"
            if ($LASTEXITCODE -ne 0) { Fail "git commit failed" }
        }
        else {
            Fail "git diff --cached failed"
        }
    }

    if ($Push) {
        & git push origin "HEAD:$Branch"
        if ($LASTEXITCODE -ne 0) { Fail "git push failed" }
    }
}
finally {
    Pop-Location
}
