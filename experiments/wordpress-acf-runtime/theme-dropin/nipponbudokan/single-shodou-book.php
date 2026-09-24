<?php
/**
 * 月刊書写書道 号詳細。
 *
 * 武道と同じ publication visual family を使い、データ field map だけを差し替える。
 * 表紙はアイキャッチ。topimage / toprensailist は TOP 専用のためここでは出力しない。
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <div class="global_inner _content publication_budo-shell publication_budo-shell--detail">
            <div class="gc_main _oneColumn">
                <?php
                get_template_part(
                    'template-parts/publications/_budo-detail',
                    null,
                    array(
                        'post_id' => get_the_ID(),
                        'config' => array(
                            'month_field' => 'shodou_month',
                            'size_field' => 'size',
                            'pages_field' => '',
                            'price_field' => 'price',
                            'subscription_field' => 'teiki',
                            'publication_label' => '月刊「書写書道」',
                            // 注文先は既存 authority で確定していないため推測しない。
                            'order_url' => '',
                        ),
                    )
                );
                ?>

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
