<?php
/**
 * Template Name: LP オリジナルページ
 *
 * 千葉経済大学 LP の固定ページテンプレート。
 *
 * ------------------------------------------------------------------
 * このファイルの構成
 * ------------------------------------------------------------------
 * 上から順に、画面の見た目どおりの並びでセクションが並んでいます。
 * 各セクションは下のようなコメントで区切ってあるので、直したい場所を
 * 見た目から探してそのまま編集できます。
 *
 *   <!-- ========== REASON ========== -->
 *
 * CSS は lp/css/ref001.css の同じ名前のブロックに入っています。
 * 例: このファイルの `p-reason` → CSS の `.p-reason { ... }` ブロック。
 * セクション名は重複しないので、CSS を検索すれば必ず1箇所に当たります。
 *
 * ------------------------------------------------------------------
 * 素材の場所
 * ------------------------------------------------------------------
 * すべてこのファイルと同じ階層の `lp/` フォルダにあります。
 *   lp/css/ref001.css              スタイル
 *   lp/js/ref001-interactions.js   アコーディオン / スライダー
 *   lp/image/icons/                アイコン(SVG)
 *   lp/image/mv/                   メインビジュアルのあしらい(SVG)
 *   lp/image/photos/pc/            写真(PC用)
 *   lp/image/photos/sp/            写真(SP用)
 *   lp/image/backgrounds/          背景写真
 *
 * ------------------------------------------------------------------
 * 独立LPとして作っています
 * ------------------------------------------------------------------
 * テーマの header.php / footer.php (サイト共通のナビ等) は読み込みません。
 * get_header() / get_footer() は使わず <!DOCTYPE html> から自前で書き、
 * WordPress が必要とする分だけ wp_head() / wp_footer() で出力します。
 *
 * CSS/JS は wp_enqueue_style() / wp_enqueue_script() をこの下で直接
 * 呼んでいます。add_action('wp_enqueue_scripts', ...) で登録すると
 * ページテンプレートが読まれる頃にはフックが終わっていて発火せず、
 * CSS が一切当たらなくなるため、あえて直接呼んでいます。
 *
 * ------------------------------------------------------------------
 * Student Voice / Swiper を ACF で編集できるようにしたいとき
 * ------------------------------------------------------------------
 * 下の STUDENTS VOICE セクションまるごとを
 *   <?php include __DIR__ . '/lp/acf-swap/student-voice-acf.php'; ?>
 * に、MESSAGES セクションまるごとを
 *   <?php include __DIR__ . '/lp/acf-swap/swiper-acf.php'; ?>
 * に差し替えてください。ACF が未設定でも同じ内容が表示されます。
 */

$lp_base = trailingslashit( get_stylesheet_directory_uri() ) . 'lp/';

wp_enqueue_style( 'ref001-lp-style', $lp_base . 'css/ref001.css', array(), null );
wp_enqueue_script( 'ref001-lp-script', $lp_base . 'js/ref001-interactions.js', array(), null, true );
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'p-lp' ); ?>>


<!-- ============================================================
     HEADER — ロゴ / 資料請求・オープンキャンパスボタン
     ============================================================ -->
<header class="p-header">
	<div class="p-header__inner l-container">

		<a class="p-header__logo" href="https://www.cku.ac.jp/">
			<img src="<?php echo esc_url( $lp_base . 'image/icons/university-logo-outlined.svg' ); ?>"
			     alt="千葉経済大学 CHIBA KEIZAI" width="240" height="61">
		</a>

		<nav class="p-header__actions" aria-label="関連リンク">
			<a class="c-btn c-btn--doc" href="https://www.cku.ac.jp/sys/seikyu/" target="_blank" rel="noopener">
				<img class="c-btn__icon" src="<?php echo esc_url( $lp_base . 'image/icons/document.svg' ); ?>" alt="" aria-hidden="true">
				<span>資料請求</span>
			</a>
			<a class="c-btn c-btn--oc" href="https://www.cku.ac.jp/admission/opencampus/" target="_blank" rel="noopener">
				<img class="c-btn__icon" src="<?php echo esc_url( $lp_base . 'image/icons/open-campus.svg' ); ?>" alt="" aria-hidden="true">
				<span>オープンキャンパス</span>
			</a>
		</nav>

	</div>
</header>


<main class="l-main">


<!-- ============================================================
     MV — メインビジュアル
     左右の写真とコピーを grid の同じマスに重ねています。
     高さは写真とコピーの背が高いほうで自然に決まります。
     ============================================================ -->
