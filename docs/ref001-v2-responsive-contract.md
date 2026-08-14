# REF-001 V2 responsive contract

- `<= 767px`: SP composition and SP image assets.
- `>= 768px`: PC composition and PC image assets.
- `375px`: authored SP Figma reference width, not a fixed canvas width.
- `1380px`: authored PC Figma reference width.
- SP layout rails contract from viewport width with 16px side gutters and cap at 560px where a narrower readable rail is preferable.
- 390px, 430px and 767px are runtime-gated fluid-SP widths; they must not fall back to fixed 343/335/311/295px endpoint rails.
- 768px, 769px, 1024px and 1200px are runtime-gated intermediate PC widths.
- V3 is outside this contract.
