// Figma PC 344:969 / SP 442:2833 — small Gutenberg button contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../theme/css/blocks/wp-block-buttonLink-style.css',import.meta.url),'utf8');
const start=css.indexOf('    &.small {');
const end=css.indexOf('\n  }\n}\n\n.block-editor_wrap',start);
const small=css.slice(start,end);
test('small variant uses 30px mint leading icon, 8px gap, 16px labels',()=>{
  assert.ok(start!==-1&&end>start);
  assert.match(small,/min-height:\s*calc\(30 \* var\(--to-rem-func\)\)/);
  assert.match(small,/flex:\s*0 0 calc\(30 \* var\(--to-rem-func\)\)/);
  assert.match(small,/gap:\s*calc\(8 \* var\(--to-rem-func\)\)/);
  assert.match(small,/font-size:\s*calc\(16 \* var\(--to-rem-func\)\)/);
  assert.match(small,/line-height:\s*1\.5/);
  assert.match(small,/background-color:\s*var\(--jwsnj-color-sec\)/);
  assert.match(small,/content:\s*'\\f061'/);
  assert.match(small,/overflow-wrap:\s*anywhere/);
});
test('small icons distinguish file kinds and preserve focus handling in shared link',()=>{
  assert.match(small,/&\[target='_blank'\]:where\(:not\(/);
  assert.match(small,/&\[href\$='\.pdf'\]::after/);
  assert.match(small,/content:\s*'\\f15b'/);
  assert.match(small,/&::before\s*\{\s*content:\s*''/);
  assert.match(css,/&:focus-visible/);
  assert.doesNotMatch(small,/white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});

test('small button hover retains dark label on transparent background after generic hover rules',()=>{
  const hover=css.slice(css.indexOf('  /* ホバー時のスタイル */'));
  assert.match(hover,/\.wp-block-buttons\.small \.wp-block-button/);
  assert.match(hover,/\.wp-block-button__link:hover\s*\{\s*background:\s*none;\s*color:\s*var\(--color-text\)/);
  assert.match(hover,/&\.is-style-outline \.wp-block-button__link:hover\s*\{\s*background:\s*none;\s*color:\s*var\(--color-text\)/);
  assert.ok(hover.lastIndexOf('.wp-block-buttons.small')>hover.indexOf('&:has(.wp-block-button__link:hover)'), 'specific small hover rule follows generic hover rule');
});

test('small circle and glyph are independently centered for every icon and wrap state', () => {
  const before = small.match(/&::before\s*\{([^}]+)\}/)?.[1];
  const after = small.match(/&::after\s*\{([^}]+)\}/)?.[1];
  assert.ok(before && after);
  assert.match(before, /content:\s*''/);
  assert.match(before, /box-sizing:\s*border-box/);
  assert.match(before, /width:\s*calc\(30 \* var\(--to-rem-func\)\)/);
  assert.match(after, /content:\s*'\\f061'/);
  assert.match(after, /left:\s*calc\(15 \* var\(--to-rem-func\)\)/);
  assert.match(after, /top:\s*50%/);
  assert.match(after, /transform:\s*translate\(-50%, -50%\)/);
  assert.match(after, /letter-spacing:\s*0/);
  assert.match(after, /text-box-trim:\s*none/);
  assert.match(small, /\.wp-block-button \.wp-block-button__link\s*\{/);
  assert.match(small, /--_small-icon-color:\s*var\(--jwsnj-color-sec\)/);
});
test('small external link retains the circle and uses the same glyph center and hover color', () => {
  const external = small.slice(small.indexOf("&[target='_blank']"), small.indexOf("&[href$='.pdf']::after"));
  for (const ext of ['pdf','doc','docx','docm','xls','xlsx','xlsm','png','jpg','jpeg','gif','webp']) {
    assert.ok(external.includes("[href$='." + ext + "']"), ext + ' retains its file icon');
  }
  assert.match(external, /&::after\s*\{\s*content:\s*''/);
  assert.match(external, /width:\s*calc\(13 \* var\(--to-rem-func\)\)/);
  assert.match(external, /height:\s*calc\(12 \* var\(--to-rem-func\)\)/);
  assert.match(external, /mask:\s*url\('\.\.\/\.\.\/images\/common\/ico-blank\.svg'\) center \/ contain no-repeat/);
  assert.match(external, /background-color:\s*currentColor/);
  assert.doesNotMatch(external, /left:|right:|transform:|&::before/);
  assert.match(small, /color:\s*var\(--_small-icon-color\)/);
});
test('desktop gap media rule does not reapply large button minimum width to small buttons', () => {
  assert.match(small, /min-width:\s*0/);
  const desktop = css.slice(end, css.indexOf('  /* ホバー時のスタイル */'));
  assert.doesNotMatch(desktop, /min-width\s*:/);
});

test('small buttons wrap into rows on PC and flow vertically on SP', () => {
  assert.match(small, /gap:\s*calc\(20 \* var\(--to-rem-func\)\) calc\(30 \* var\(--to-rem-func\)\)/);
  assert.match(small, /@media \(width < calc\(768 \* \(1 \/ 16 \* 1rem\)\)\)\s*\{\s*flex-direction:\s*column;\s*align-items:\s*flex-start/);
  assert.doesNotMatch(small, /flex-direction:\s*row/);
});

test('bundled FA Regular outlines retain authored arrow, PDF and plain file glyphs', () => {
  // Read the shipped TTF (not system fallback). Outline bounds are diagnostic,
  // not proof of browser rasterization or the optical center.
  const font = readFileSync(new URL('../theme/webfonts/fa-regular-400.ttf', import.meta.url));
  const u16 = o => font.readUInt16BE(o), i16 = o => font.readInt16BE(o), u32 = o => font.readUInt32BE(o);
  const tables = Object.fromEntries(Array.from({length:u16(4)}, (_, i) => {
    const p=12+i*16;
    return [font.toString('ascii',p,p+4),u32(p+8)];
  }));
  const {head,hhea,cmap,loca,glyf,hmtx}=tables;
  assert.ok([head,hhea,cmap,loca,glyf,hmtx].every(Number.isInteger));
  const subtables=Array.from({length:u16(cmap+2)},(_,i)=>cmap+u32(cmap+4+i*8+4));
  const mapping=subtables.find(o=>u16(o)===12)??subtables.find(o=>u16(o)===4);
  assert.ok(mapping);
  const glyphId=cp=>{
    if(u16(mapping)===12){
      for(let i=0;i<u32(mapping+12);i++){
        const p=mapping+16+i*12,first=u32(p),last=u32(p+4);
        if(cp>=first&&cp<=last)return u32(p+8)+cp-first;
      }
    }else{
      const n=u16(mapping+6)/2,end=mapping+14,start=end+2*n+2,delta=start+2*n,range=delta+2*n;
      for(let i=0;i<n;i++){
        const first=u16(start+2*i),last=u16(end+2*i);
        if(cp<first||cp>last)continue;
        const r=range+2*i,offset=u16(r),d=i16(delta+2*i);
        if(!offset)return (cp+d)&0xffff;
        const g=u16(r+offset+2*(cp-first));
        return g?(g+d)&0xffff:0;
      }
    }
    return 0;
  };
  const locate=id=>i16(head+50)===0?2*u16(loca+2*id):u32(loca+4*id);
  const glyphs=[0xf061,0xf1c1,0xf15b,0xf002].map(cp=>{
    const id=glyphId(cp);
    assert.ok(id>0,'missing FA glyph '+cp.toString(16));
    assert.ok(locate(id+1)>locate(id),'empty FA glyph '+cp.toString(16));
    const p=glyf+locate(id);
    const bounds=[i16(p+2),i16(p+4),i16(p+6),i16(p+8)];
    assert.ok(bounds[2]>bounds[0]&&bounds[3]>bounds[1]);
    // Current bundled FA metrics: these glyphs' vertical ink midpoints equal
    // the hhea line-box midpoint. A new font version needs alignment review.
    // The magnifier is asymmetric; report its outline for review without assuming
    // an optical offset or imposing the other glyphs' metric invariant.
    if(cp!==0xf002) assert.equal(bounds[1]+bounds[3],i16(hhea+4)+i16(hhea+6),'review icon alignment after font change');
    return {code:cp.toString(16),advance:u16(hmtx+4*Math.min(id,u16(hhea+34)-1)),bounds};
  });
  const os=tables['OS/2'];
  console.log('FA_REGULAR_OUTLINE_EVIDENCE '+JSON.stringify({unitsPerEm:u16(head+18),ascent:i16(hhea+4),descent:i16(hhea+6),capHeight:os&&u16(os)>=2?i16(os+88):null,typoAsc:os?i16(os+68):null,typoDesc:os?i16(os+70):null,typoGap:os?i16(os+72):null,selection:os?u16(os+62):null,winAsc:os?u16(os+74):null,winDesc:os?u16(os+76):null,glyphs}));
});

test('frontend-only generic and small button hover are owner-local and ordered', () => {
  const hover=css.slice(css.indexOf('/* ホバー時のスタイル */'));
  assert.match(hover,/\.wp-block-button\s*\{\s*@media \(any-hover: hover\)/);
  assert.match(hover,/\.wp-block-buttons\.small \.wp-block-button\s*\{\s*@media \(any-hover: hover\)/);
});