<section class="p-mv">

	<!-- 左右の人物写真。
	     PC は「左は上端 / 右は少し下げる」、SP は「1枚目を右上 / 2枚目を左下」に
	     振り分けます。並べ方は CSS 側（flex / grid）で指定しています。 -->
	<div class="p-mv__photos" aria-hidden="true">
		<picture class="p-mv__photo p-mv__photo--left">
			<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/main-visual-left-21376-4894.webp' ); ?>">
			<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/main-visual-left-21378-8041.webp' ); ?>" alt="" loading="eager" decoding="async">
		</picture>
		<picture class="p-mv__photo p-mv__photo--right">
			<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/main-visual-right-21376-4890.webp' ); ?>">
			<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/main-visual-right-21378-8036.webp' ); ?>" alt="" loading="eager" decoding="async">
		</picture>
	</div>

	<div class="p-mv__body">
		<h1 class="p-mv__catch">
			<span class="p-mv__catch-line p-mv__catch-line--lead">
				<span class="p-mv__quote">&ldquo;</span><strong>ケイザイ</strong><span class="p-mv__quote">&rdquo;</span>
			</span>
			<span class="p-mv__catch-line p-mv__catch-line--mid">って、想像以上に</span>
			<span class="p-mv__catch-line p-mv__catch-line--last">おもしろい。</span>
		</h1>
		<p class="p-mv__lead">
			７つのコース制で&ldquo;ミライ&rdquo;を見つけ、<br>
			資格取得支援で&ldquo;チカラ&rdquo;をつける。<br>
			千葉の経済と就職に強い学びがここにある。
		</p>
	</div>

	<!-- OPEN CAMPUS バッジ。
	     写真の上に重ねて下へはみ出す「あしらい」なので、ここは absolute です。 -->
	<a class="p-mv__oc" href="https://www.cku.ac.jp/admission/opencampus/" target="_blank" rel="noopener">
		<span class="p-mv__oc-balloon">大学の雰囲気を体験！</span>
		<span class="p-mv__oc-title">OPEN<br>CAMPUS</span>
		<span class="p-mv__oc-note">開催中！</span>
		<span class="p-mv__oc-arrow" aria-hidden="true">
			<img src="<?php echo esc_url( $lp_base . 'image/icons/ref001-mv-arrow-black.svg' ); ?>" alt="">
		</span>
	</a>

</section>


<!-- ============================================================
     REASON — 千葉経済大学が選ばれる理由
     ============================================================ -->
<section class="p-reason">
	<div class="l-container">

		<header class="p-reason__head">
			<span class="c-kicker"># REASON</span>
			<h2 class="c-heading"><span class="c-heading__text">千葉経済大学が<strong>選ばれる理由</strong></span></h2>
			<p class="p-reason__lead">学生一人ひとりに寄り添う教育と、地域に根ざした実践的な学びで、将来につながる力を育みます。</p>
		</header>

		<ul class="p-reason__list">

			<li class="p-reason__card">
				<picture class="p-reason__photo">
					<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-1-21376-4855.webp' ); ?>">
					<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-1-21378-8002.webp' ); ?>" alt="" loading="lazy" decoding="async">
				</picture>
				<div class="p-reason__body">
					<h3 class="p-reason__title">少人数教育</h3>
					<p class="p-reason__text">一人ひとりに目が届く少人数教育。質問や相談もしやすい環境です。</p>
				</div>
			</li>

			<li class="p-reason__card">
				<picture class="p-reason__photo">
					<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-2-21376-4864.webp' ); ?>">
					<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-2-21378-8010.webp' ); ?>" alt="" loading="lazy" decoding="async">
				</picture>
				<div class="p-reason__body">
					<h3 class="p-reason__title">キャリア支援</h3>
					<p class="p-reason__text">手厚い個別支援と企業連携より、希望進路の実現をサポートします。</p>
				</div>
			</li>

			<li class="p-reason__card">
				<picture class="p-reason__photo">
					<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-3-21376-4872.webp' ); ?>">
					<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-3-21378-8018.webp' ); ?>" alt="" loading="lazy" decoding="async">
				</picture>
				<div class="p-reason__body">
					<h3 class="p-reason__title">地域連携・インターンシップ</h3>
					<p class="p-reason__text">地域企業・自治体との実践的な学びで、社会で活きる力を養います。</p>
				</div>
			</li>

		</ul>

	</div>
</section>


<!-- ============================================================
     EDUCATION — ４年間の学び
     ============================================================ -->
