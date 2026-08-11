# Figma MCP Asset Intake

Figma MCPの`download_assets`が返すasset URLは**短命で、secret相当として扱う**。

このrepoではURLそのものをGitへ保存せず、ネットワーク利用可能なローカルMac / Codex / Claude Code / CI runner上で即時downloadし、**永続asset + SHA-256 manifest**へ変換する。

Canonical helper:

```text
scripts/ingest_figma_mcp_asset.py
```

## Security contract

短命URLについて:

- Gitへcommitしない
- README / issue / PR body / run recordへ貼らない
- workflow YAMLへ埋め込まない
- shell command argumentへ直接置かない
- success/error logへ出さない
- manifestへ保存しない

許可するtransport:

- stdin
- environment variable

保存するのは:

- asset bytes
- SHA-256
- byte size
- detected format / content type
- non-secret lineage (`file_key`, `node_id`, logical role)
- retrieval timestamp

## Recommended local Mac flow

### 1. Figma MCPで小さい対象nodeを選ぶ

ページ全体を`download_assets`するとraw image / SVGが20件でtruncateされることがある。

必要なSection / Mask / Group / image nodeへ対象を絞り、`download_assets`を再実行する。

### 2. URLをclipboardからstdinへ渡す

URL自体をcommand historyへ書かない。

```bash
pbpaste | python scripts/ingest_figma_mcp_asset.py \
  --url-stdin \
  --output experiments/ref001-blind-clean-20260812/implementation/theme/assets/main-visual-person-left.png \
  --file-key ZYTdtw4wCgkcBy2cVnhxVI \
  --node-id 21384:8173 \
  --logical-name main-visual-person-left
```

成功するとassetと隣接manifestができる。

```text
main-visual-person-left.png
main-visual-person-left.png.asset.json
```

manifestには短命URLを含めない。

### Environment variable variant

```bash
export FIGMA_MCP_ASSET_URL='(short-lived URL)'
python scripts/ingest_figma_mcp_asset.py \
  --output path/to/asset.png \
  --file-key ZYTdtw4wCgkcBy2cVnhxVI \
  --node-id 123:456 \
  --logical-name reason-card-1
unset FIGMA_MCP_ASSET_URL
```

可能ならstdin方式を優先する。環境変数値をdebug dumpするshell/pluginがある場合はURLが漏れる可能性があるため。

## What the helper verifies

- original source URL is HTTPS
- original host is exactly `www.figma.com`
- source path is `/api/mcp/asset/...`
- embedded credentials / URL fragmentを拒否
- redirect先もHTTPSのみ
- responseをstreaming download
- configured maximum sizeを超えたら失敗
- PNG/JPEG/GIF/WebP/SVGをmagic/content evidenceで判定
- unsupported payloadを拒否
- SHA-256をdownload中に計算
- temporary partial fileを最終assetへatomic rename
-既存asset/manifestは`--force`なしでは上書きしない

## Composite visuals

Figmaで最終表示が:

```text
Mask / Group
  ├─ color IMAGE fill
  ├─ mono IMAGE fill
  └─ offset / overlay IMAGE fill
```

のような複数layer合成なら、任意のraw image 1枚だけを取得して「完成asset」と扱わない。

Visual QA用には、必要に応じて**最終visible Group/Maskのexport**を永続化する。

ただし:

- final visible export = Visual QA authority
- CMS/WordPress attachment ownership = content/runtime authority

は別問題。

QA用composite exportが存在するからといって、その1枚をそのままACF fieldへ格納する設計に自動変換しない。

## Network blocker classification

`download_assets`でURLが取得できても、実行環境が外向きDNS/HTTPSを許可しないことがある。

この場合:

```text
FIGMA_ASSET_DISCOVERY = PASS
ASSET_BYTE_TRANSFER = BLOCKED_BY_EXECUTION_NETWORK
```

として扱う。

Figma referenceやassetそのものが壊れているとは判定しない。

別のnetwork-enabled runner/Macへhandoffして同じintakeを行う。

## Git review

commit前に最低限確認する:

```bash
python -m unittest tests.test_ingest_figma_mcp_asset

git diff --check
```

さらに、short-lived URLの文字列がtracked diffに混入していないことを確認する。

実assetをcommitするときはassetとmanifestを同じ変更単位へ入れる。

## REF-001 status

このhelperが存在するだけでは、REF-001のmedia blockerは解消扱いにしない。

blockerを閉じる条件は:

1. actual Figma source/composite bytesをnetwork-enabled環境で取得
2. persistent asset + manifestを保存
3. Web implementationへ接続
4. PC/SP visual evidenceを再取得
5. placeholder依存が消えたことを確認
6. fidelityを再評価

それまでは`experiments/ref001-blind-clean-20260812/run.yaml`のmedia blockerを維持する。
