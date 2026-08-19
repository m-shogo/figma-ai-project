<?php
/**
 * Template Name: LP オリジナルページ（ACFなし直書き版）
 *
 * これはWordPressの固定ページテンプレートです。
 * 本文（<main>...</main>）はACFやfunctions.php側のヘルパーに依存せず、
 * このファイル1枚の中に直接HTMLとして書き出してあります（"直書き"版）。
 *
 * 画像・CSS・JSは、このファイルと同じ階層にある `lp/` フォルダから読み込みます。
 *   lp/css/ref001.css
 *   lp/js/ref001-interactions.js
 *   lp/image/icons/*.svg, lp/image/mv/*.svg, lp/image/photos/{pc,sp}/*.webp
 *
 * ヘッダー/フッターは既存テーマ側（get_header() / get_footer()）をそのまま使う想定です。
 * 会社/テーマ側の都合でget_header()/get_footer()が使えない場合は、
 * 下の2行を削除して素のHTML(<!DOCTYPE html>...)へ置き換えてください。
 *
 * --- Student Voice / Swiper をACF化したい場合 ---
 * 本文中の「学生の声」セクション（<section class="ref-student-voice" ...）を
 *   <?php include __DIR__ . '/lp/acf-swap/student-voice-acf.php'; ?>
 * に、「Swiper（メッセージ）」セクション（<section class="ref-messages" ...）を
 *   <?php include __DIR__ . '/lp/acf-swap/swiper-acf.php'; ?>
 * に置き換えてください。ACF PROが有効なら lp/acf-json/*.json のフィールドが
 * 自動で読み込まれます。ACF未設定/空の場合は、この直書き版と同じ内容が
 * そのまま表示されます（フォールバック動作は lp/acf-swap/ 側に内蔵済み）。
 */
$lp_base = trailingslashit( get_stylesheet_directory_uri() ) . 'lp/';

get_header();
?>
<link rel="stylesheet" href="<?php echo esc_url( $lp_base . 'css/ref001.css' ); ?>">
<main class="ref-page" data-ref001-page data-figma-pc="21384:8173" data-figma-sp="21376:4401">
  <section class="ref-mv" data-section="main-visual" data-figma-pc="21378:8032" data-figma-sp="21376:4886">
  <div class="ref-mv__people" aria-hidden="true">
    <picture class="ref-picture ref-mv__person ref-mv__person--left" data-asset-slot="main-visual-left" data-figma-pc="21378:8041" data-figma-sp="21376:4894"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/main-visual-left-21376-4894.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/main-visual-left-21378-8041.webp' ); ?>" alt="" loading="eager" decoding="async"></picture>    <picture class="ref-picture ref-mv__person ref-mv__person--right" data-asset-slot="main-visual-right" data-figma-pc="21378:8036" data-figma-sp="21376:4890"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/main-visual-right-21376-4890.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/main-visual-right-21378-8036.webp' ); ?>" alt="" loading="eager" decoding="async"></picture>  </div>
  <div class="ref-content ref-mv__copy">
    <h1 class="ref-mv__hero">
      <span class="ref-mv__hero-main"><span class="ref-mv__quote ref-mv__quote--left">“</span><strong>ケイザイ</strong><span class="ref-mv__quote ref-mv__quote--right">”</span></span>
      <span class="ref-mv__hero-sub">って<span class="ref-mv__hero-comma">、</span>想像以上に</span>
      <span class="ref-mv__hero-end">おもしろい。</span>
    </h1>
    <p class="ref-mv__desc">７つのコース制で“ミライ”を見つけ、<br>資格取得支援で“チカラ”をつける。<br>千葉の経済と就職に強い学びがここにある。</p>
  </div>
  <a class="ref-mv__oc" href="#" data-link-status="UNRESOLVED" aria-label="オープンキャンパス">
    <span class="ref-mv__oc-kicker">
      <img class="ref-mv__oc-kicker-shape ref-mv__oc-kicker-shape--fill" src="<?php echo esc_url( $lp_base . 'image/mv/oc-kicker-fill.svg' ); ?>" alt="" width="187" height="47" aria-hidden="true">
      <img class="ref-mv__oc-kicker-shape ref-mv__oc-kicker-shape--line" src="<?php echo esc_url( $lp_base . 'image/mv/oc-kicker-line.svg' ); ?>" alt="" width="187" height="47" aria-hidden="true">
      <span class="ref-mv__oc-kicker-text">大学の雰囲気を体験！</span>
    </span>
    <b>OPEN<br>CAMPUS</b><small>開催中！</small>
  </a>
