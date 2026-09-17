# First-pass visual measure（完了ゲート）

Human 2026-09-17: 「完璧？」の第一声を、何度も直したあとの出来にする。  
味の微差は人。**Figma に数字がある差は、言われる前に測って直す。**

対象: nipponbudokan のページ／詳細で、Figma と runtime を合わせる作業。  
正本の弱点分類: `docs/agent-human-fb-weak-spots.md`（完了前 7 / W7）

## 完了禁止

次をやっていない状態で「できた」「完璧？」「丁寧に見た」と言わない。

- 対象塊の Figma node 数値を書いていない
- live `getComputedStyle` / `getBoundingClientRect` と突き合わせていない
- hover / open がある塊を操作していない
- module CSS を書いたが computed が Parts のまま

## 手順（実装の途中で1回、完了前にもう1回）

1. ページを塊に分ける（表紙、h2、リード、CTA、h3 節、カード、gallery、アコーディオン、一覧行…）。
2. 各塊の Figma から **幅・高さ・gap・font-size・塗り・形（円/八角）** を写す。
3. 同じ塊を runtime で測る。差が Figma 数字と食い違うなら直す。目視「近い」は PASS にしない。
4. 直したあと **もう一度測る**。セレクタ未適用のまま次へ行かない。

## この Theme で必ず見る

- `.block-editor_wrap` と page module（`.publication_budo` 等）が **同一要素**ならセレクタは `.block-editor_wrap.publication_budo`。空白の子孫 combinator は当たらない。
- Parts（`.block-editor_wrap * + h3`、`.is-style-small` 等）が module を殺していないか、**computed の margin / 八角色**で確認する。
- 白塗りは `--color-secondary`。`--color-white` は無い。
- rest の塗り・枠を先に合わせ、hover は塗りと文字の invert（箱をずらさない）。
- `_content` 上下は共通。詳細だから抜かない。

## live 測りの最小形

```js
(() => {
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    return {
      w: Math.round(b.width),
      h: Math.round(b.height),
      mt: c.marginTop,
      gap: c.gap,
      fs: c.fontSize,
      bg: c.backgroundColor,
    };
  };
  return {
    /* 対象セレクタをここに足す */
  };
})();
```

module を当てたつもりなら、その property の computed が Figma 値になるまで CSS を疑う。

## 第一声に含めない（人）

Figma 数字から一意に決まらない味。例: パンくず行間の好み、flex gap と Parts margin のどちらを残すか、関連画像に hover opacity を足すか、プレーンテキストを wrap するか。

測ったうえで残るものだけ短く出す。聞かれてもいない味を発明しない。
