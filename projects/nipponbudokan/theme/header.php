<?php global $post; ?>
<!DOCTYPE html>
<html lang="ja" dir="ltr" itemscope itemtype="https://schema.org/WebSite">

<head prefix="og: https://ogp.me/ns#">
    <meta charset="utf-8">
    <?php
    $headTag_after = get_field('headTag_after', 'option');
    if ($headTag_after) {
        echo $headTag_after;
    }
    ?>
    <?php get_template_part('template-parts/_head_contents'); ?>
    <?php wp_head(); ?>
    <?php
    $headTag_before = get_field('headTag_before', 'option');
    if ($headTag_before) {
        echo $headTag_before;
    }
    ?>
</head>

<body itemscope itemtype="https://schema.org/WebPage"
    <?php echo (body_class()) ? body_class() : ''; ?>
    id="<?php echo isset($post) && $post ? esc_attr($post->post_name) : ''; ?>">
    <?php
    $bodyTag_after = get_field('bodyTag_after', 'option');
    if ($bodyTag_after) {
        echo $bodyTag_after;
    }
    ?>
    <?php get_template_part('template-parts/_header'); ?>
    <div class="global_wrapper">