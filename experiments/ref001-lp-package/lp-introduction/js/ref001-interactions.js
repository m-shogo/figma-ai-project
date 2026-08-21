/**
 * 千葉経済大学 LP の動きをまとめたファイル。
 *
 * やっていることは3つだけです。
 *   1. STUDENTS VOICE の「もっと見る」開閉
 *   2. MESSAGES のスライダー（Swiper を CDN から読み込んで初期化）
 *   3. フッター右下の「ページ上部へ」ボタン
 *
 * 対応する HTML / CSS は
 *   lp-originalPage.php の各セクション
 *   lp/css/ref001.css の .p-voice / .p-messages / .p-footer ブロック
 * です。
 */
(() => {
	'use strict';

	const page = document.querySelector('.p-lp');
	if (!page) return;

	/** スライドの切り替え時間（CSS 側と揃えたいときはここ） */
	const TRANSITION_MS = 300;


	/* ----------------------------------------------------------------
	   1. STUDENTS VOICE — 「もっと見る」で詳細を開閉する
	   ---------------------------------------------------------------- */
	function initVoice() {
		const toggles = page.querySelectorAll('.p-voice__toggle');

		toggles.forEach((toggle) => {
			const detail = document.getElementById(toggle.getAttribute('aria-controls'));
			if (!detail) return;

			toggle.addEventListener('click', () => {
				const willOpen = toggle.getAttribute('aria-expanded') !== 'true';

				toggle.setAttribute('aria-expanded', String(willOpen));
				detail.hidden = !willOpen;
				toggle.closest('.p-voice__item')?.classList.toggle('is-open', willOpen);

				// ボタンの文言も状態に合わせる
				toggle.lastChild.textContent = willOpen ? '閉じる' : 'もっと見る';
			});
		});
	}


	/* ----------------------------------------------------------------
	   2. MESSAGES — スライダー

	   Swiper 本体はこのパッケージに同梱せず、CDN から読み込みます。
	   すでにテーマ側が Swiper を読み込んでいる場合は二重読み込みしません。
	   ---------------------------------------------------------------- */
	function loadSwiper() {
		if (window.Swiper) return Promise.resolve(window.Swiper);

		// Swiper の CSS は「vendor 層」として読み込みます。
		// 普通に <link> で読むと層の外になり、こちらの CSS より強くなって
		// .swiper-slide の display などを上書きできなくなるためです。
		if (!document.querySelector('style[data-lp-swiper]')) {
			const style = document.createElement('style');
			style.dataset.lpSwiper = 'true';
			style.textContent =
				"@import url('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css') layer(vendor);";
			document.head.append(style);
		}

		return new Promise((resolve, reject) => {
			const existing = document.querySelector('script[data-lp-swiper]');
			if (existing) {
				existing.addEventListener('load', () => resolve(window.Swiper), { once: true });
				existing.addEventListener('error', reject, { once: true });
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
			script.defer = true;
			script.dataset.lpSwiper = 'true';
			script.addEventListener('load', () => resolve(window.Swiper), { once: true });
			script.addEventListener('error', reject, { once: true });
			document.head.append(script);
		});
	}

	function initMessages() {
		const section = page.querySelector('.p-messages');
		if (!section) return;

		const slider = section.querySelector('[data-ref-messages-swiper]');
		if (!slider) return;

		const slides  = section.querySelectorAll('.p-messages__slide');
		const total   = slides.length;
		const current = section.querySelector('[data-ref-message-current]');
		const bar     = section.querySelector('.p-messages__counter-bar');
		const prev    = section.querySelector('.p-messages__arrow--prev');
		const next    = section.querySelector('.p-messages__arrow--next');

		if (!total) return;

		/** 「1 ── 4」の数字とバーを今のスライドに合わせる */
		const syncCounter = (index0) => {
			const shown = index0 + 1;
			if (current) current.textContent = String(shown);
			if (bar) bar.style.setProperty('--progress', `${(shown / total) * 100}%`);
		};

		loadSwiper()
			.then((Swiper) => {
				if (typeof Swiper !== 'function') throw new Error('Swiper unavailable');

				// 自動テスト中は自動再生を止めておく（キャプチャが安定するため）
				const isAutomated = navigator.webdriver === true;

				// loop ではなく rewind を使っています。
				// loop はスライドを複製して並べ替える仕組みで、
				// 枚数が少ないと内部状態が崩れて動かなくなることがあります。
				// rewind は最後まで行ったら先頭に戻るだけなので、
				// 見え方は同じまま、動きが安定します。
				new Swiper(slider, {
					rewind: true,
					speed: TRANSITION_MS,
					slidesPerView: 1,
					autoplay: isAutomated
						? false
						: { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true },
					navigation: { prevEl: prev, nextEl: next },
					on: {
						init:        (s) => syncCounter(s.activeIndex ?? 0),
						slideChange: (s) => syncCounter(s.activeIndex ?? 0),
					},
				});
			})
			.catch(() => {
				// CDN が読めなかったときも、矢印だけは動くようにしておく
				let active = 0;

				const show = (index) => {
					active = (index + total) % total;
					slides.forEach((slide, i) => { slide.hidden = i !== active; });
					syncCounter(active);
				};

				prev?.addEventListener('click', () => show(active - 1));
				next?.addEventListener('click', () => show(active + 1));
				show(0);
			});
	}


	/* ----------------------------------------------------------------
	   3. ページ上部へ戻るボタン
	   ---------------------------------------------------------------- */
	function initPageTop() {
		const button = document.querySelector('.p-footer__pagetop');
		if (!button) return;

		button.addEventListener('click', () => {
			const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
		});
	}


	initVoice();
	initMessages();
	initPageTop();
})();
