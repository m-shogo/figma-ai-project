# Portability — 他案件へ持ち出す方法

このrepoの最終成果は、特定画面の完成コードではなく、**次案件で最初から精度を上げる再利用可能なinstruction package**。

## Four layers

### Layer 1 — Universal reproduction core

案件やagentに依存しない。

例:

- referenceをfreezeする
- inspect before implement
- first-passを保存する
- exact viewportでverifyする
- failure class単位でrepairする
- clean replayする

置き場所:

- `AGENTS.md`
- `docs/`
- `playbook/proven/`

### Layer 2 — Agent adapter

Codex / Claude Code / Cursor 固有。

例:

- instruction fileの置き方
- MCP config方法
- client固有skillの呼び方

案件固有design ruleは入れない。

### Layer 3 — Framework / codebase adapter

React / Vue / Next / native app / design systemなどの実装側差。

例:

- token source
- component directory
- screenshot runner
- test command

複数案件で再利用できる場合だけ共通化する。

### Layer 4 — Reference package

案件固有。

- Figma URL/node
- exact PC/SP frames
- assets
- states
- responsive invariants
- starting code SHA

**他案件へコピーしない。**

## Portable bundle goal

将来的に別repoへ導入する際、理想は以下だけで開始できること。

```text
<target-repo>/
  AGENTS.md                 # proven core rules
  .ai-figma/
    reference.yaml          # project-specific
    run.yaml
    prompts/                # proven staged prompts
```

agent固有adapterが必要なら追加する。

## What not to export

- 1回しか成功していないprompt hack
- 特定画面のmagic number
- 特定modelの一時的癖
- project-only component names
- historical failure logs全部

これらは研究repoに残し、portable bundleを汚さない。

## Export gate

他案件へ持ち出してよいrule:

- Candidate以上
- clean replay済み
- scope labelが明確
- known limitsあり
- current toolingでまだ有効

`Proven`でなくても実験目的で持ち出してよいが、その場合はcandidateであることを明記する。

## Success metric

Portabilityの成功は「ファイルをコピーできた」ではなく:

- 新案件のFirst-passが以前より高い
- 同じfailureを再発しにくい
- 初回の説明量が減る
- project-specific instructionが少なく済む

で判断する。