</section>
<section class="ref-reason" data-section="reason" data-figma-pc="21378:7999" data-figma-sp="21376:4852">
    <div class="ref-content">
        <header class="ref-reason__head">
            <span class="ref-kicker"># REASON</span>
            <h2 class="ref-section-title ref-bracket-title"><span class="ref-reason__title-lead">千葉経済大学が</span><strong>選ばれる理由</strong></h2>
            <p class="ref-reason__intro">学生一人ひとりに寄り添う教育と、地域に根ざした実践的な学びで、将来につながる力を育みます。</p>
        </header>
        <div class="ref-reason__cards">
                            <article class="ref-reason-card">
                    <picture class="ref-picture ref-reason-card__media" data-asset-slot="reason-1" data-figma-pc="21378:8002" data-figma-sp="21376:4855"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-1-21376-4855.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-1-21378-8002.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                    <div class="ref-reason-card__body">
                        <h3 class="ref-reason-card__title">少人数教育</h3>
                        <p class="ref-reason-card__text">一人ひとりに目が届く少人数教育。質問や相談もしやすい環境です。</p>
                    </div>
                </article>
                            <article class="ref-reason-card">
                    <picture class="ref-picture ref-reason-card__media" data-asset-slot="reason-2" data-figma-pc="21378:8010" data-figma-sp="21376:4864"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-2-21376-4864.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-2-21378-8010.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                    <div class="ref-reason-card__body">
                        <h3 class="ref-reason-card__title">充実のキャリア支援</h3>
                        <p class="ref-reason-card__text">キャリア支援と企業連携により、希望進路の実現をサポートします。</p>
                    </div>
                </article>
                            <article class="ref-reason-card">
                    <picture class="ref-picture ref-reason-card__media" data-asset-slot="reason-3" data-figma-pc="21378:8018" data-figma-sp="21376:4872"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-3-21376-4872.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-3-21378-8018.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                    <div class="ref-reason-card__body">
                        <h3 class="ref-reason-card__title">地域連携・インターンシップ</h3>
                        <p class="ref-reason-card__text">地域企業・自治体との実践的な学びで、社会で活きる力を養います。</p>
                    </div>
                </article>
                    </div>
    </div>