<section class="p-education">
	<div class="l-container">

		<header class="p-education__head">
			<div class="p-education__title">
				<span class="c-kicker"># EDUCATION</span>
				<h2 class="p-education__heading">４年間の学び</h2>
			</div>
			<div class="p-education__intro">
				<h3 class="p-education__intro-title">将来、これから探しても大丈夫</h3>
				<p class="p-education__intro-text">千葉経済大学では、経済や経営を学びながら、世の中の仕組みを知り、自分の興味や可能性を見つけていきます。</p>
			</div>
		</header>

		<ol class="p-education__list">

			<li class="p-education__step">
				<p class="p-education__badge"><span class="p-education__badge-no">01</span>スタート</p>
				<h3 class="p-education__step-title">大学1年生の自分</h3>
				<picture class="p-education__photo">
					<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/education-1-21376-4835.webp' ); ?>">
					<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/education-1-21378-7980.webp' ); ?>" alt="" loading="lazy" decoding="async">
				</picture>
				<ul class="c-checklist">
					<li>経済学と経営学の基礎を学ぶ</li>
					<li>７つのコースで目標を明確にする</li>
					<li>コミュニケーションスキルを伸ばす</li>
				</ul>
			</li>

			<li class="p-education__step">
				<p class="p-education__badge"><span class="p-education__badge-no">02</span>拡大する</p>
				<h3 class="p-education__step-title">可能性を模索する自分</h3>
				<picture class="p-education__photo">
					<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/education-2-21376-4801.webp' ); ?>">
					<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/education-2-21378-7946.webp' ); ?>" alt="" loading="lazy" decoding="async">
				</picture>
				<ul class="c-checklist">
					<li>ゼミナールで専門分野を探求する</li>
					<li>資格を取得して得意を増やす</li>
					<li>教養科目で知識の幅を広げる</li>
				</ul>
			</li>

			<li class="p-education__step">
				<p class="p-education__badge"><span class="p-education__badge-no">03</span>展開する</p>
				<h3 class="p-education__step-title">社会を意識する自分</h3>
				<picture class="p-education__photo">
					<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/education-3-21376-4769.webp' ); ?>">
					<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/education-3-21378-7917.webp' ); ?>" alt="" loading="lazy" decoding="async">
				</picture>
				<ul class="c-checklist">
					<li>就業体験で働くことの解像度を上げる</li>
					<li>キャリア支援で自己理解を深める</li>
					<li>教職員と相談しながら進路を考える（定める）</li>
				</ul>
			</li>

			<li class="p-education__step">
				<p class="p-education__badge"><span class="p-education__badge-no">04</span>確信する</p>
				<h3 class="p-education__step-title">望んだ将来を実現させる自分</h3>
				<picture class="p-education__photo">
					<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/education-4-21376-4741.webp' ); ?>">
					<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/education-4-21378-7889.webp' ); ?>" alt="" loading="lazy" decoding="async">
				</picture>
				<ul class="c-checklist">
					<li>４年間の学びを進路につなげる</li>
					<li>経験を社会で発揮する</li>
					<li>自分らしい未来を見つける</li>
				</ul>
			</li>

		</ol>

	</div>
</section>


<!-- ============================================================
     CTA — 千葉経済大学をもっと知ろう！（1回目）
     同じものがこの下の MESSAGES の後にもう1回出てきます。
     見た目を変えるときは CSS の .p-cta を直せば両方変わります。
     ============================================================ -->
<section class="p-cta">
	<div class="p-cta__inner l-container">
		<h2 class="p-cta__title">千葉経済大学をもっと知ろう！</h2>
		<div class="p-cta__actions">
			<a class="c-btn c-btn--doc" href="https://www.cku.ac.jp/sys/seikyu/" target="_blank" rel="noopener">
				<img class="c-btn__icon" src="<?php echo esc_url( $lp_base . 'image/icons/document-blue.svg' ); ?>" alt="" aria-hidden="true">
				<span>資料請求</span>
			</a>
			<a class="c-btn c-btn--oc" href="https://www.cku.ac.jp/admission/opencampus/" target="_blank" rel="noopener">
				<img class="c-btn__icon" src="<?php echo esc_url( $lp_base . 'image/icons/open-campus-purple.svg' ); ?>" alt="" aria-hidden="true">
				<span>オープンキャンパス</span>
			</a>
		</div>
	</div>
</section>


<!-- ============================================================
     STUDENTS VOICE — 私が千葉経済大学を選んだ理由
     1件目だけ開いた状態、2件目以降は「もっと見る」で開きます。
     開閉は lp/js/ref001-interactions.js が担当しています。

     ACF化するときは、この <section> まるごとを
       <?php include __DIR__ . '/lp/acf-swap/student-voice-acf.php'; ?>
     に差し替えてください。
     ============================================================ -->
