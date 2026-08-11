# Implementation Target CLI

`config/implementation-targets.yaml` is the single source of truth for Implementation Target family choices and the default family.

`scripts/create_implementation_profile.py` reads both values from that registry at runtime. Do not duplicate the family list in argparse, UI code, or agent prompts.

Example:

```bash
python scripts/create_implementation_profile.py \
  implementation-profiles/example.yaml \
  --profile-id IMPL-EXAMPLE \
  --family AUTO_EXISTING
```

Variant validity continues to come from `conditional_selectors` in the same registry and is validated before a profile is written.