</section>
<section class="ref-education" data-section="education" data-figma-pc="21378:7868" data-figma-sp="21376:4720">
    <div class="ref-content">
        <div class="ref-education__head">
            <header class="ref-education__title">
                <span class="ref-kicker"># EDUCATION</span>
                <h2>４年間の学び</h2>
            </header>
            <div class="ref-education__intro">
                <h3>将来、これから探しても大丈夫</h3>
                <p>千葉経済大学では、経済や経営を学びながら、世の中の仕組みを知り、自分の興味や可能性を見つけていきます。</p>
            </div>
        </div>

        <div class="ref-education__steps">
                            <article class="ref-edu-card">
                    <div class="ref-edu-card__badge">
                        <span class="ref-edu-card__number">01</span>
                        <small>/</small>
                        <span class="ref-edu-card__phase">スタート</span>
                    </div>
                    <h3>大学1年生の自分</h3>
                    <picture class="ref-picture ref-edu-card__media" data-asset-slot="education-1" data-figma-pc="21378:7980" data-figma-sp="21376:4835"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/education-1-21376-4835.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/education-1-21378-7980.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                    <ul>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>将来がまだ見えない</span></li>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>学科選択制度で基礎を学ぶ</span></li>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>７つのコースで目標を明確に</span></li>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>資格取得支援でスキルを発見</span></li>
                                            </ul>
                </article>
                                    <span class="ref-edu-flow-arrow" aria-hidden="true">
                        <img class="ref-svg-icon ref-edu-flow-arrow__glyph" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">                        <img class="ref-svg-icon ref-edu-flow-arrow__glyph" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">                    </span>
                                            <article class="ref-edu-card">
                    <div class="ref-edu-card__badge">
                        <span class="ref-edu-card__number">02</span>
                        <small>/</small>
                        <span class="ref-edu-card__phase">学ぶ</span>
                    </div>
                    <h3>世の中の仕組みを知る</h3>
                    <picture class="ref-picture ref-edu-card__media" data-asset-slot="education-2" data-figma-pc="21378:7946" data-figma-sp="21376:4801"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/education-2-21376-4801.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/education-2-21378-7946.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                    <ul>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>ヒット商品の裏側</span></li>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>トクするお金のルール</span></li>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>AIで仕事はどうなる</span></li>
                                            </ul>
                </article>
                                    <span class="ref-edu-flow-arrow" aria-hidden="true">
                        <img class="ref-svg-icon ref-edu-flow-arrow__glyph" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">                        <img class="ref-svg-icon ref-edu-flow-arrow__glyph" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">                    </span>
                                            <article class="ref-edu-card">
                    <div class="ref-edu-card__badge">
                        <span class="ref-edu-card__number">03</span>
                        <small>/</small>
                        <span class="ref-edu-card__phase">出会う</span>
                    </div>
                    <h3><span class="ref-edu-card__title-line">先生と一緒に</span><span class="ref-edu-card__title-line">考える</span></h3>
                    <picture class="ref-picture ref-edu-card__media" data-asset-slot="education-3" data-figma-pc="21378:7917" data-figma-sp="21376:4769"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/education-3-21376-4769.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/education-3-21378-7917.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                    <ul>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>教職員との距離が近い</span></li>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>悩みを相談しやすい</span></li>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>個人に合わせた進路のサポート</span></li>
                                            </ul>
                </article>
                                    <span class="ref-edu-flow-arrow" aria-hidden="true">
                        <img class="ref-svg-icon ref-edu-flow-arrow__glyph" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">                        <img class="ref-svg-icon ref-edu-flow-arrow__glyph" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">                    </span>
                                            <article class="ref-edu-card">
                    <div class="ref-edu-card__badge">
                        <span class="ref-edu-card__number">04</span>
                        <small>/</small>
                        <span class="ref-edu-card__phase">ゴール</span>
                    </div>
                    <h3><span class="ref-edu-card__title-line">望んだ将来を</span><span class="ref-edu-card__title-line">実現させる</span></h3>
                    <picture class="ref-picture ref-edu-card__media" data-asset-slot="education-4" data-figma-pc="21378:7889" data-figma-sp="21376:4741"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/education-4-21376-4741.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/education-4-21378-7889.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                    <ul>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>４年間の学びを進路につなげる</span></li>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>経験を社会で発揮する</span></li>
                                                    <li><img class="ref-svg-icon ref-edu-card__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>自分らしい未来を見つける</span></li>
                                            </ul>
                </article>
                                    </div>
    </div>
</section>
<section class="ref-shared-cta" data-section="shared-cta" data-figma-pc="21378:7867" data-figma-sp="21376:4719">
    <div class="ref-shared-cta__inner">
        <h2><span class="ref-shared-cta__line">千葉経済大学を</span><span class="ref-shared-cta__line">もっと知ろう！</span></h2>
        <div class="ref-shared-cta__actions">
            <a href="#" class="ref-action ref-action--blue" data-link-status="UNRESOLVED"><img class="ref-svg-icon ref-action__icon" src="<?php echo esc_url( $lp_base . 'image/icons/document.svg' ); ?>" alt="" aria-hidden="true"><span>資料請求</span></a>
            <a href="#" class="ref-action ref-action--purple" data-link-status="UNRESOLVED"><img class="ref-svg-icon ref-action__icon" src="<?php echo esc_url( $lp_base . 'image/icons/open-campus.svg' ); ?>" alt="" aria-hidden="true"><span>オープンキャンパス</span></a>
        </div>
    </div>
</section>
<section class="ref-voice" data-section="student-voice" data-figma-pc="21378:7766" data-figma-sp="21376:4650">
  <header class="ref-voice__head"><span class="ref-kicker"># STUDENTS_VOICE</span><h2 class="ref-bracket-title">私が千葉経済大学を<strong>選んだ理由</strong></h2></header>
      <article class="ref-voice-item ref-voice-item--open" data-voice-item="1">
      <div class="ref-content">
        <div class="ref-voice-item__top">
                      <picture class="ref-picture ref-avatar" data-asset-slot="voice-1-avatar" data-figma-pc="21378:7857" data-figma-sp="21376:4709"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/student-voice-01-21376-4709.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-1-avatar-21378-7857.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                    <div class="ref-speech"><h3>まだやりたいことが決まっていなくても大丈夫だった。</h3><p>経営学部ITコース3年 Mさん<br>千葉県立生浜高等学校出身</p></div>
        </div>
                <div id="ref-voice-detail-1" class="ref-voice-disclosure">
          <div class="ref-voice-disclosure__inner">
            <div class="ref-voice-open__detail">
                              <picture class="ref-picture ref-voice-open__photo" data-asset-slot="voice-1-detail" data-figma-pc="21378:7849" data-figma-sp="21376:4701"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/voice-1-detail-21376-4701.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-1-detail-21378-7849.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                            <div class="ref-voice-open__copy">
                <p>千葉経済大学のオープンキャンパスでは、多様なコースから自分の将来が広がると分かったことが決め手です！</p>
                <div class="ref-pointbox"><p><strong>印象に残った授業</strong>フィールドワークの授業が本当に楽しい！</p><p><strong>入学の決め手</strong>少人数授業で先生との距離が近いこと</p></div>
              </div>
            </div>
            <div class="ref-voice-open__advice"><strong>受験生へのひとこと</strong><span>目標が決まっている人もまだ迷っている人も、ぜひ一度オープンキャンパスに参加してみてください。