<section class="p-voice">

	<header class="p-voice__head l-container">
		<span class="c-kicker"># STUDENTS_VOICE</span>
		<h2 class="c-heading"><span class="c-heading__text">私が千葉経済大学を<strong>選んだ理由</strong></span></h2>
	</header>

	<article class="p-voice__item is-open">
		<div class="p-voice__inner l-container">

			<div class="p-voice__profile">
				<picture class="p-voice__avatar">
					<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/student-voice-01-21376-4709.webp' ); ?>">
					<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-1-avatar-21378-7857.webp' ); ?>" alt="" loading="lazy" decoding="async">
				</picture>
				<div class="p-voice__balloon">
					<h3 class="p-voice__title">まだやりたいことが決まっていなくても大丈夫だった。</h3>
					<p class="p-voice__meta">経営学部ITコース3年 Mさん<br>千葉県立生浜高等学校出身</p>
				</div>
			</div>

			<div class="p-voice__detail" id="voice-detail-1">
				<div class="p-voice__detail-main">
					<picture class="p-voice__photo">
						<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/voice-1-detail-21376-4701.webp' ); ?>">
						<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-1-detail-21378-7849.webp' ); ?>" alt="" loading="lazy" decoding="async">
					</picture>
					<div class="p-voice__detail-body">
						<p class="p-voice__detail-text">千葉経済大学のオープンキャンパスでは、多様なコースから自分の将来が広がると分かったことが決め手です！</p>
						<dl class="p-voice__points">
							<dt>印象に残った授業</dt>
							<dd>フィールドワークの授業が本当に楽しい！</dd>
							<dt>入学の決め手</dt>
							<dd>少人数授業で先生との距離が近いこと</dd>
						</dl>
					</div>
				</div>
				<div class="p-voice__advice">
					<p class="p-voice__advice-label">受験生へのひとこと</p>
					<p class="p-voice__advice-text">目標が決まっている人もまだ迷っている人も、ぜひ一度オープンキャンパスに参加してみてください。実際に大学の雰囲気を感じることで、自分に合った学びがきっと見つかると思います。</p>
				</div>
			</div>

		</div>
	</article>

	<article class="p-voice__item">
		<div class="p-voice__inner l-container">

			<div class="p-voice__profile">
				<picture class="p-voice__avatar">
					<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/student-voice-02-21376-4678.webp' ); ?>">
					<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-2-avatar-21378-7826.webp' ); ?>" alt="" loading="lazy" decoding="async">
				</picture>
				<div class="p-voice__balloon">
					<h3 class="p-voice__title">将来の仕事が、大学生活の中で見えてきました。</h3>
					<p class="p-voice__meta">経営学部ITコース3年 Mさん<br>千葉県立生浜高等学校出身</p>
				</div>
			</div>

			<button class="p-voice__toggle" type="button" aria-expanded="false" aria-controls="voice-detail-2">
				<span class="p-voice__toggle-mark" aria-hidden="true"></span>もっと見る
			</button>

			<div class="p-voice__detail" id="voice-detail-2" hidden>
				<div class="p-voice__detail-main">
					<picture class="p-voice__photo">
						<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/voice-1-detail-21376-4701.webp' ); ?>">
						<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-1-detail-21378-7849.webp' ); ?>" alt="" loading="lazy" decoding="async">
					</picture>
					<div class="p-voice__detail-body">
						<p class="p-voice__detail-text">少人数の授業で先生に相談しやすく、授業やゼミを通して自分の得意なことが少しずつ見えてきました。</p>
						<dl class="p-voice__points">
							<dt>印象に残った授業</dt>
							<dd>グループワークで企画を形にしていく授業</dd>
							<dt>入学の決め手</dt>
							<dd>先生や先輩に相談しやすい学びの環境</dd>
						</dl>
					</div>
				</div>
				<div class="p-voice__advice">
					<p class="p-voice__advice-label">受験生へのひとこと</p>
					<p class="p-voice__advice-text">進路に迷っていても、実際に授業や学生の雰囲気を見るとイメージが変わります。気軽にオープンキャンパスで確かめてみてください。</p>
				</div>
			</div>

		</div>
	</article>

	<article class="p-voice__item">
		<div class="p-voice__inner l-container">

			<div class="p-voice__profile">
				<picture class="p-voice__avatar">
					<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/student-voice-04-21376-4663.webp' ); ?>">
					<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-3-avatar-21378-7795.webp' ); ?>" alt="" loading="lazy" decoding="async">
				</picture>
				<div class="p-voice__balloon">
					<h3 class="p-voice__title">学芸員になる夢を、安心して目指せると思った。</h3>
					<p class="p-voice__meta">経営学部学芸員コース3年 Mさん<br>千葉県立生浜高等学校出身</p>
				</div>
			</div>

			<button class="p-voice__toggle" type="button" aria-expanded="false" aria-controls="voice-detail-3">
				<span class="p-voice__toggle-mark" aria-hidden="true"></span>もっと見る
			</button>

			<div class="p-voice__detail" id="voice-detail-3" hidden>
				<div class="p-voice__detail-main">
					<picture class="p-voice__photo">
						<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/voice-1-detail-21376-4701.webp' ); ?>">
						<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/voice-1-detail-21378-7849.webp' ); ?>" alt="" loading="lazy" decoding="async">
					</picture>
					<div class="p-voice__detail-body">
						<p class="p-voice__detail-text">学芸員資格をめざせることに加えて、経済や経営も一緒に学べるので、将来の選択肢を広げられると感じました。</p>
						<dl class="p-voice__points">
							<dt>印象に残った授業</dt>
							<dd>博物館や地域文化を調べる実践的な授業</dd>
							<dt>入学の決め手</dt>
							<dd>資格取得と専門分野の学びを両立できること</dd>
						</dl>
					</div>
				</div>
				<div class="p-voice__advice">
					<p class="p-voice__advice-label">受験生へのひとこと</p>
					<p class="p-voice__advice-text">やりたいことが決まっている人も、まだ探している人も大丈夫です。気になる分野を実際に見て、自分らしい進路を見つけてください。</p>
				</div>
			</div>

		</div>
	</article>

