<?php
$steps = [
    ['01', 'スタート', '大学1年生の自分', ['将来がまだ見えない', '学科選択制度で基礎を学ぶ', '７つのコースで目標を明確に', '資格取得支援でスキルを発見'], 'education-1'],
    ['02', '学ぶ', '世の中の仕組みを知る', ['ヒット商品の裏側', 'トクするお金のルール', 'AIで仕事はどうなる'], 'education-2'],
    ['03', '出会う', ['先生と一緒に', '考える'], ['教職員との距離が近い', '悩みを相談しやすい', '個人に合わせた進路のサポート'], 'education-3'],
    ['04', 'ゴール', ['望んだ将来を', '実現させる'], ['４年間の学びを進路につなげる', '経験を社会で発揮する', '自分らしい未来を見つける'], 'education-4'],
];
?>
<section class="ref-education" data-section="education">
    <div class="ref-content">
        <div class="ref-education__head">
            <header class="ref-education__title">
                <span class="ref-kicker"># EDUCATION</span>
                <h2>４年間の学び</h2>
            </header>
            <div class="ref-education__intro">
                <h3>将来、これから探しても大丈夫</h3>
                <p><?php ref001_e(ref001_get('education_intro')); ?></p>
            </div>
        </div>

        <div class="ref-education__steps">
            <?php foreach ($steps as $index => $step): ?>
                <article class="ref-edu-card">
                    <div class="ref-edu-card__badge">
                        <span class="ref-edu-card__number"><?php ref001_e($step[0]); ?></span>
                        <small>/</small>
                        <span class="ref-edu-card__phase"><?php ref001_e($step[1]); ?></span>
                    </div>
                    <h3><?php if (is_array($step[2])) { foreach ($step[2] as $title_line) { echo '<span class="ref-edu-card__title-line">'; ref001_e($title_line); echo '</span>'; } } else { ref001_e($step[2]); } ?></h3>
                    <?php ref001_picture($step[4], 'ref-edu-card__media', ''); ?>
                    <ul>
                        <?php foreach ($step[3] as $li): ?>
                            <li><?php ref001_icon('check', 'ref-edu-card__check'); ?><span><?php ref001_e($li); ?></span></li>
                        <?php endforeach; ?>
                    </ul>
                </article>
                <?php if ($index < count($steps) - 1): ?>
                    <span class="ref-edu-flow-arrow" aria-hidden="true">
                        <?php ref001_icon('arrow-right', 'ref-edu-flow-arrow__glyph'); ?>
                        <?php ref001_icon('arrow-right', 'ref-edu-flow-arrow__glyph'); ?>
                    </span>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
    </div>
</section>