実際に大学の雰囲気を感じることで、自分に合った学びがきっと見つかると思います。</span></div>
          </div>
        </div>
      </div>
    </article>
      <article class="ref-voice-item ref-voice-item--collapsed" data-voice-item="2">
      <div class="ref-content">
        <div class="ref-voice-item__top">
                      <picture class="ref-picture ref-avatar" data-asset-slot="voice-2-avatar" data-figma-pc="21378:7826" data-figma-sp="21376:4678"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/student-voice-02-21376-4678.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-2-avatar-21378-7826.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                    <div class="ref-speech"><h3>将来の仕事が、大学生活の中で見えてきました。</h3><p>経営学部ITコース3年 Mさん<br>千葉県立生浜高等学校出身</p></div>
        </div>
                  <button type="button" class="ref-voice-more ref-voice-toggle" aria-expanded="false" aria-controls="ref-voice-detail-2"><span class="ref-voice-toggle__mark" aria-hidden="true">＋</span><span>もっと見る</span></button>
                <div id="ref-voice-detail-2" class="ref-voice-disclosure" aria-hidden="true">
          <div class="ref-voice-disclosure__inner">
            <div class="ref-voice-open__detail">
                              <picture class="ref-picture ref-voice-open__photo" data-asset-slot="voice-1-detail" data-figma-pc="21378:7849" data-figma-sp="21376:4701"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/voice-1-detail-21376-4701.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-1-detail-21378-7849.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                            <div class="ref-voice-open__copy">
                <p>少人数の授業で先生に相談しやすく、授業やゼミを通して自分の得意なことが少しずつ見えてきました。</p>
                <div class="ref-pointbox"><p><strong>印象に残った授業</strong>グループワークで企画を形にしていく授業</p><p><strong>入学の決め手</strong>先生や先輩に相談しやすい学びの環境</p></div>
              </div>
            </div>
            <div class="ref-voice-open__advice"><strong>受験生へのひとこと</strong><span>進路に迷っていても、実際に授業や学生の雰囲気を見るとイメージが変わります。気軽にオープンキャンパスで確かめてみてください。</span></div>
          </div>
        </div>
      </div>
    </article>
      <article class="ref-voice-item ref-voice-item--collapsed" data-voice-item="3">
      <div class="ref-content">
        <div class="ref-voice-item__top">
                      <picture class="ref-picture ref-avatar" data-asset-slot="voice-3-avatar" data-figma-pc="21378:7795" data-figma-sp="21376:4663"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/student-voice-04-21376-4663.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-3-avatar-21378-7795.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                    <div class="ref-speech"><h3>学芸員になる夢を、安心して目指せると思った。</h3><p>経営学部学芸員コース3年 Mさん<br>千葉県立生浜高等学校出身</p></div>
        </div>
                  <button type="button" class="ref-voice-more ref-voice-toggle" aria-expanded="false" aria-controls="ref-voice-detail-3"><span class="ref-voice-toggle__mark" aria-hidden="true">＋</span><span>もっと見る</span></button>
                <div id="ref-voice-detail-3" class="ref-voice-disclosure" aria-hidden="true">
          <div class="ref-voice-disclosure__inner">
            <div class="ref-voice-open__detail">
                              <picture class="ref-picture ref-voice-open__photo" data-asset-slot="voice-1-detail" data-figma-pc="21378:7849" data-figma-sp="21376:4701"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/voice-1-detail-21376-4701.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-1-detail-21378-7849.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                            <div class="ref-voice-open__copy">
                <p>学芸員資格をめざせることに加えて、経済や経営も一緒に学べるので、将来の選択肢を広げられると感じました。</p>
                <div class="ref-pointbox"><p><strong>印象に残った授業</strong>博物館や地域文化を調べる実践的な授業</p><p><strong>入学の決め手</strong>資格取得と専門分野の学びを両立できること</p></div>
              </div>
            </div>
            <div class="ref-voice-open__advice"><strong>受験生へのひとこと</strong><span>やりたいことが決まっている人も、まだ探している人も大丈夫です。気になる分野を実際に見て、自分らしい進路を見つけてください。</span></div>
          </div>
        </div>
      </div>
    </article>
  </section>
