# REF-001 Clean Replay First Pass Runtime

This runtime is dedicated to the pre-comparison Clean Replay First Pass. It uses WordPress 7.0.2 on PHP 8.3, ACF PRO from the official Composer repository, the benchmark page template, and the frozen 767/768 breakpoint contract.

The capture matrix is `320 / 375 / 390 / 430 / 767 / 768 / 769 / 1024 / 1380`.

Current Figma asset discovery succeeds, but the execution sandbox cannot persist bytes from the short-lived MCP asset URLs. The implementation therefore keeps the correct WordPress attachment-ID pipeline and deterministic visual fallbacks. Short-lived Figma URLs are intentionally not committed.
