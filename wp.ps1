<#
.SYNOPSIS
  Local WordPress per project: .\wp.ps1 <command> [project] [arg]

.EXAMPLE
  .\wp.ps1 list
  .\wp.ps1 up nipponbudokan
  .\wp.ps1 status nipponbudokan
  .\wp.ps1 snapshot nipponbudokan
  .\wp.ps1 restore nipponbudokan 20261120-153000
  .\wp.ps1 down nipponbudokan
  .\wp.ps1 new <slug>
#>
param(
    [Parameter(Position = 0)][ValidateSet('list', 'up', 'down', 'status', 'snapshot', 'restore', 'new')][string]$Command = 'list',
    [Parameter(Position = 1)][string]$Project,
    [Parameter(Position = 2)][string]$Arg
)

$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot
$Runtime = Join-Path $RepoRoot 'runtime/wordpress'
$Projects = Join-Path $RepoRoot 'projects'
$Compose = Join-Path $Runtime 'compose.yml'

function Read-KeyValueFile([string]$Path) {
    $values = [ordered]@{}
    if (-not (Test-Path $Path)) { return $values }
    foreach ($line in [IO.File]::ReadAllLines($Path)) {
        $line = $line.Trim()
        if ($line -eq '' -or $line.StartsWith('#') -or -not $line.Contains('=')) { continue }
        $key, $value = $line.Split('=', 2)
        $values[$key.Trim()] = $value.Trim().Trim('"').Trim("'")
    }
    return $values
}

function Get-ProjectSlugs {
    Get-ChildItem $Projects -Directory | Where-Object { $_.Name -notlike '_*' -and (Test-Path (Join-Path $_.FullName 'runtime.env')) } | ForEach-Object Name
}

function Use-Project([string]$Slug) {
    if (-not $Slug) { throw "project slug required. Known: $((Get-ProjectSlugs) -join ', ')" }
    $dir = Join-Path $Projects $Slug
    if (-not (Test-Path (Join-Path $dir 'runtime.env'))) { throw "projects/$Slug/runtime.env not found" }

    $env:PROJECT = $Slug
    $env:PROJECT_DIR = $dir
    # runtime/.env holds secrets (license keys); runtime.env holds project identity and wins for identity keys.
    foreach ($pair in (Read-KeyValueFile (Join-Path $Runtime '.env')).GetEnumerator()) {
        if ($pair.Value -ne '') { Set-Item "env:$($pair.Key)" $pair.Value }
    }
    foreach ($pair in (Read-KeyValueFile (Join-Path $dir 'runtime.env')).GetEnumerator()) {
        if (-not $savedEnv.ContainsKey($pair.Key)) {
            $savedEnv[$pair.Key] = [Environment]::GetEnvironmentVariable($pair.Key, 'Process')
        }
        Set-Item "env:$($pair.Key)" $pair.Value
    }
    if (-not $env:THEME_SLUG) { $env:THEME_SLUG = $Slug }
    $env:THEME_SOURCE_DIR = Join-Path $dir 'theme'
    $env:WP_URL = "http://127.0.0.1:$($env:WP_PORT)"
    return $dir
}

function Invoke-Compose {
    & docker compose -f $Compose @args
    if ($LASTEXITCODE -ne 0) { throw "docker compose $($args -join ' ') failed ($LASTEXITCODE)" }
}

function Wait-Database {
    for ($i = 0; $i -lt 60; $i++) {
        & docker compose -f $Compose exec -T db healthcheck.sh --connect --innodb_initialized 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { return }
        Start-Sleep -Seconds 2
    }
    throw 'database did not become healthy'
}

