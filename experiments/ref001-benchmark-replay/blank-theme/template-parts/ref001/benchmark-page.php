<?php
/**
 * REF-001 clean replay implementation owner.
 *
 * First Pass authority: sanitized benchmark contract + current live Figma only.
 * No historical REF implementation is referenced by this template.
 */

declare(strict_types=1);

$reasons = [
    [
        'title' => (string) ref001_benchmark_field('reason_1_title', '少人数教育'),
        'body' => (string) ref001_benchmark_field('reason_1_body', '一人ひとりに目が届く少人数教育。質問や相談もしやすい環境です。'),
        'image' => 'reason_1_image',
    ],
    [
        'title' => (string) ref001_benchmark_field('reason_2_title', '充実のキャリア支援'),
        'body' => (string) ref001_benchmark_field('reason_2_body', 'キャリア支援と企業連携により、希望進路の実現をサポートします。'),
        'image' => 'reason_2_image',
    ],
    [
        'title' => (string) ref001_benchmark_field('reason_3_title', '地域連携・インターンシップ'),
        'body' => (string) ref001_benchmark_field('reason_3_body', '地域企業・自治体との実践的な学びで、社会で活きる力を養います。'),
        'image' => 'reason_3_image',
    ],
];

$education = [
    [
        'step' => '01',
        'phase' => 'スタート',
        'title' => (string) ref001_benchmark_field('education_1_title', '大学1年生の自分'),
        'image' => 'education_1_image',
        'items' => ref001_benchmark_lines('education_1_items', ['将来がまだ見えない', '学科選択制度で基礎を学ぶ', '７つのコースで目標を明確に', '資格取得支援でスキルを発見']),
    ],
    [
        'step' => '02',
        'phase' => '学ぶ',
        'title' => (string) ref001_benchmark_field('education_2_title', '世の中の仕組みを知る'),
        'image' => 'education_2_image',
        'items' => ref001_benchmark_lines('education_2_items', ['ヒット商品の裏側', 'トクするお金のルール', 'AIで仕事はどうなる']),
    ],
    [
        'step' => '03',
        'phase' => '出会う',
        'title' => (string) ref001_benchmark_field('education_3_title', '先生と一緒に考える'),
        'image' => 'education_3_image',
        'items' => ref001_benchmark_lines('education_3_items', ['教職員との距離が近い', '悩みを相談しやすい', '個人に合わせた進路のサポート']),
    ],
    [
        'step' => '04',
        'phase' => 'ゴール',
        'title' => (string) ref001_benchmark_field('education_4_title', '望んだ将来を実現させる'),
        'image' => 'education_4_image',
        'items' => ref001_benchmark_lines('education_4_items', ['４年間の学びを進路につなげる', '経験を社会で発揮する', '自分らしい未来を見つける']),
    ],
];

$voices = [
    [
        'quote' => (string) ref001_benchmark_field('voice_1_quote', 'まだやりたいことが決まっていなくても大丈夫だった。'),
        'byline' => (string) ref001_benchmark_field('voice_1_byline', "経営学部ITコース3年  Mさん\n千葉県立生浜高等学校出身"),
        'portrait' => 'voice_1_portrait',
        'tone' => 'blue',
    ],
    [
        'quote' => (string) ref001_benchmark_field('voice_2_quote', '将来の仕事が、大学生活の中で見えてきました。'),
        'byline' => (string) ref001_benchmark_field('voice_2_byline', "経営学部ITコース3年  Mさん\n千葉県立生浜高等学校出身"),
        'portrait' => 'voice_2_portrait',
        'tone' => 'yellow',
    ],
    [
        'quote' => (string) ref001_benchmark_field('voice_3_quote', '学芸員になる夢を、安心して目指せると思った。'),
        'byline' => (string) ref001_benchmark_field('voice_3_byline', "経営学部学芸員コース3年  Mさん\n千葉県立生浜高等学校出身"),
        'portrait' => 'voice_3_portrait',
        'tone' => 'blue',
    ],
];

