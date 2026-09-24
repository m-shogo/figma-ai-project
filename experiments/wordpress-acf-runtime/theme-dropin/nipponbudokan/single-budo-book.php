<?php
/**
 * 月刊「武道」号詳細。
 *
 * PUBLICATIONS_CPT_ARCHITECTURE.md の共通契約:
 * ① テンプレ頭 = 既存 ACF + タイトル + アイキャッチ + 固定CTA（空は出さない）
 * ② 本文 = ACF のみ。投稿本文は出さない。
 * ③ バックナンバー = 表示中の号を除く最新5件
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <div class="global_inner _content publication_budo-shell publication_budo-shell--detail">
            <div class="gc_main _oneColumn">
                <?php get_template_part('template-parts/publications/_budo-detail', null, array('post_id' => get_the_ID())); ?>
                <div class="block-editor_wrap publication_budo-content">
                    <?php get_template_part('template-parts/publications/_budo-body', null, array('post_id' => get_the_ID())); ?>
                    <?php get_template_part('template-parts/publications/_budo-related', null, array('post_id' => get_the_ID())); ?>
                </div>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