# Restore the caller's environment on exit: a leaked COMPOSE_PROJECT_NAME would let a later
# `docker compose down -v` in the same shell delete this project's database.
$savedEnv = @{}
foreach ($name in 'PROJECT', 'PROJECT_DIR', 'COMPOSE_PROJECT_NAME', 'WP_PORT', 'WP_URL', 'THEME_SLUG', 'THEME_SOURCE_DIR') {
    $savedEnv[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}
$envFileKeys = @((Read-KeyValueFile (Join-Path $Runtime '.env')).Keys)
foreach ($name in $envFileKeys) { $savedEnv[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }

if (-not (& git -C $RepoRoot config --get core.hooksPath)) {
    & git -C $RepoRoot config core.hooksPath .githooks
}

try {
switch ($Command) {
    'list' {
        foreach ($slug in Get-ProjectSlugs) {
            $cfg = Read-KeyValueFile (Join-Path $Projects "$slug/runtime.env")
            '{0,-20} http://127.0.0.1:{1}  ({2})' -f $slug, $cfg.WP_PORT, $cfg.COMPOSE_PROJECT_NAME
        }
    }
    'up' {
        $null = Use-Project $Project
        & docker info *> $null
        if ($LASTEXITCODE -ne 0) { throw 'Docker is not running. Start Docker Desktop first.' }
        Invoke-Compose up -d db wordpress
        "PASS $Project -> $($env:WP_URL)  (compose: $($env:COMPOSE_PROJECT_NAME), theme: $($env:THEME_SOURCE_DIR))"
    }
    'down' {
        $null = Use-Project $Project
        # Stop only. Volumes (DB / uploads) are kept; use snapshot before anything destructive.
        Invoke-Compose stop
    }
    'status' {
        $null = Use-Project $Project
        "URL:     $($env:WP_URL)"
        "Compose: $($env:COMPOSE_PROJECT_NAME)"
        "Theme:   $($env:THEME_SOURCE_DIR)"
        Invoke-Compose ps
    }
    'snapshot' {
        $dir = Use-Project $Project
        $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        $out = Join-Path $dir ".local/snapshots/$stamp"
        New-Item -ItemType Directory -Force $out | Out-Null
        Wait-Database
        $pw = if ($env:WP_DB_ROOT_PASSWORD) { $env:WP_DB_ROOT_PASSWORD } else { 'wordpress-fixture-root' }
        $db = if ($env:WP_DB_NAME) { $env:WP_DB_NAME } else { 'wordpress' }
        Invoke-Compose exec -T db sh -c "mariadb-dump -uroot -p'$pw' --single-transaction --default-character-set=utf8mb4 '$db' > /tmp/snapshot.sql"
        Invoke-Compose cp db:/tmp/snapshot.sql (Join-Path $out 'db.sql')
        Invoke-Compose exec -T db rm -f /tmp/snapshot.sql
        Invoke-Compose cp wordpress:/var/www/html/wp-content/uploads (Join-Path $out 'uploads')
        # Licensed plugins (ACF PRO, Formidable Pro) are not downloadable again without the account; keep them locally.
        Invoke-Compose cp wordpress:/var/www/html/wp-content/plugins (Join-Path $out 'plugins')
        "PASS snapshot -> projects/$Project/.local/snapshots/$stamp (db.sql + uploads/ + plugins/)"
    }
    'restore' {
        $dir = Use-Project $Project
        if (-not $Arg) { throw 'usage: .\wp.ps1 restore <project> <snapshot-stamp>' }
        $src = Join-Path $dir ".local/snapshots/$Arg"
        if (-not (Test-Path (Join-Path $src 'db.sql'))) { throw "snapshot not found: $src" }
        Wait-Database
        $pw = if ($env:WP_DB_ROOT_PASSWORD) { $env:WP_DB_ROOT_PASSWORD } else { 'wordpress-fixture-root' }
        $db = if ($env:WP_DB_NAME) { $env:WP_DB_NAME } else { 'wordpress' }
        Invoke-Compose cp (Join-Path $src 'db.sql') db:/tmp/restore.sql
        Invoke-Compose exec -T db sh -c "mariadb -uroot -p'$pw' '$db' < /tmp/restore.sql && rm -f /tmp/restore.sql"
        foreach ($part in 'uploads', 'plugins') {
            if (Test-Path (Join-Path $src $part)) {
                Invoke-Compose cp (Join-Path $src "$part/.") "wordpress:/var/www/html/wp-content/$part"
                Invoke-Compose exec -T wordpress chown -R www-data:www-data "/var/www/html/wp-content/$part"
            }
        }
        "PASS restored $Arg into $($env:COMPOSE_PROJECT_NAME)"
    }
    'new' {
        if (-not $Project -or $Project -notmatch '^[a-z0-9][a-z0-9-]*$') { throw 'usage: .\wp.ps1 new <lowercase-slug>' }
        $dir = Join-Path $Projects $Project
        if (Test-Path $dir) { throw "projects/$Project already exists" }
        $ports = foreach ($slug in Get-ProjectSlugs) { [int](Read-KeyValueFile (Join-Path $Projects "$slug/runtime.env")).WP_PORT }
        $port = [Math]::Max(28000, (($ports | Measure-Object -Maximum).Maximum + 10))
        Copy-Item -Recurse (Join-Path $Projects '_template') $dir
        $envFile = Join-Path $dir 'runtime.env'
        $text = [IO.File]::ReadAllText($envFile).Replace('__SLUG__', $Project).Replace('__PORT__', "$port")
        [IO.File]::WriteAllText($envFile, $text)
        New-Item -ItemType Directory -Force (Join-Path $dir 'theme'), (Join-Path $dir 'qa'), (Join-Path $dir 'reference') | Out-Null
        "PASS projects/$Project created (port $port). Put the theme in projects/$Project/theme, then: .\wp.ps1 up $Project"
    }
}
}
finally {
    foreach ($pair in $savedEnv.GetEnumerator()) {
        [Environment]::SetEnvironmentVariable($pair.Key, $pair.Value, 'Process')
    }
}