</section>


<!-- ============================================================
     MESSAGES — 力をつけ活躍する先輩たち（スライダー）
     Swiper は lp/js/ref001-interactions.js が CDN から読み込んで
     初期化します。矢印とカウンターはテンプレート側の持ち物です。

     ACF化するときは、この <section> まるごとを
       <?php include __DIR__ . '/lp/acf-swap/swiper-acf.php'; ?>
     に差し替えてください。
     ============================================================ -->
<section class="p-messages">
	<div class="l-container">

		<header class="p-messages__head">
			<span class="c-kicker"># MESSAGES</span>
			<h2 class="p-messages__heading">力をつけ活躍する<strong>先輩たち</strong></h2>
		</header>

		<div class="p-messages__slider swiper" data-ref-messages-swiper>
			<div class="swiper-wrapper">

				<div class="swiper-slide p-messages__slide">
					<picture class="p-messages__photo">
						<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/messages-photo-21376-4643.webp' ); ?>">
						<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/messages-photo-21378-7760.webp' ); ?>" alt="" loading="lazy" decoding="async">
					</picture>
					<div class="p-messages__body">
						<p class="p-messages__quote">
							<span>大学で培った企画力を武器に、</span>
							<span>今はIT企業のマーケターとして挑戦の毎日です！</span>
						</p>
						<p class="p-messages__meta">経営学科ビジネス経営コース3年 Tさん<br>千葉県立生浜高等学校出身</p>
					</div>
				</div>

				<div class="swiper-slide p-messages__slide">
					<picture class="p-messages__photo">
						<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-1-21376-4855.webp' ); ?>">
						<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-1-21378-8002.webp' ); ?>" alt="" loading="lazy" decoding="async">
					</picture>
					<div class="p-messages__body">
						<p class="p-messages__quote">
							<span>ゼミで身につけた行動力を活かして、</span>
							<span>地域と企業をつなぐ仕事に挑戦しています！</span>
						</p>
						<p class="p-messages__meta">経済学科地域経済コース4年 Aさん<br>千葉県立千葉商業高等学校出身</p>
					</div>
				</div>

				<div class="swiper-slide p-messages__slide">
					<picture class="p-messages__photo">
						<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-2-21376-4864.webp' ); ?>">
						<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-2-21378-8010.webp' ); ?>" alt="" loading="lazy" decoding="async">
					</picture>
					<div class="p-messages__body">
						<p class="p-messages__quote">
							<span>数字と向き合う力が自信になり、</span>
							<span>会計の知識を活かせる進路が見えてきました！</span>
						</p>
						<p class="p-messages__meta">経営学科会計コース4年 Kさん<br>千葉県立幕張総合高等学校出身</p>
					</div>
				</div>

				<div class="swiper-slide p-messages__slide">
					<picture class="p-messages__photo">
						<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/reason-3-21376-4872.webp' ); ?>">
						<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/reason-3-21378-8018.webp' ); ?>" alt="" loading="lazy" decoding="async">
					</picture>
					<div class="p-messages__body">
						<p class="p-messages__quote">
							<span>先生や仲間と考え抜いた経験を糧に、</span>
							<span>自分らしい働き方を目指しています！</span>
						</p>
						<p class="p-messages__meta">経営学科ビジネス経営コース4年 Sさん<br>千葉県立検見川高等学校出身</p>
					</div>
				</div>

			</div>

			<div class="p-messages__nav">
				<button class="p-messages__arrow p-messages__arrow--prev" type="button" aria-label="前のメッセージ">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/arrow-left.svg' ); ?>" alt="" aria-hidden="true">
				</button>
				<p class="p-messages__counter">
					<span data-ref-message-current>1</span>
					<span class="p-messages__counter-bar" aria-hidden="true"></span>
					<span>4</span>
				</p>
				<button class="p-messages__arrow p-messages__arrow--next" type="button" aria-label="次のメッセージ">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">
				</button>
			</div>
		</div>

	</div>
