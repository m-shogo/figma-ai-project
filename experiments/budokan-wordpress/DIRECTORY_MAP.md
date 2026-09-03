# ディレクトリーマップ（Human Authority 2026-09-03）

正本。ページ URL・メニュー階層・種類はここ。誤字指摘（`graduate` 空白、English 見出しの引用塊、`mandatory-budo/` 空行）は **気にしない**。

メニューは Human が「これを作れ」と言うまで作らない。言われた locaton を、このマップから **それなりに** 載せる。

---

## テンプレート / ビジュアル

| マップの種類 | ページの出し方 | タイトル帯 |
| --- | --- | --- |
| ナビゲーション | ナビゲーションテンプレート | **画像付き**（`page_img` あり → `_fixedPage` / Figma `page_title-img`） |
| それ以外（デフォルト） | 通常の固定ページ等 | **黄土色**（`page_img` なし → Figma `page_title-pc` / `page_title-sp`） |

- フォームは Formidable。中身は Human。URL だけマップに残す
- 外部ページは WP ページにしない（カスタムリンク）
- 一覧: `/event/` = CPT `event`、`/news/` = お知らせ、`/feature/` = 特集（現行 CPT なし。一覧 URL だけ覚える）

メニュー上の段差と URL の段差は一致しない行がある。URL は各行の `path` が正。段差はメニュー用。

---

## ツリー

`path` はサイトルートからのパス。種類はマップ表記のまま。

