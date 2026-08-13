param(
    [switch]$Commit,
    [switch]$Push,
    [string]$Branch = "agent/ref001-figma-raster-assets",
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

function Test-PngStructure([string]$Path) {
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    if ($bytes.Length -lt 20) {
        Fail "PNG is too small: $Path"
    }

    [byte[]]$signature = @(137,80,78,71,13,10,26,10)
    for ($i = 0; $i -lt $signature.Length; $i++) {
        if ($bytes[$i] -ne $signature[$i]) {
            Fail "invalid PNG signature: $Path"
        }
    }

    $iend = $bytes.Length - 12
    if (
        $bytes[$iend] -ne 0 -or $bytes[$iend + 1] -ne 0 -or
        $bytes[$iend + 2] -ne 0 -or $bytes[$iend + 3] -ne 0 -or
        $bytes[$iend + 4] -ne 73 -or $bytes[$iend + 5] -ne 69 -or
        $bytes[$iend + 6] -ne 78 -or $bytes[$iend + 7] -ne 68
    ) {
        Fail "PNG does not end with an IEND chunk: $Path"
    }
}

function Write-GitBlobToFile([string]$BlobSha, [string]$OutputPath) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "git"
    $psi.Arguments = "cat-file blob $BlobSha"
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    [void]$process.Start()

    $stream = [System.IO.File]::Open(
        $OutputPath,
        [System.IO.FileMode]::Create,
        [System.IO.FileAccess]::Write,
        [System.IO.FileShare]::None
    )
    try {
        $process.StandardOutput.BaseStream.CopyTo($stream)
    }
    finally {
        $stream.Dispose()
    }

    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) {
        Fail "git cat-file blob $BlobSha failed: $stderr"
    }
}

function Get-PixelSha256([string]$Path) {
    $source = [System.Drawing.Bitmap]::FromFile($Path)
    try {
        $rect = New-Object System.Drawing.Rectangle(0, 0, $source.Width, $source.Height)
        $bitmap = $source.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $locked = $bitmap.LockBits(
                $rect,
                [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
                [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
            )
            try {
                $length = [Math]::Abs($locked.Stride) * $locked.Height
                $pixels = New-Object byte[] $length
                [System.Runtime.InteropServices.Marshal]::Copy($locked.Scan0, $pixels, 0, $length)
                $sha = [System.Security.Cryptography.SHA256]::Create()
                try {
                    return ([System.BitConverter]::ToString($sha.ComputeHash($pixels))).Replace("-", "").ToLowerInvariant()
                }
                finally {
                    $sha.Dispose()
                }
            }
            finally {
                $bitmap.UnlockBits($locked)
            }
        }
        finally {
            $bitmap.Dispose()
        }
    }
    finally {
        $source.Dispose()
    }
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

    Write-Host "Refreshing backup branch metadata..."
    & git fetch origin $BackupBranch --quiet
    if ($LASTEXITCODE -ne 0) {
        Fail "could not fetch backup branch '$BackupBranch'"
    }
    $backupRef = "origin/$BackupBranch"
    [void](Get-GitOutput @("rev-parse", "--verify", "$backupRef^{commit}"))

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

    # One Figma REST render request returns 32 temporary URLs. The URLs stay
    # in memory only; they are never persisted in Git or in the report.
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

            $tempName = (($slot + "-" + $viewport + "-" + ($nodeId -replace ':', '-')) + ".png")
            $tempPath = Join-Path $stagingRoot $tempName
            $backupTempPath = Join-Path $stagingRoot ("backup-" + $tempName)

            Write-Host "Downloading $slot.$viewport ($nodeId)..."
            Invoke-WebRequest -Uri ([string]$urlProperty.Value) -OutFile $tempPath
            Test-PngStructure $tempPath

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

            $newSha256 = (Get-FileHash -Algorithm SHA256 $tempPath).Hash.ToLowerInvariant()
            $newGitBlob = Get-GitOutput @("hash-object", $tempPath)
            $newBytes = (Get-Item $tempPath).Length

            $backupGitBlob = Get-GitOutput @("rev-parse", "${backupRef}:$repoPath")
            Write-GitBlobToFile $backupGitBlob $backupTempPath
            Test-PngStructure $backupTempPath

            $backupSha256 = (Get-FileHash -Algorithm SHA256 $backupTempPath).Hash.ToLowerInvariant()
            $backupBytes = (Get-Item $backupTempPath).Length

            # Decode both PNGs through the same Windows/System.Drawing path and
            # hash normalized BGRA pixels. This separates harmless PNG
            # compression/metadata differences from actual visual-pixel changes.
            $newPixelSha256 = Get-PixelSha256 $tempPath
            $backupPixelSha256 = Get-PixelSha256 $backupTempPath

            $reportAssets += [ordered]@{
                slot = $slot
                viewport = $viewport
                node_id = $nodeId
                path = $repoPath
                width = $actualWidth
                height = $actualHeight
                new_bytes = $newBytes
                backup_bytes = $backupBytes
                new_sha256 = $newSha256
                backup_sha256 = $backupSha256
                new_git_blob_sha1 = $newGitBlob
                backup_git_blob_sha1 = $backupGitBlob
                exact_byte_match = ($newGitBlob -eq $backupGitBlob)
                new_pixel_sha256 = $newPixelSha256
                backup_pixel_sha256 = $backupPixelSha256
                pixel_exact_match = ($newPixelSha256 -eq $backupPixelSha256)
            }
        }

        # Do not touch canonical site files until every one of the 32 local
        # downloads has passed PNG and dimension validation and has a backup
        # comparison record.
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

    $exactByteCount = @($reportAssets | Where-Object { $_.exact_byte_match }).Count
    $pixelExactCount = @($reportAssets | Where-Object { $_.pixel_exact_match }).Count

    $reportPath = Join-Path $repoRoot "research/figma-assets/ref001/windows-local-export-report.json"
    $report = [ordered]@{
        schema_version = 2
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
        comparison = [ordered]@{
            assets = 32
            exact_byte_matches = $exactByteCount
            exact_byte_differences = 32 - $exactByteCount
            pixel_exact_matches = $pixelExactCount
            pixel_differences = 32 - $pixelExactCount
            rule = "byte mismatch is not a visual failure; pixel mismatch requires visual QA against live Figma"
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
        Write-Warning "python and/or php is unavailable; local complete validator skipped. GitHub CI must pass before merge."
    }

    $changed = Get-GitOutput @("status", "--short")
    Write-Host ""
    Write-Host "Windows local export completed."
    Write-Host "Backup branch: $BackupBranch"
    Write-Host "Working branch: $Branch"
    Write-Host "Exact PNG bytes vs backup: $exactByteCount/32"
    Write-Host "Decoded pixel equality vs backup: $pixelExactCount/32"
    if ($pixelExactCount -lt 32) {
        Write-Warning "$((32 - $pixelExactCount)) asset(s) have decoded-pixel differences and must be visually checked against live Figma before merge."
    }
    if ($changed) {
        Write-Host $changed
    }
    else {
        Write-Host "All exported bytes are identical to the current canonical Git files."
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