</section>


<!-- ============================================================
     CTA — 千葉経済大学をもっと知ろう！（2回目・上と同じ内容）
     ============================================================ -->
<section class="p-cta">
	<div class="p-cta__inner l-container">
		<h2 class="p-cta__title">千葉経済大学をもっと知ろう！</h2>
		<div class="p-cta__actions">
			<a class="c-btn c-btn--doc" href="https://www.cku.ac.jp/sys/seikyu/" target="_blank" rel="noopener">
				<img class="c-btn__icon" src="<?php echo esc_url( $lp_base . 'image/icons/document-blue.svg' ); ?>" alt="" aria-hidden="true">
				<span>資料請求</span>
			</a>
			<a class="c-btn c-btn--oc" href="https://www.cku.ac.jp/admission/opencampus/" target="_blank" rel="noopener">
				<img class="c-btn__icon" src="<?php echo esc_url( $lp_base . 'image/icons/open-campus-purple.svg' ); ?>" alt="" aria-hidden="true">
				<span>オープンキャンパス</span>
			</a>
		</div>
	</div>
</section>


<!-- ============================================================
     COURSES — 未来につながる７つのコース
     カードの色は各 <li> の style="--course: #xxxxxx" で決めています。
     色を変えたいときはその1箇所だけ直してください。
     ============================================================ -->
