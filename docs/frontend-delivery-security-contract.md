# Frontend Delivery / Security / Operations Contract

Status: ACTIVE production boundary contract

Figma fidelity・runtime resilienceを満たしたfrontendを、**公開運用時にも壊れにくく、安全に配信できる状態**へ繋ぐためのcontract。

Authorityは `docs/frontend-authority-model.md`。Company / Existing / explicit Project / hosting-deployment contractが常に優先する。

この文書はSection workerへserver responsibilityを押し付けるものではない。**誰が何を持つかを明確にすること**が目的。

---

## 1. Responsibility boundary

### Frontend implementation owner

Relevant scopeで確認する:

- semantic links/forms/buttons
- safe external link attributes
- third-party embed/script placement
- analytics hook duplication
- consent-gated component behavior
- JS failure fallback where feasible
- error/empty/loading UI
- cache-busted asset references according to project build
- no client-visible secrets

### Server / deployment / platform owner

通常こちらがowner:

- HTTPS / TLS
- CSP response header
- HSTS
- Referrer-Policy
- Permissions-Policy
- `X-Content-Type-Options`
- `frame-ancestors` / framing policy
- secure cookie attributes
- server-side validation
- authentication/session security
- rate limiting / abuse control
- cache/CDN response policy
- HTTP status codes

Frontend workerがFigmaを理由にこれらを勝手に変更しない。

---

## 2. Security header contract

Security headersは「全部同じ値を貼る」ものではない。

Priority:

```text
Company / hosting security policy
→ existing deployment config
→ application/framework security layer
→ project-specific requirement
```

Relevant projectでは最低限ownerを特定し、必要なheaderが意図せず消えていないか確認する。

Candidate areas:

- Content-Security-Policy
- Strict-Transport-Security
- Referrer-Policy
- Permissions-Policy
- X-Content-Type-Options
- CSP `frame-ancestors`

Deprecated/legacy headerを「security checklistだから」で機械追加しない。

### CSP

CSPはthird-party/script/font/image接続先と密接に関係する。

- Section workerが`unsafe-inline`/`unsafe-eval`を安易に広げない
- inline script/style追加で既存CSPを壊さない
- nonce/hash strategyが既存なら従う
- third-party追加時はCSP ownerへ影響を戻す

CSPを満たすためだけにFigma fidelityやmaintainabilityを破壊せず、root causeを解く。

---

## 3. Client-side secrets / data exposure

Browserへ配送された値はsecretではない。

Frontend bundle / HTML / source map / public runtime configへ:

- private API key
- password
- signing secret
- private token
- server-only credential

を入れない。

Public key / publishable token等はprovider contractに従う。

Sensitive decisionをDOM/CSS/JSで隠すだけにしない。Authorizationはserver-side ownership。

---

## 4. Output / injection boundary

CMS/API/User Generated dataではfrontend layoutだけでなくdata safety ownershipを確認する。

- framework/CMSのescaping policyを使う
- HTMLを許可するfieldはsanitization ownerを明確にする
- URL属性を文字列結合だけで信用しない
- `innerHTML`相当をdefault rendering pathにしない

WordPress/PHPでは既存escape/sanitize policyを優先する。

このcontractはserver-side validationの代替ではない。

---

## 5. External links / navigation safety

`target="_blank"`等を使う場合、Existing/Company browser policyに従い必要な`rel`/referrer behaviorを確認する。

External destinationだからと全linkへ同じattributeを機械追加しない。

Primary navigationはJavaScriptだけに依存させる必要がない場合、native link semanticsを保つ。

---

## 6. Progressive enhancement / JavaScript failure

JS required applicationとordinary content siteを同じcontractにしない。

Capability classification candidate:

- `SERVER_OR_NATIVE_CORE`
- `ENHANCED_BY_JS`
- `JS_REQUIRED_APPLICATION`

### Ordinary content/navigation

可能ならJS failure時も:

- primary textが読める
- primary linksが辿れる
- form/native fallbackがproject contract通り

を守る。

### JS-required application

完全fallbackを無理に作らない。その代わり:

- failure boundary
- recovery/reload path
- understandable error state
- monitoring ownership

を明確にする。

React等のError Boundaryも「frameworkだから全Sectionに作る」のではなく、failure isolation boundaryとして設計する。

---

## 7. HTTP / route error contract

Relevant website/appでは次を区別する:

- 404 Not Found
- 403/authorization failure when applicable
- 500/server failure
- network/offline failure
- application/runtime failure

### 404

Soft 404（存在しないのに200 OKで通常ページ表示）をdefaultにしない。

Error pageでも:

- site identity
- recovery navigation
- keyboard/accessibility
- responsive layout

を必要範囲で維持する。

### 500 / fatal failure

Debug stack/secretをproduction UIへ露出しない。

Figmaにerror pageが無ければ勝手にブランドデザインを発明せず、Existing/Project patternへ従う。

---

## 8. Analytics / measurement ownership

Analyticsはvisual DOMの副作用として増やさない。

Relevant projectでは:

- event owner
- event name/schema
- page-view ownership
- SPA route-change ownership
- consent requirement
- duplicate firing prevention
- environment separation

を明確にする。

Responsive DOMをPC/SPで二重化した場合、hidden側からanalytics eventが二重発火しないことを確認する。