<section class="ref-messages" data-section="messages" data-figma-pc="21378:7746" data-figma-sp="21376:4629">
    <header class="ref-messages__head">
        <span class="ref-kicker"># MESSAGES</span>
        <h2><span>力をつけ活躍する</span><strong>先輩たち</strong></h2>
    </header>
    <div class="swiper ref-messages__swiper" data-ref-messages-swiper>
        <div class="swiper-wrapper">
                                            <div class="swiper-slide ref-messages__slide" data-message-slide="1">
                    <div class="ref-content ref-messages__body">
                        <div class="ref-messages__copy">
                            <p class="ref-messages__quote ref-messages__quote--pc"><span>大学で培った企画力を武器に、</span><span>今はIT企業のマーケターとして挑戦の毎日です！</span></p>
                            <p class="ref-messages__quote ref-messages__quote--sp"><span>大学で培った企画力を武器に、</span><span>今はIT企業のマーケターとして</span><span>挑戦の毎日です！</span></p>
                            <p class="ref-messages__profile">経営学科ビジネス経営コース3年 Tさん<br>千葉県立生浜高等学校出身</p>
                        </div>
                                                    <picture class="ref-picture ref-messages__photo ref-messages__photo--slide" data-asset-slot="messages-photo" data-figma-pc="21378:7760" data-figma-sp="21376:4643"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/messages-photo-21376-4643.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/messages-photo-21378-7760.webp' ); ?>" alt="" loading="eager" decoding="async"></picture>                                            </div>
                </div>
                                            <div class="swiper-slide ref-messages__slide" data-message-slide="2">
                    <div class="ref-content ref-messages__body">
                        <div class="ref-messages__copy">
                            <p class="ref-messages__quote ref-messages__quote--pc"><span>ゼミで身につけた行動力を活かして、</span><span>地域と企業をつなぐ仕事に挑戦しています！</span></p>
                            <p class="ref-messages__quote ref-messages__quote--sp"><span>ゼミで身につけた行動力を活かして、</span><span>地域と企業をつなぐ仕事に</span><span>挑戦しています！</span></p>
                            <p class="ref-messages__profile">経済学科地域経済コース4年 Aさん<br>千葉県立千葉商業高等学校出身</p>
                        </div>
                                                    <picture class="ref-picture ref-messages__photo ref-messages__photo--slide" data-asset-slot="reason-1" data-figma-pc="21378:8002" data-figma-sp="21376:4855"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-1-21376-4855.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-1-21378-8002.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                                            </div>
                </div>
                                            <div class="swiper-slide ref-messages__slide" data-message-slide="3">
                    <div class="ref-content ref-messages__body">
                        <div class="ref-messages__copy">
                            <p class="ref-messages__quote ref-messages__quote--pc"><span>数字と向き合う力が自信になり、</span><span>会計の知識を活かせる進路が見えてきました！</span></p>
                            <p class="ref-messages__quote ref-messages__quote--sp"><span>数字と向き合う力が自信になり、</span><span>会計の知識を活かせる進路が</span><span>見えてきました！</span></p>
                            <p class="ref-messages__profile">経営学科会計コース4年 Kさん<br>千葉県立幕張総合高等学校出身</p>
                        </div>
                                                    <picture class="ref-picture ref-messages__photo ref-messages__photo--slide" data-asset-slot="reason-2" data-figma-pc="21378:8010" data-figma-sp="21376:4864"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-2-21376-4864.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-2-21378-8010.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                                            </div>
                </div>
                                            <div class="swiper-slide ref-messages__slide" data-message-slide="4">
                    <div class="ref-content ref-messages__body">
                        <div class="ref-messages__copy">
                            <p class="ref-messages__quote ref-messages__quote--pc"><span>先生や仲間と考え抜いた経験を糧に、</span><span>自分らしい働き方を目指しています！</span></p>
                            <p class="ref-messages__quote ref-messages__quote--sp"><span>先生や仲間と考え抜いた経験を糧に、</span><span>自分らしい働き方を</span><span>目指しています！</span></p>
                            <p class="ref-messages__profile">経営学科ビジネス経営コース4年 Sさん<br>千葉県立検見川高等学校出身</p>
                        </div>
                                                    <picture class="ref-picture ref-messages__photo ref-messages__photo--slide" data-asset-slot="reason-3" data-figma-pc="21378:8018" data-figma-sp="21376:4872"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-3-21376-4872.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-3-21378-8018.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>                                            </div>
                </div>
                    </div>
        <div class="ref-messages__indicator">
            <button type="button" class="ref-messages__nav ref-messages__prev" aria-label="前のメッセージ"><img class="ref-svg-icon ref-messages__arrow" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-left.svg' ); ?>" alt="" aria-hidden="true"></button>
            <span data-ref-message-current>1</span><span class="ref-messages__bar" style="--ref-message-progress:25%"></span><span>4</span>
            <button type="button" class="ref-messages__nav ref-messages__next" aria-label="次のメッセージ"><img class="ref-svg-icon ref-messages__arrow" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true"></button>
        </div>
    </div>
