<?php
/**
 * 月刊「武道」号詳細。
 *
 * PUBLICATIONS_CPT_ARCHITECTURE.md の共通契約:
 * ① テンプレ頭 = 既存 ACF + タイトル + アイキャッチ + 固定CTA（空は出さない）
 * ② 本文 = Gutenberg / 既存 Parts（the_content）
 *
 * 最新号固定ページも ① の markup を共有できるよう、表示本体は template part に寄せる。
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

                <?php if (nbk_acf_value_present(get_post()->post_content)) : ?>
                    <div class="block-editor_wrap publication_budo-content">
                        <?php the_content(); ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