PII/credential等をanalytics payloadへ不用意に送らない。

Analytics implementationをSEO/visual fidelityのために勝手に変更しない。

---

## 9. Consent / privacy gate

Consentが必要なprojectでは:

```text
before consent
→ consent granted
→ consent revoked/changed
```

のstateを持てる。

Relevant third-party/analytics/embedはCompany/privacy policyに従ってgateする。

Consent前のplaceholderが:

- layoutを壊さない
- cookie/scriptを先に発火しない
- accessibilityを失わない

ことを確認する。

Consent UI自体をdark pattern化しない。

法的要件そのものはProject/Company/legal authorityに従う。

---

## 10. Form abuse / spam boundary

Form securityをfrontend validationだけで完成扱いしない。

Server-side ownerが必要に応じて:

- validation
- rate limiting
- duplicate submission protection
- abuse/spam detection
- CSRF protection when applicable
- honeypot/CAPTCHA等

を選ぶ。

CAPTCHAを全formへ標準導入しない。UX/A11y/privacy/attack profileで判断する。

Frontend側はbot protection追加でlayout/focus/submit lifecycleが壊れないことを確認する。

---

## 11. Asset cache / versioning

Deployment/cache policyはExisting build/CDNを優先する。

General intent:

### Fingerprinted immutable assets

Hash付きJS/CSS/font/image等で内容とURLが結び付く場合、long-lived immutable cacheを候補にできる。

### Mutable HTML/data

HTML/API responseへassetと同じ永久cacheを機械適用しない。

### WordPress / classic assets

Query string/version helper、theme asset version、build manifest等、既存architectureを使う。

CSS修正後にbrowser/CDN cacheのため旧assetが残り、Visual QAを誤判定しないようにする。

### Service Worker

PWA/OFFLINE_REQUIREDでないのにcache問題解決目的だけでService Workerを導入しない。

---

## 12. Source maps / debug artifacts

Productionへ:

- debug flag
- verbose development error
- test credentials
- fixture-only data
- accidental source map exposure

を無条件に残さない。

Source map公開はmonitoring/debug policyとsecurity/privacyを見てProject ownerが決める。

---

## 13. SEO / metadata delivery boundary

Detailed metadata ownershipは `docs/frontend-production-runtime-contract.md`。

Delivery側では:

- server-render/head ownership
- canonical duplication
- robots/noindex environment drift
- preview/stagingのindexing policy
- social metadata delivery
- structured-data duplication

を確認する。

Production deployでstaging `noindex`が残る、またはpreview URLがcanonicalになる事故を防ぐ。

---

## 14. Observability / client error reporting

Monitoringを全projectへ強制しない。

Relevant applicationでは:

- client runtime errors
- failed resource/API calls
- Core Web Vitals/RUM
- release/version identity
- source map mapping

をProject observability contractへ繋げられる。

User content/PIIをerror payloadへ過剰収集しない。

`RUM_REQUIRED`等をProject capabilityとして扱う。

---

## 15. Optional project capabilities

次はProject/Companyで必要な時だけactivateする:

- `SECURITY_HEADER_REVIEW_REQUIRED`
- `CONSENT_REQUIRED`
- `ANALYTICS_REQUIRED`
- `ERROR_ROUTE_REQUIRED`
- `BOT_PROTECTION_REQUIRED`
- `CACHE_POLICY_REQUIRED`
- `RUM_REQUIRED`
- `SEO_REQUIRED`
- `SHARE_METADATA_REQUIRED`

Securityの基本境界（secretをclientへ置かない、third-partyをtrust boundaryとして扱う等）はCORE。

Specific header value、analytics vendor、CMP、CAPTCHA、cache TTL等はProject-specific。

---

## 16. QA / change impact

変更によるscope例:

```text
Section local markup
→ section + semantic/security smoke

Analytics shared hook
→ known events + duplicate firing + relevant routes

CSP / third-party allowlist
→ affected integrations + primary navigation/content

Global asset versioning/cache
→ representative deploy + stale asset check

Error boundary/router
→ relevant failure routes + recovery flow
```

Security/delivery changeもchanged line countでQA範囲を決めない。

---

## 17. Learning loop

Delivery/production failureも学習対象。

```text
production/runtime incident
→ exact environment/release/config reproduction
→ ownership/root cause
→ minimal repair
→ clean replay
→ candidate pattern/rule
→ cross-project evidence
→ promotion/demotion
```

記録候補:

- deployment/runtime
- browser
- release commit
- header/cache config
- vendor/consent state
- analytics state
- route/error state
- environment (preview/staging/production)

一度のprovider/CDN/browser事故から永久banを作らない。

---

## 18. Definition of Done

Relevant scopeで:

- no client-shipped private secret
- output/injection ownershipが明確
- external/third-party boundaryが明確
- required security headers ownerが明確
- JS failure/recovery contractが妥当
- error route/status ownershipが妥当
- analytics duplicate firingなし when applicable
- consent lifecycleが成立 when applicable
- cache/versioningがdeployment architectureと整合
- staging/production metadata driftなし when applicable
- failure evidenceをreplay可能に残せる

**Frontend FINALとは、見た目だけでなく公開後の責務境界まで説明できる状態。**