$courses = [
    ['slug' => 'civil', 'title' => '公務員コース', 'description' => '国家公務員、地方公務員、公安職、公益法人などを目指すコース', 'recommend' => ['経済や地域の課題を解決し、安心して暮らせる街をつくりたい人', '試験対策だけでなく実務で役立つ生きた経済の知識を身につけたい人']],
    ['slug' => 'accounting', 'title' => '会計コース', 'description' => '税理士、公認会計士、その他経理部門などを目指すコース', 'recommend' => ['企業の「お金」のプロとして、専門資格を在学中に武器にしたい人', '数字の強さを活かして、企業の経営を裏から支えたい人']],
    ['slug' => 'business', 'title' => 'ビジネス経営コース', 'description' => 'ビジネスパーソン、ビジネスリーダーを目指すコース', 'recommend' => ['自由なアイデアを形にして、起業やヒット商品開発に挑戦したい人', 'リーダーシップや、実践的なマーケティングを学びたい人']],
    ['slug' => 'finance', 'title' => '金融コース', 'description' => '銀行業界、証券業界などを目指すコース', 'recommend' => ['経済の仕組みを深く学び、人や企業の夢を「融資」で応援したい人', '地元・千葉をはじめとする地域経済の活性化に貢献したい人']],
    ['slug' => 'teaching', 'title' => '教職コース', 'description' => '中学（社会）・高校（公民）の免許取得、教員を目指すコース', 'recommend' => ['「社会や経済の面白さ」をわかりやすく伝えられる先生になりたい人', '教職課程と経済の専門知識を両立させた視野を持つ教育者を目指す人']],
    ['slug' => 'curator', 'title' => '学芸員コース', 'description' => '学芸員資格の取得、関連する仕事を目指すコース', 'recommend' => ['歴史や文化の魅力を、展示や企画を通して多くの人に伝えたい人', '経済の視点も持ち合わせた「文化の専門家」を目指したい人']],
    ['slug' => 'it', 'title' => 'ITコース', 'description' => 'ITスキルを駆使するビジネスパーソンを目指すコース', 'recommend' => ['プログラミングだけでなく、AIやデータでビジネスを変革したい人', 'ITの最先端技術×経済の知識で、DX時代に最適な人材になりたい人']],
];

foreach ($courses as $index => &$course) {
    $n = $index + 1;
    $course['title'] = (string) ref001_benchmark_field("course_{$n}_title", $course['title']);
    $course['description'] = (string) ref001_benchmark_field("course_{$n}_description", $course['description']);
    $course['recommend'][0] = (string) ref001_benchmark_field("course_{$n}_recommend_1", $course['recommend'][0]);
    $course['recommend'][1] = (string) ref001_benchmark_field("course_{$n}_recommend_2", $course['recommend'][1]);
}
unset($course);
?>