</section>
<section class="ref-shared-cta" data-section="shared-cta" data-figma-pc="21378:7730" data-figma-sp="21376:4628">
    <div class="ref-shared-cta__inner">
        <h2><span class="ref-shared-cta__line">千葉経済大学を</span><span class="ref-shared-cta__line">もっと知ろう！</span></h2>
        <div class="ref-shared-cta__actions">
            <a href="#" class="ref-action ref-action--blue" data-link-status="UNRESOLVED"><img class="ref-svg-icon ref-action__icon" src="<?php echo esc_url( $lp_base . 'image/icons/document.svg' ); ?>" alt="" aria-hidden="true"><span>資料請求</span></a>
            <a href="#" class="ref-action ref-action--purple" data-link-status="UNRESOLVED"><img class="ref-svg-icon ref-action__icon" src="<?php echo esc_url( $lp_base . 'image/icons/open-campus.svg' ); ?>" alt="" aria-hidden="true"><span>オープンキャンパス</span></a>
        </div>
    </div>
</section>
<section class="ref-courses" data-section="courses" data-figma-pc="21378:7505" data-figma-sp="21376:4403"><div class="ref-content"><header class="ref-courses__head"><span class="ref-kicker"># COURCES</span><h2 class="ref-bracket-title"><span class="ref-courses__title-line ref-courses__title-line--lead">未来につながる</span><span class="ref-courses__title-line ref-courses__title-line--courses"><strong>７</strong>つのコース</span></h2></header><div class="ref-courses__grid"><article class="ref-course" style="--course:#fabf12"><div class="ref-course__icon"><picture><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . '' ); ?>"><img class="ref-svg-icon ref-course__icon-svg" src="<?php echo esc_url( $lp_base . 'image/icons/course-7.svg' ); ?>" alt="" aria-hidden="true"></picture></div><h3>公務員コース</h3><p class="ref-course__desc">国家公務員、地方公務員、公安職、公益法人などを目指すコース</p><div class="ref-course__rec"><span class="ref-course__rec-label"><span>こんな人にオススメ！</span><i class="ref-course__rec-tail-fill" aria-hidden="true"></i><i class="ref-course__rec-tail-line" aria-hidden="true"></i></span><ul><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>経済や地域の課題を解決し、安心して暮らせる街をつくりたい人</span></li><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>試験対策だけでなく実務で役立つ生きた経済の知識を身につけたい人</span></li></ul></div></article><article class="ref-course" style="--course:#f29800"><div class="ref-course__icon"><picture><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . '' ); ?>"><img class="ref-svg-icon ref-course__icon-svg" src="<?php echo esc_url( $lp_base . 'image/icons/course-6.svg' ); ?>" alt="" aria-hidden="true"></picture></div><h3>会計コース</h3><p class="ref-course__desc">税理士、公認会計士、その他経理部門などを目指すコース</p><div class="ref-course__rec"><span class="ref-course__rec-label"><span>こんな人にオススメ！</span><i class="ref-course__rec-tail-fill" aria-hidden="true"></i><i class="ref-course__rec-tail-line" aria-hidden="true"></i></span><ul><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>企業の「お金」のプロとして、専門資格を在学中に武器にしたい人</span></li><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>数字の強さを活かして、企業の経営を裏から支えたい人</span></li></ul></div></article><article class="ref-course" style="--course:#ed6c4e"><div class="ref-course__icon"><picture><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . '' ); ?>"><img class="ref-svg-icon ref-course__icon-svg" src="<?php echo esc_url( $lp_base . 'image/icons/course-5.svg' ); ?>" alt="" aria-hidden="true"></picture></div><h3>ビジネス経営コース</h3><p class="ref-course__desc">ビジネスパーソン、ビジネスリーダーを目指すコース</p><div class="ref-course__rec"><span class="ref-course__rec-label"><span>こんな人にオススメ！</span><i class="ref-course__rec-tail-fill" aria-hidden="true"></i><i class="ref-course__rec-tail-line" aria-hidden="true"></i></span><ul><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>自由なアイデアを形にして、起業やヒット商品開発に挑戦したい人</span></li><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>リーダーシップや、実践的なマーケティングを学びたい人</span></li></ul></div></article><article class="ref-course" style="--course:#df4473"><div class="ref-course__icon"><picture><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . '' ); ?>"><img class="ref-svg-icon ref-course__icon-svg" src="<?php echo esc_url( $lp_base . 'image/icons/course-4.svg' ); ?>" alt="" aria-hidden="true"></picture></div><h3>金融コース</h3><p class="ref-course__desc">銀行業界、証券業界などを目指すコース</p><div class="ref-course__rec"><span class="ref-course__rec-label"><span>こんな人にオススメ！</span><i class="ref-course__rec-tail-fill" aria-hidden="true"></i><i class="ref-course__rec-tail-line" aria-hidden="true"></i></span><ul><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>経済の仕組みを深く学び、人や企業の夢を「融資」で応援したい人</span></li><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>地元・千葉をはじめとする地域経済の活性化に貢献したい人</span></li></ul></div></article><article class="ref-course" style="--course:#00a5e3"><div class="ref-course__icon"><picture><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . '' ); ?>"><img class="ref-svg-icon ref-course__icon-svg" src="<?php echo esc_url( $lp_base . 'image/icons/course-3.svg' ); ?>" alt="" aria-hidden="true"></picture></div><h3>教職コース</h3><p class="ref-course__desc">中学（社会）・高校（公民）の免許取得、教員を目指すコース</p><div class="ref-course__rec"><span class="ref-course__rec-label"><span>こんな人にオススメ！</span><i class="ref-course__rec-tail-fill" aria-hidden="true"></i><i class="ref-course__rec-tail-line" aria-hidden="true"></i></span><ul><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>「社会や経済の面白さ」をわかりやすく伝えられる先生になりたい人</span></li><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>教職課程と経済の専門知識を両立させた視野を持つ教育者を目指す人</span></li></ul></div></article><article class="ref-course" style="--course:#28b6aa"><div class="ref-course__icon"><picture><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/icons/course-3.svg' ); ?>"><img class="ref-svg-icon ref-course__icon-svg" src="<?php echo esc_url( $lp_base . 'image/icons/course-2.svg' ); ?>" alt="" aria-hidden="true"></picture></div><h3>学芸員コース</h3><p class="ref-course__desc">学芸員資格の取得、関連する仕事を目指すコース</p><div class="ref-course__rec"><span class="ref-course__rec-label"><span>こんな人にオススメ！</span><i class="ref-course__rec-tail-fill" aria-hidden="true"></i><i class="ref-course__rec-tail-line" aria-hidden="true"></i></span><ul><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>歴史や文化の魅力を、展示や企画を通して多くの人に伝えたい人</span></li><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>経済の視点も持ち合わせた「文化の専門家」を目指したい人</span></li></ul></div></article><article class="ref-course" style="--course:#8cc66c"><div class="ref-course__icon"><picture><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . '' ); ?>"><img class="ref-svg-icon ref-course__icon-svg" src="<?php echo esc_url( $lp_base . 'image/icons/course-1.svg' ); ?>" alt="" aria-hidden="true"></picture></div><h3>ITコース</h3><p class="ref-course__desc">ITスキルを駆使するビジネスパーソンを目指すコース</p><div class="ref-course__rec"><span class="ref-course__rec-label"><span>こんな人にオススメ！</span><i class="ref-course__rec-tail-fill" aria-hidden="true"></i><i class="ref-course__rec-tail-line" aria-hidden="true"></i></span><ul><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>プログラミングだけでなく、AIやデータでビジネスを変革したい人</span></li><li><img class="ref-svg-icon ref-course__check" src="<?php echo esc_url( $lp_base . 'image/icons/check.svg' ); ?>" alt="" aria-hidden="true"><span>ITの最先端技術×経済の知識で、DX時代に最適な人材になりたい人</span></li></ul></div></article></div></div></section>
<section class="ref-links" data-section="links" data-figma-pc="21378:7458" data-figma-sp="21376:4919">
    <div class="ref-links__grid">
        <a href="#" class="ref-link-tile ref-link-tile--campus" style="--tile-bg:#eee7ff;--tile-shadow:#8473aa;--tile-accent:#8473aa" data-link-status="UNRESOLVED">
            <span class="ref-link-tile__shadow" aria-hidden="true"></span>
            <span class="ref-link-tile__face">
                <span class="ref-link-tile__copy">キャンパス紹介</span>
                <span class="ref-link-tile__arrow"><img class="ref-svg-icon " src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true"></span>
            </span>
        </a>
        <a href="#" class="ref-link-tile ref-link-tile--numbers" style="--tile-bg:#ffebd1;--tile-shadow:#f5971a;--tile-accent:#f5971a" data-link-status="UNRESOLVED">
            <span class="ref-link-tile__shadow" aria-hidden="true"></span>
            <span class="ref-link-tile__face">
                <span class="ref-link-tile__copy"><small class="ref-link-tile__numbers-kicker">数字で見る</small>千葉経済大学</span>
                <span class="ref-link-tile__arrow"><img class="ref-svg-icon " src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true"></span>
            </span>
        </a>
        <a href="#" class="ref-link-tile ref-link-tile--instagram" style="--tile-bg:#ffdbe0;--tile-accent:#8473aa" data-link-status="UNRESOLVED">
            <span class="ref-link-tile__shadow" aria-hidden="true"></span>
            <span class="ref-link-tile__face">
                <span class="ref-link-tile__instagram-copy"><span class="ref-link-tile__instagram-title">Official Instagram</span><small><img class="ref-svg-icon ref-link-tile__instagram-icon" src="<?php echo esc_url( $lp_base . 'image/icons/instagram-outline.svg' ); ?>" alt="" aria-hidden="true"><span>ckckoho</span></small></span>
                <span class="ref-link-tile__arrow"><img class="ref-svg-icon " src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true"></span>
            </span>
        </a>
        <a href="#" class="ref-link-tile ref-link-tile--line" style="--tile-bg:#eafff3;--tile-shadow:#06c755;--tile-accent:#06c755" data-link-status="UNRESOLVED">
            <span class="ref-link-tile__shadow" aria-hidden="true"></span>
            <span class="ref-link-tile__face">
                <span class="ref-link-tile__copy">LINE登録</span>
                <span class="ref-link-tile__arrow"><img class="ref-svg-icon " src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true"></span>
            </span>
        </a>
    </div>