<section class="p-courses">
	<div class="l-container">

		<header class="p-courses__head">
			<span class="c-kicker"># COURSES</span>
			<h2 class="c-heading"><span class="c-heading__text">未来につながる<strong>７つのコース</strong></span></h2>
		</header>

		<ul class="p-courses__list">

			<li class="p-courses__card" style="--course: #fabf12">
				<p class="p-courses__icon">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/course-7.svg' ); ?>" alt="" aria-hidden="true">
				</p>
				<div class="p-courses__body">
					<h3 class="p-courses__title">公務員コース</h3>
					<p class="p-courses__text">国家公務員、地方公務員、公安職、公益法人などを目指すコース</p>
				</div>
				<div class="p-courses__rec">
					<p class="p-courses__rec-label">こんな人にオススメ！</p>
					<ul class="c-checklist c-checklist--pink">
						<li>経済や地域の課題を解決し、安心して暮らせる街をつくりたい人</li>
						<li>試験対策だけでなく実務で役立つ生きた経済の知識を身につけたい人</li>
					</ul>
				</div>
			</li>

			<li class="p-courses__card" style="--course: #f29800">
				<p class="p-courses__icon">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/course-6.svg' ); ?>" alt="" aria-hidden="true">
				</p>
				<div class="p-courses__body">
					<h3 class="p-courses__title">会計コース</h3>
					<p class="p-courses__text">税理士、公認会計士、その他経理部門などを目指すコース</p>
				</div>
				<div class="p-courses__rec">
					<p class="p-courses__rec-label">こんな人にオススメ！</p>
					<ul class="c-checklist c-checklist--pink">
						<li>企業の「お金」のプロとして、専門資格を在学中に武器にしたい人</li>
						<li>数字の強さを活かして、企業の経営を裏から支えたい人</li>
					</ul>
				</div>
			</li>

			<li class="p-courses__card" style="--course: #ed6c4e">
				<p class="p-courses__icon">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/course-5.svg' ); ?>" alt="" aria-hidden="true">
				</p>
				<div class="p-courses__body">
					<h3 class="p-courses__title">ビジネス経営コース</h3>
					<p class="p-courses__text">ビジネスパーソン、ビジネスリーダーを目指すコース</p>
				</div>
				<div class="p-courses__rec">
					<p class="p-courses__rec-label">こんな人にオススメ！</p>
					<ul class="c-checklist c-checklist--pink">
						<li>自由なアイデアを形にして、起業やヒット商品開発に挑戦したい人</li>
						<li>リーダーシップや、実践的なマーケティングを学びたい人</li>
					</ul>
				</div>
			</li>

			<li class="p-courses__card" style="--course: #df4473">
				<p class="p-courses__icon">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/course-4.svg' ); ?>" alt="" aria-hidden="true">
				</p>
				<div class="p-courses__body">
					<h3 class="p-courses__title">金融コース</h3>
					<p class="p-courses__text">銀行業界、証券業界などを目指すコース</p>
				</div>
				<div class="p-courses__rec">
					<p class="p-courses__rec-label">こんな人にオススメ！</p>
					<ul class="c-checklist c-checklist--pink">
						<li>経済の仕組みを深く学び、人や企業の夢を「融資」で応援したい人</li>
						<li>地元・千葉をはじめとする地域経済の活性化に貢献したい人</li>
					</ul>
				</div>
			</li>

			<li class="p-courses__card" style="--course: #00a5e3">
				<p class="p-courses__icon">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/course-3.svg' ); ?>" alt="" aria-hidden="true">
				</p>
				<div class="p-courses__body">
					<h3 class="p-courses__title">教職コース</h3>
					<p class="p-courses__text">中学（社会）・高校（公民）の免許取得、教員を目指すコース</p>
				</div>
				<div class="p-courses__rec">
					<p class="p-courses__rec-label">こんな人にオススメ！</p>
					<ul class="c-checklist c-checklist--pink">
						<li>「社会や経済の面白さ」をわかりやすく伝えられる先生になりたい人</li>
						<li>教職課程と経済の専門知識を両立させた視野を持つ教育者を目指す人</li>
					</ul>
				</div>
			</li>

			<li class="p-courses__card" style="--course: #28b6aa">
				<p class="p-courses__icon">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/course-2.svg' ); ?>" alt="" aria-hidden="true">
				</p>
				<div class="p-courses__body">
					<h3 class="p-courses__title">学芸員コース</h3>
					<p class="p-courses__text">学芸員資格の取得、関連する仕事を目指すコース</p>
				</div>
				<div class="p-courses__rec">
					<p class="p-courses__rec-label">こんな人にオススメ！</p>
					<ul class="c-checklist c-checklist--pink">
						<li>歴史や文化の魅力を、展示や企画を通して多くの人に伝えたい人</li>
						<li>経済の視点も持ち合わせた「文化の専門家」を目指したい人</li>
					</ul>
				</div>
			</li>

			<li class="p-courses__card" style="--course: #8cc66c">
				<p class="p-courses__icon">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/course-1.svg' ); ?>" alt="" aria-hidden="true">
				</p>
				<div class="p-courses__body">
					<h3 class="p-courses__title">ITコース</h3>
					<p class="p-courses__text">ITスキルを駆使するビジネスパーソンを目指すコース</p>
				</div>
				<div class="p-courses__rec">
					<p class="p-courses__rec-label">こんな人にオススメ！</p>
					<ul class="c-checklist c-checklist--pink">
						<li>プログラミングだけでなく、AIやデータでビジネスを変革したい人</li>
						<li>ITの最先端技術×経済の知識で、DX時代に最適な人材になりたい人</li>
					</ul>
				</div>
			</li>

		</ul>

	</div>
</section>


<!-- ============================================================
     LINKS — 丸いリンクボタン4つ
     色は各 <li> の style="--tile-bg / --tile-accent" で決めています。
     ============================================================ -->
<section class="p-links">
	<div class="l-container">
		<ul class="p-links__list">

			<li class="p-links__item" style="--tile-bg: #eee7ff; --tile-accent: #8473aa">
				<a class="p-links__tile" href="https://www.cku.ac.jp/campuslife/facilities/" target="_blank" rel="noopener">
					<span class="p-links__label">キャンパス紹介</span>
					<img class="p-links__arrow" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">
				</a>
			</li>

			<li class="p-links__item" style="--tile-bg: #ffebd1; --tile-accent: #f5971a">
				<a class="p-links__tile" href="https://www.cku.ac.jp/" target="_blank" rel="noopener">
					<span class="p-links__label"><small>数字で見る</small>千葉経済大学</span>
					<img class="p-links__arrow" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">
				</a>
			</li>

			<li class="p-links__item" style="--tile-bg: #ffdbe0; --tile-accent: #8473aa">
				<a class="p-links__tile" href="https://www.instagram.com/chibakeizai_university/" target="_blank" rel="noopener">
					<span class="p-links__label p-links__label--en">
						Official Instagram
						<small>
							<img src="<?php echo esc_url( $lp_base . 'image/icons/instagram-outline.svg' ); ?>" alt="" aria-hidden="true">ckckoho
						</small>
					</span>
					<img class="p-links__arrow" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">
				</a>
			</li>

			<li class="p-links__item" style="--tile-bg: #eafff3; --tile-accent: #06c755">
				<a class="p-links__tile" href="https://lin.ee/slXdqYb" target="_blank" rel="noopener">
					<span class="p-links__label">LINE登録</span>
					<img class="p-links__arrow" src="<?php echo esc_url( $lp_base . 'image/icons/arrow-right.svg' ); ?>" alt="" aria-hidden="true">
				</a>
			</li>

		</ul>
	</div>