<article class="p-ref001" data-first-pass-authority="clean-replay">
    <header class="p-ref001-header" data-figma-pc-node="21378:8066" data-figma-sp-node="21376:4918">
        <div class="p-ref001-header__inner">
            <div class="c-ref001-logo" aria-label="千葉経済大学 CHIBA KEIZAI">
                <span class="c-ref001-logo__mark" aria-hidden="true">CK</span>
                <span class="c-ref001-logo__wordmark">千葉経済大学<small>CHIBA KEIZAI</small></span>
            </div>
            <div class="p-ref001-header__actions" aria-label="大学案内">
                <span class="c-ref001-button c-ref001-button--document">▣ <span>資料請求</span></span>
                <span class="c-ref001-button c-ref001-button--campus">⚑ <span>オープンキャンパス</span></span>
            </div>
        </div>
    </header>

    <section class="p-ref001-hero" aria-labelledby="ref001-hero-title" data-figma-pc-node="21378:8032" data-figma-sp-node="21376:4886">
        <div class="p-ref001-hero__art p-ref001-hero__art--left">
            <?= wp_kses_post(ref001_benchmark_image('hero_left_image', 'p-ref001-hero__media p-ref001-hero__media--left', '学生')); ?>
        </div>
        <div class="p-ref001-hero__copy">
            <h1 id="ref001-hero-title" class="p-ref001-hero__title">
                <span class="p-ref001-hero__keyword">“<b>ケイザイ</b>”</span>
                <span class="p-ref001-hero__middle">って、想像以上に</span>
                <span class="p-ref001-hero__large">おもしろい。</span>
            </h1>
            <p class="p-ref001-hero__lead"><?= nl2br(esc_html((string) ref001_benchmark_field('hero_lead', "７つのコース制で“ミライ”を見つけ、\n資格取得支援で“チカラ”をつける。\n千葉の経済と就職に強い学びがここにある。"))); ?></p>
        </div>
        <div class="p-ref001-hero__art p-ref001-hero__art--right">
            <?= wp_kses_post(ref001_benchmark_image('hero_right_image', 'p-ref001-hero__media p-ref001-hero__media--right', '学生')); ?>
            <div class="p-ref001-hero__oc" aria-label="オープンキャンパス開催中">
                <span class="p-ref001-hero__oc-note">大学の雰囲気を体験！</span>
                <strong>OPEN<br>CAMPUS</strong>
                <span>開催中！</span>
                <i aria-hidden="true">→</i>
            </div>
        </div>
    </section>

    <section class="p-ref001-section p-ref001-reason" aria-labelledby="reason-title" data-figma-pc-node="21378:7999" data-figma-sp-node="21376:4852">
        <div class="c-ref001-heading">
            <span class="c-ref001-heading__eyebrow"># REASON</span>
            <h2 id="reason-title"><span>千葉経済大学が</span><strong>選ばれる理由</strong></h2>
            <p><?= esc_html((string) ref001_benchmark_field('reason_intro', '学生一人ひとりに寄り添う教育と、地域に根ざした実践的な学びで、将来につながる力を育みます。')); ?></p>
        </div>
        <div class="p-ref001-reason__grid">
            <?php foreach ($reasons as $reason) : ?>
                <article class="p-ref001-reason__card">
                    <?= wp_kses_post(ref001_benchmark_image($reason['image'], 'p-ref001-reason__media', $reason['title'])); ?>
                    <div class="p-ref001-reason__body">
                        <h3><?= esc_html($reason['title']); ?></h3>
                        <p><?= esc_html($reason['body']); ?></p>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
    </section>

    <section class="p-ref001-section p-ref001-education" aria-labelledby="education-title" data-figma-pc-node="21378:7868" data-figma-sp-node="21376:4720">
        <div class="p-ref001-education__intro">
            <div class="c-ref001-heading c-ref001-heading--left">
                <span class="c-ref001-heading__eyebrow c-ref001-heading__eyebrow--white"># EDUCATION</span>
                <h2 id="education-title"><strong>４年間の学び</strong></h2>
            </div>
            <div class="p-ref001-education__lead">
                <h3><?= esc_html((string) ref001_benchmark_field('education_lead_title', '将来、これから探しても大丈夫')); ?></h3>
                <p><?= nl2br(esc_html((string) ref001_benchmark_field('education_lead_body', "千葉経済大学では、経済や経営を学びながら、\n世の中の仕組みを知り、自分の興味や可能性を見つけていきます。"))); ?></p>
            </div>
        </div>
        <ol class="p-ref001-education__steps">
            <?php foreach ($education as $index => $step) : ?>
                <li class="p-ref001-education__step">
                    <div class="p-ref001-education__badge"><strong><?= esc_html($step['step']); ?></strong><span>/</span><?= esc_html($step['phase']); ?></div>
                    <h3><?= esc_html($step['title']); ?></h3>
                    <?= wp_kses_post(ref001_benchmark_image($step['image'], 'p-ref001-education__media', $step['title'])); ?>
                    <ul>
                        <?php foreach ($step['items'] as $item) : ?><li><?= esc_html($item); ?></li><?php endforeach; ?>
                    </ul>
                    <?php if ($index < count($education) - 1) : ?><span class="p-ref001-education__arrow" aria-hidden="true">›</span><?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ol>
    </section>

    <section class="p-ref001-cta" aria-label="千葉経済大学をもっと知ろう" data-figma-pc-node="21378:7730" data-figma-sp-node="21376:4719">
        <?= wp_kses_post(ref001_benchmark_image('cta_background_image', 'p-ref001-cta__media', '千葉経済大学')); ?>
        <div class="p-ref001-cta__overlay"></div>
        <div class="p-ref001-cta__content">
            <h2>千葉経済大学をもっと知ろう！</h2>
            <div class="p-ref001-cta__actions">
                <span class="c-ref001-button c-ref001-button--light-document">▣ <span>資料請求</span></span>
                <span class="c-ref001-button c-ref001-button--light-campus">⚑ <span>オープンキャンパス</span></span>
            </div>
        </div>
    </section>

    <section class="p-ref001-section p-ref001-voices" aria-labelledby="voices-title" data-figma-pc-node="21378:7766" data-figma-sp-node="21376:4650">
        <div class="c-ref001-heading">
            <span class="c-ref001-heading__eyebrow"># STUDENTS_VOICE</span>
            <h2 id="voices-title"><span>私が千葉経済大学を</span><strong>選んだ理由</strong></h2>
        </div>
        <div class="p-ref001-voices__list">
            <?php foreach ($voices as $index => $voice) : ?>
                <article class="p-ref001-voice p-ref001-voice--<?= esc_attr($voice['tone']); ?> <?= $index === 0 ? 'p-ref001-voice--open' : ''; ?>">
                    <div class="p-ref001-voice__summary">
                        <?= wp_kses_post(ref001_benchmark_image($voice['portrait'], 'p-ref001-voice__portrait', '学生')); ?>
                        <div class="p-ref001-voice__bubble">
                            <h3><?= esc_html($voice['quote']); ?></h3>
                            <p><?= nl2br(esc_html($voice['byline'])); ?></p>
                        </div>
                    </div>
                    <?php if ($index === 0) : ?>
                        <div class="p-ref001-voice__detail">
                            <?= wp_kses_post(ref001_benchmark_image('voice_1_detail_image', 'p-ref001-voice__detail-media', '授業風景')); ?>
                            <div class="p-ref001-voice__detail-copy">
                                <p><?= esc_html((string) ref001_benchmark_field('voice_1_detail', '千葉経済大学のオープンキャンパスでは、多様なコースから自分の将来が広がると分かったことが決め手です！')); ?></p>
                                <dl>
                                    <div><dt>印象に残った授業</dt><dd><?= esc_html((string) ref001_benchmark_field('voice_1_class', 'フィールドワークの授業が本当に楽しい！')); ?></dd></div>
                                    <div><dt>入学の決め手</dt><dd><?= esc_html((string) ref001_benchmark_field('voice_1_reason', '少人数授業で先生との距離が近いこと')); ?></dd></div>
                                </dl>
                            </div>
                            <div class="p-ref001-voice__message">
                                <span>受験生へのひとこと</span>
                                <p><?= esc_html((string) ref001_benchmark_field('voice_1_message', '目標が決まっている人もまだ迷っている人も、ぜひ一度オープンキャンパスに参加してみてください。実際に大学の雰囲気を感じることで、自分に合った学びがきっと見つかると思います。')); ?></p>
                            </div>
                        </div>
                    <?php else : ?>
                        <div class="p-ref001-voice__more" aria-hidden="true"><span>＋</span>もっと見る</div>
                    <?php endif; ?>
                </article>
            <?php endforeach; ?>
        </div>
    </section>

    <section class="p-ref001-section p-ref001-messages" aria-labelledby="messages-title" data-figma-pc-node="21378:7746" data-figma-sp-node="21376:4629">
        <div class="p-ref001-messages__copy">
            <div class="c-ref001-heading c-ref001-heading--left">
                <span class="c-ref001-heading__eyebrow"># MESSAGES</span>
                <h2 id="messages-title"><span>力をつけ活躍する</span><strong>先輩たち</strong></h2>
            </div>
            <blockquote>
                <p><?= esc_html((string) ref001_benchmark_field('messages_quote', '大学で培った企画力を武器に、今はIT企業のマーケターとして挑戦の毎日です！')); ?></p>
            </blockquote>
            <p class="p-ref001-messages__byline"><?= nl2br(esc_html((string) ref001_benchmark_field('messages_byline', "経営学科ビジネス経営コース3年 Tさん\n千葉県立生浜高等学校出身"))); ?></p>
            <div class="p-ref001-messages__indicator" aria-hidden="true"><span>←</span><strong>1</strong><i></i><strong>4</strong><span>→</span></div>
        </div>
        <?= wp_kses_post(ref001_benchmark_image('messages_image', 'p-ref001-messages__media', '卒業生')); ?>
    </section>

    <section class="p-ref001-cta" aria-label="千葉経済大学をもっと知ろう" data-figma-pc-node="21378:7730" data-figma-sp-node="21376:4628">
        <?= wp_kses_post(ref001_benchmark_image('cta_background_image', 'p-ref001-cta__media', '千葉経済大学')); ?>
        <div class="p-ref001-cta__overlay"></div>
        <div class="p-ref001-cta__content">
            <h2>千葉経済大学をもっと知ろう！</h2>
            <div class="p-ref001-cta__actions">
                <span class="c-ref001-button c-ref001-button--light-document">▣ <span>資料請求</span></span>
                <span class="c-ref001-button c-ref001-button--light-campus">⚑ <span>オープンキャンパス</span></span>
            </div>
        </div>
    </section>

    <section class="p-ref001-section p-ref001-courses" aria-labelledby="courses-title" data-figma-pc-node="21378:7505" data-figma-sp-node="21376:4403">
        <div class="c-ref001-heading">
            <span class="c-ref001-heading__eyebrow"># COURCES</span>
            <h2 id="courses-title"><span>未来につながる</span><strong>７</strong><span>つのコース</span></h2>
        </div>
        <div class="p-ref001-courses__grid">
            <?php foreach ($courses as $index => $course) : ?>
                <article class="p-ref001-course p-ref001-course--<?= esc_attr($course['slug']); ?>">
                    <div class="p-ref001-course__icon" aria-hidden="true"><?= esc_html(str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT)); ?></div>
                    <div class="p-ref001-course__summary">
                        <h3><?= esc_html($course['title']); ?></h3>
                        <p><?= esc_html($course['description']); ?></p>
                    </div>
                    <div class="p-ref001-course__recommend">
                        <span>こんな人にオススメ！</span>
                        <ul><?php foreach ($course['recommend'] as $item) : ?><li><?= esc_html($item); ?></li><?php endforeach; ?></ul>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
    </section>

    <section class="p-ref001-links" aria-label="関連コンテンツ" data-figma-pc-node="21378:7458" data-figma-sp-node="21376:4919">
        <div class="p-ref001-links__grid">
            <div class="p-ref001-link-card p-ref001-link-card--campus"><span>キャンパス紹介</span><b aria-hidden="true">→</b></div>
            <div class="p-ref001-link-card p-ref001-link-card--numbers"><span><small>数字で見る</small>千葉経済大学</span><b aria-hidden="true">→</b></div>
            <div class="p-ref001-link-card p-ref001-link-card--instagram"><span><small>Official Instagram</small>◎ ckckoho</span><b aria-hidden="true">→</b></div>
            <div class="p-ref001-link-card p-ref001-link-card--line"><span>LINE登録</span><b aria-hidden="true">→</b></div>
        </div>
    </section>

    <section class="p-ref001-value" aria-labelledby="value-title" data-figma-pc-node="21378:7481" data-figma-sp-node="21376:4942">
        <div class="p-ref001-value__frame">
            <?= wp_kses_post(ref001_benchmark_image('value_left_image', 'p-ref001-value__person p-ref001-value__person--left', '学生')); ?>
            <div class="p-ref001-value__content">
                <h2 id="value-title">まずは大学を体験してみよう！</h2>
                <div class="p-ref001-value__actions">
                    <span class="c-ref001-button c-ref001-button--document">▣ <span>資料請求</span></span>
                    <span class="c-ref001-button c-ref001-button--campus">⚑ <span>オープンキャンパス</span></span>
                </div>
            </div>
            <?= wp_kses_post(ref001_benchmark_image('value_right_image', 'p-ref001-value__person p-ref001-value__person--right', '学生')); ?>
        </div>
    </section>

    <footer class="p-ref001-footer" data-figma-pc-node="21378:7457" data-figma-sp-node="21376:4402">
        <div class="p-ref001-footer__inner">
            <div class="p-ref001-footer__profile">
                <div class="c-ref001-logo c-ref001-logo--large" aria-label="千葉経済大学 CHIBA KEIZAI">
                    <span class="c-ref001-logo__mark" aria-hidden="true">CK</span>
                    <span class="c-ref001-logo__wordmark">千葉経済大学<small>CHIBA KEIZAI</small></span>
                </div>
                <p><?= nl2br(esc_html((string) ref001_benchmark_field('footer_address', "〒263-0021　千葉市稲毛区轟町3-59-5\nTel.043-253-9111（大代表）/043-253-5524（入試広報センター）"))); ?></p>
                <small>Copyright CHIBA KEIZAI UNIVERSITY, All Rights Reserved</small>
            </div>
            <div class="p-ref001-footer__links">
                <p>千葉経済大学公式サイト <span>/</span> 千葉経済短期大学公式サイト</p>
                <div class="p-ref001-footer__sns" aria-label="SNS"><span>f</span><span>▶</span><span>◎</span><span>LINE</span></div>
            </div>
        </div>
        <span class="p-ref001-footer__pagetop" aria-hidden="true">⌃</span>
    </footer>
</article>