</section>
<section class="ref-cta-value" data-section="cta-value" data-figma-pc="21378:7481" data-figma-sp="21376:4942">
    <div class="ref-cta-value__border" aria-hidden="true"></div>
    <picture class="ref-picture ref-portrait ref-portrait--left" data-asset-slot="cta-person-left" data-figma-pc="21378:7489" data-figma-sp="21376:4958"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/cta-person-left-21376-4958.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/cta-person-left-21378-7489.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>    <picture class="ref-picture ref-portrait ref-portrait--right" data-asset-slot="cta-person-right" data-figma-pc="21378:7485" data-figma-sp="21376:4962"><source media="(max-width:767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/cta-person-right-21376-4962.webp' ); ?>"><img src="<?php echo esc_url( $lp_base . 'image/photos/pc/cta-person-right-21378-7485.webp' ); ?>" alt="" loading="lazy" decoding="async"></picture>    <div class="ref-cta-value__inner">
        <h2><span>まずは大学を</span><span>体験してみよう！</span></h2>
        <div class="ref-cta-value__actions">
            <a href="#" class="ref-action ref-action--blue" data-link-status="UNRESOLVED"><img class="ref-svg-icon ref-action__icon" src="<?php echo esc_url( $lp_base . 'image/icons/document.svg' ); ?>" alt="" aria-hidden="true"><span>資料請求</span></a>
            <a href="#" class="ref-action ref-action--purple" data-link-status="UNRESOLVED"><img class="ref-svg-icon ref-action__icon" src="<?php echo esc_url( $lp_base . 'image/icons/open-campus.svg' ); ?>" alt="" aria-hidden="true"><span>オープンキャンパス</span></a>
        </div>
    </div>
</section>
</main>

<script src="<?php echo esc_url( $lp_base . 'js/ref001-interactions.js' ); ?>" defer></script>
<?php
get_footer();