</section>


<!-- ============================================================
     INVITE — まずは大学を体験してみよう！
     左右の写真と中央のコピーを grid の同じマスに重ねています。
     ============================================================ -->
<section class="p-invite">

	<div class="p-invite__photos" aria-hidden="true">
		<picture class="p-invite__photo">
			<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/cta-person-left-21376-4958.webp' ); ?>">
			<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/cta-person-left-21378-7489.webp' ); ?>" alt="" loading="lazy" decoding="async">
		</picture>
		<picture class="p-invite__photo">
			<source media="(max-width: 767px)" srcset="<?php echo esc_url( $lp_base . 'image/photos/sp/cta-person-right-21376-4962.webp' ); ?>">
			<img src="<?php echo esc_url( $lp_base . 'image/photos/pc/cta-person-right-21378-7485.webp' ); ?>" alt="" loading="lazy" decoding="async">
		</picture>
	</div>

	<div class="p-invite__body">
		<h2 class="p-invite__title">まずは大学を<br>体験してみよう！</h2>
		<div class="p-invite__actions">
			<a class="c-btn c-btn--doc" href="https://www.cku.ac.jp/sys/seikyu/" target="_blank" rel="noopener">
				<img class="c-btn__icon" src="<?php echo esc_url( $lp_base . 'image/icons/document-blue.svg' ); ?>" alt="" aria-hidden="true">
				<span>資料請求</span>
			</a>
			<a class="c-btn c-btn--oc" href="https://www.cku.ac.jp/admission/opencampus/" target="_blank" rel="noopener">
				<img class="c-btn__icon" src="<?php echo esc_url( $lp_base . 'image/icons/open-campus-purple.svg' ); ?>" alt="" aria-hidden="true">
				<span>オープンキャンパス</span>
			</a>
		</div>
	</div>

</section>


</main>


<!-- ============================================================
     FOOTER — ロゴ / 住所 / 関連サイト / SNS / コピーライト
     ============================================================ -->
<footer class="p-footer">
	<div class="p-footer__inner l-container">

		<div class="p-footer__profile">
			<img class="p-footer__logo" src="<?php echo esc_url( $lp_base . 'image/icons/university-logo-outlined.svg' ); ?>"
			     alt="千葉経済大学 CHIBA KEIZAI" width="240" height="61">
			<p class="p-footer__address">
				〒263-0021　千葉市稲毛区轟町3-59-5<br>
				Tel.043-253-9111（大代表）/ 043-253-5524（入試広報センター）
			</p>
		</div>

		<div class="p-footer__side">
			<nav class="p-footer__related" aria-label="関連サイト">
				<a href="https://www.cku.ac.jp/" target="_blank" rel="noopener">千葉経済大学公式サイト</a>
				<a href="https://www.chiba-kc.ac.jp/" target="_blank" rel="noopener">千葉経済短期大学公式サイト</a>
			</nav>
			<nav class="p-footer__sns" aria-label="公式SNS">
				<a href="https://www.facebook.com/chibakeizaiuniv/" target="_blank" rel="noopener" aria-label="Facebook">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/facebook-outline.svg' ); ?>" alt="" aria-hidden="true">
				</a>
				<a href="https://www.youtube.com/@chibakeizaiuniversity" target="_blank" rel="noopener" aria-label="YouTube">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/youtube-outline.svg' ); ?>" alt="" aria-hidden="true">
				</a>
				<a href="https://www.instagram.com/chibakeizai_university/" target="_blank" rel="noopener" aria-label="Instagram">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/instagram-outline.svg' ); ?>" alt="" aria-hidden="true">
				</a>
				<a href="https://lin.ee/slXdqYb" target="_blank" rel="noopener" aria-label="LINE">
					<img src="<?php echo esc_url( $lp_base . 'image/icons/line-outline.svg' ); ?>" alt="" aria-hidden="true">
				</a>
			</nav>
		</div>

		<p class="p-footer__copyright">Copyright CHIBA KEIZAI UNIVERSITY, All Rights Reserved</p>

	</div>

	<button class="p-footer__pagetop" type="button" aria-label="ページ上部へ">
		<img src="<?php echo esc_url( $lp_base . 'image/icons/footer-page-top.svg' ); ?>" alt="" aria-hidden="true">
	</button>
</footer>


<?php wp_footer(); ?>
</body>
</html>
