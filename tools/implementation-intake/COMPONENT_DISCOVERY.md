# Scoped Existing Component Candidate Discovery

The Fast Loop separates **finding plausible existing files** from **deciding whether they are actually compatible**.

This prevents the common failure mode:

`Figma name looks similar -> reuse component -> visual/behavior mismatch -> expensive repair`

## Flow

```text
Figma component / repeated UI
  ↓
project scope filter
  ↓
bounded lexical candidate discovery
  ↓
observe visual + semantic + behavior compatibility
  ↓
fast_visual_qa.map_component()
  ↓
reuse / adapt / new
```

`component_candidates.py` only performs the first discovery step. It never returns `reuse` based on naming.

## Bounded search

The scanner is intentionally not a whole-repository `rglob` on every Section.

It:

- derives literal scan roots from project `include` globs (`src/**` scans `src`, not the whole repo)
- prunes directories matched by `exclude` or `protected` before their files are read
- reads source-like files only (`tsx/jsx/ts/js/vue/svelte/php/html/css/scss`)
- has a candidate-file budget (`--max-files`, default 200)
- has a filesystem traversal budget (`--max-scan-files`, default 1200)
- reads at most 64 KiB per selected source file
- returns lexical evidence and requires a later compatibility observation

If project scope itself is broad (for example `**/*`), traversal is still capped by the scan budget. Protected roots are reported but not traversed into for candidate content.

For the current project this keeps V2/V3 out of candidate discovery; another project can supply different protected paths.

## Example

```bash
cat > /tmp/component-scope.json <<'JSON'
{
  "include": ["src/**", "templates/**", "parts/**"],
  "exclude": ["legacy/**", "vendor/**", "node_modules/**"],
  "protected": []
}
JSON

python3 tools/implementation-intake/component_candidates.py \
  . \
  "Main Visual" \
  --scope /tmp/component-scope.json \
  --alias "campaign hero" \
  --max-files 200 \
  --max-scan-files 1200
```

The result is a short candidate list, not an architecture decision.

## Compatibility remains authoritative

After inspecting candidates, supply explicit compatibility evidence to `map_component()`:

- `visual` — rendered structure/fidelity compatibility
- `semantic` — role/content/ownership compatibility
- `behavior` — interaction/runtime compatibility

Name similarity can help discover a file, but it cannot compensate for weak semantic or behavioral compatibility when deciding reuse.