- ホーム `/` フロントページ
  - 日本武道館について `/about/` ナビゲーション
    - 日本武道館とは `/about/budokan/` 固定ページ
    - 施設概要 `/about/facility/` 固定ページ
    - 歴代会長 `/about/past-presidents/` 固定ページ
    - 歴史・沿革 `/about/history/` 固定ページ
    - アクセス `/about/access/` 固定ページ
    - 業務・財務に関する資料 `/about/disclosure/` 固定ページ
    - 関連協力組織 `/about/partners/` 固定ページ
      - 日本武道協議会 `/about/partners/budo-council/` 固定ページ
      - 全国都道府県立武道館協議会 `/about/partners/budokan-council/` 固定ページ
      - 日本古武道協会 `/about/partners/kobudo-association/` 固定ページ
    - ご来場の皆様へ `/about/concert-guide/` 固定ページ
  - 事業について `/activities/` ナビゲーション
    - 武道 振興・普及事業 `/activities/budo/` ナビゲーション
      - （グループ）大会イベント
        - 全日本少年少女武道錬成大会 `/activities/budo/youth-budo-tournament/` 固定ページ
          - 合気道 `/activities/budo/aikido/` 固定ページ
          - 柔道 `/activities/budo/judo/` 固定ページ
          - 銃剣道 `/activities/budo/jukendo/` 固定ページ
          - 空手道 `/activities/budo/karate/` 固定ページ
          - 剣道 `/activities/budo/kendo/` 固定ページ
          - 弓道 `/activities/budo/kyudo/` 固定ページ
          - なぎなた `/activities/budo/naginata/` 固定ページ
          - 少林寺拳法 `/activities/budo/shorinji-kempo/` 固定ページ
          - 新規届フォーム `/activities/budo/form-register/` フォーム
          - 変更届フォーム `/activities/budo/form-change/` フォーム
          - 銃剣道参加申込フォーム `/activities/budo/form-jukendo/` フォーム
        - 地方青少年武道錬成大会 `/activities/budo/regional-youth-budo/` 固定ページ
        - 日本古武道演武大会 `/activities/budo/kobudo-demonstration/` 固定ページ
        - 入場券応募フォーム `/activities/budo/form-ticket/` フォーム
        - 鹿島古武道大会 `/activities/budo/kashima-kobudo/` 固定ページ
        - 鏡開き式・武道始め `/activities/budo/kagami-biraki/` 固定ページ
        - 記念品引換券応募フォーム `/activities/budo/form-kagamibiraki/` フォーム
        - 若潮杯争奪武道大会 `/activities/budo/wakashio-cup/` 固定ページ
        - 日本武道館で武道を体験してみよう `/activities/budo/budo-experience/` 固定ページ
        - 参加申込フォーム `/activities/budo/form-experience/` フォーム
      - （グループ）指導者研修・指導法研究
        - 全国武道指導者研修会 `/activities/budo/budo-seminar/` 固定ページ
        - 全国空手道指導者研修会 `/activities/budo/karate-seminar/` 固定ページ
        - 全国少林寺拳法指導者研修会 `/activities/budo/shorinji-kempo-seminar/` 固定ページ
        - 全国高等学校･中学校剣道（部活動）指導者研修会 `/activities/budo/kendo-club-seminar/` 固定ページ
        - 全国剣道指導者研修会（東日本ブロック） `/activities/budo/kendo-east-seminar/` 固定ページ
        - 全国中学校（教科）柔道指導者研修会 `/activities/budo/kyoka-seminar/` 固定ページ
        - 全国合気道指導者研修会 `/activities/budo/aikido-seminar/` 固定ページ
        - 全国銃剣道指導者研修会 `/activities/budo/jukendo-seminar/` 固定ページ
        - 全国相撲指導者研修会 `/activities/budo/sumo-seminar/` 固定ページ
        - 全国なぎなた指導者研修会 `/activities/budo/naginata-seminar/` 固定ページ
        - 全国剣道指導者研修会（西日本ブロック） `/activities/budo/kendo-west-seminar/` 固定ページ
        - 全国弓道指導者研修会 `/activities/budo/kyudo-seminar/` 固定ページ
        - 地域社会武道指導者研修会 `/activities/budo/community-seminar/` 固定ページ
        - 中学校武道授業指導法研究事業 `/activities/budo/school-budo/` 固定ページ
          - 過去の実施内容 `/activities/budo/archive/` 固定ページ
      - （グループ）国際交流事業
        - 武道TV `/activities/budo/budo-tv/` 固定ページ
        - 外国人留学生等対象国際武道文化セミナー `/activities/budo/international-seminar/` 固定ページ
        - 参加申込フォーム `/activities/budo/form-international/` フォーム
        - 海外派遣日本武道代表団 `/activities/budo/budo-delegation/` 固定ページ
    - 書道 普及・奨励事業 `/activities/shodo/` ナビゲーション
      - （グループ）展覧会
        - 全日本書初め大展覧会 `/activities/shodo/kakizome/` 固定ページ
        - 高円宮杯日本武道館書写書道大展覧会 `/activities/shodo/takamado/` 固定ページ
        - 上位入賞作品 `/activities/shodo/award/` 固定ページ
      - 書道事業年間行事予定表 `/activities/shodo/schedule/` 固定ページ
    - 武道学園の運営 `/activities/academy/` ナビゲーション
      - 武道学園の行事 `/activities/academy/event/` 固定ページ
      - 武道学園学則 `/activities/academy/regulations/` 固定ページ
      - 講師紹介 `/activities/academy/instructor/` 固定ページ
      - 時間割・年間行事予定表 `/activities/academy/timetable/` 固定ページ
      - 見学・体験授業 `/activities/academy/visit/` 固定ページ
  - 刊行物について `/publications/` （種類空欄。ハブとして扱う）
    - 武道 刊行物事業 `/publications/budo/` ナビゲーション
      - 月刊「武道」最新号のご案内 `/publications/budo/latest/` 固定ページ
      - 月刊「武道」バックナンバー、総索引 `/publications/budo/back/` 刊行物一覧
      - 単行本 `/publications/budo/books/` 単行本一覧
        - 購入申込入力フォーム `/publications/budo/order/` フォーム
      - 単行本（Foreign Language Books） `/publications/budo/books-en/` 単行本一覧
      - ご意見ご感想 `/publications/budo/form-contact/` フォーム
    - 書道 発刊物事業 `/publications/shodo/` ナビゲーション
      - 月刊「書写書道」最新号のご案内 `/publications/shodo/latest/` 固定ページ
      - 電子版・会員Webサイトのご案内 `/publications/shodo/digital/` 固定ページ
        - 申込入力フォーム `/publications/shodo/form-digital/` フォーム
      - 月刊「書写書道」バックナンバー `/publications/shodo/back/` 刊行物一覧
      - 書写書道各種申込書 `/publications/shodo/form-shodo/` 固定ページ
      - 単行本 `/publications/shodo/books/` 固定ページ
  - 研修センターについて `/training-center/` ナビゲーション
    - 宿泊利用申し込み `/training-center/stay/` 固定ページ
    - 施設概要 `/training-center/facility/` 固定ページ
    - 食事 `/training-center/meals/` 固定ページ
    - 武道学園（勝浦分園） `/training-center/budo-school/` 固定ページ
    - アクセス `/training-center/access/` 固定ページ
  - 開催イベント `/event/` イベント一覧
  - お知らせ `/news/` お知らせ一覧
  - 特集記事 `/feature/` 特集一覧
  - 中学校武道必修化サイト `/mandatory-budo/` ナビゲーション
  - 少年少女武道指導書 `/youth-budo-guide/` ナビゲーション
    - 武道 `/youth-budo-guide/budo/` 固定ページ
    - 柔道 `/youth-budo-guide/judo/` 固定ページ
    - 剣道 `/youth-budo-guide/kendo/` 固定ページ
    - 弓道 `/youth-budo-guide/kyudo/` 固定ページ
    - 相撲 `/youth-budo-guide/sumo/` 固定ページ
    - 空手道 `/youth-budo-guide/karate/` 固定ページ
    - 合気道 `/youth-budo-guide/aikido/` 固定ページ
    - 少林寺拳法 `/youth-budo-guide/shorinji-kempo/` 固定ページ
    - なぎなた `/youth-budo-guide/naginata/` 固定ページ
    - 銃剣道 `/youth-budo-guide/jukendo/` 固定ページ
  - 採用情報 `/recruit/` ナビゲーション
    - 職員採用（大卒・院卒） `/recruit/graduate/` 固定ページ
    - 職員採用（専門卒） `/recruit/vocational/` 固定ページ
      - エントリーフォーム `/recruit/form-entry/` フォーム
    - 職員採用案内 `/recruit/staff/` 固定ページ
  - 武道とは `/budo/` 固定ページ
    - 現代武道9種目紹介 `/budo/disciplines/` ナビゲーション
      - 柔道 `/budo/disciplines/judo/` 固定ページ
      - 剣道 `/budo/disciplines/kendo/` 固定ページ
      - 弓道 `/budo/disciplines/kyudo/` 固定ページ
      - 相撲 `/budo/disciplines/sumo/` 固定ページ
      - 空手道 `/budo/disciplines/karate/` 固定ページ
      - 合気道 `/budo/disciplines/aikido/` 固定ページ
      - 少林寺拳法 `/budo/disciplines/shorinji-kempo/` 固定ページ
      - なぎなた `/budo/disciplines/naginata/` 固定ページ
      - 銃剣道 `/budo/disciplines/jukendo/` 固定ページ
  - Q&A（よくあるご質問） `/qa/` 固定ページ
    - 高円宮杯／書初め席書大会Q＆A `/qa/kakizome-contest/` 固定ページ
    - 月刊「書写書道」Q＆A `/qa/shodo/` 固定ページ
  - English `/english/` ナビゲーション
    - About Budokan `/english/about/` 固定ページ
    - The Definition of Budō `/english/definition/` 固定ページ
    - International Seminar of Budō Culture `/english/seminar/` 固定ページ
  - お問い合わせ `/contact/` 固定ページ
  - パンフレットのご案内 `/brochure/` 固定ページ
  - 広告掲載について `/advertising/` 固定ページ
  - サイトマップ `/sitemap/` 固定ページ
  - 武道DVD貸出作品一覧 `/dvd/` 固定ページ
  - 公式YouTube動画チャンネル `/youtube/` 外部ページ
  - 月刊「武道」編集部SNS（X・Instagram） `/sns/` 外部ページ
  - 個人情報保護方針 `/privacy/` 固定ページ
