<?php
/**
 * 投稿タイプ: tankoubon（単行本）詳細。
 * 値は ACF とアイキャッチ。記事本文は出さない。
 */
get_template_part('template-parts/publications/_acf-has-value');

if (!function_exists('nbk_book_content_list_classes')) {
    /**
     * 単行本の内容だけ。
     * クラスの無い ul / ol に既存リストの class を足し、
     * 行頭が字下げの項目と、章見出しではない続きの項目を入れ子にする。
     */
    function nbk_book_content_list_classes($html)
    {
        $html = wp_kses_post($html);
        $document = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $loaded = $document->loadHTML('<?xml encoding="utf-8" ?><div id="nbk-book-content">' . $html . '</div>');
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        $root = $loaded ? $document->getElementById('nbk-book-content') : null;
        if (!$root) {
            return $html;
        }

        $lists = array();
        foreach (array('ul', 'ol') as $tag_name) {
            foreach ($root->getElementsByTagName($tag_name) as $list) {
                $lists[] = $list;
            }
        }
        foreach ($lists as $list) {
            $parent_name = strtolower($list->parentNode->nodeName);
            if ($parent_name === 'ul' || $parent_name === 'ol' || $parent_name === 'li') {
                continue;
            }
            if (trim($list->getAttribute('class')) !== '') {
                continue;
            }
            $list->parentNode->replaceChild(nbk_book_nest_list($document, $list), $list);
        }

        $markup = '';
        foreach ($root->childNodes as $node) {
            $markup .= $document->saveHTML($node);
        }
        return wp_kses_post($markup);
    }

    function nbk_book_li_inner_html($li)
    {
        $html = '';
        foreach ($li->childNodes as $child) {
            $html .= $li->ownerDocument->saveHTML($child);
        }
        return $html;
    }

    function nbk_book_append_html($element, $html)
    {
        $html = (string) $html;
        if ($html === '') {
            return;
        }
        $fragment = $element->ownerDocument->createDocumentFragment();
        if (@$fragment->appendXML($html)) {
            $element->appendChild($fragment);
            return;
        }
        $element->appendChild($element->ownerDocument->createTextNode(wp_strip_all_tags($html)));
    }

    function nbk_book_is_chapter_label($text)
    {
        return (bool) preg_match('/^(?:第[0-9０-９]+章|終[\s\x{3000}]*章)/u', $text);
    }

    function nbk_book_nest_list($document, $list)
    {
        $groups = array();
        $current = null;
        foreach (iterator_to_array($list->childNodes) as $child) {
            if (strtolower($child->nodeName) !== 'li') {
                continue;
            }
            $raw = nbk_book_li_inner_html($child);
            $label = preg_replace('/^(?:\s|&nbsp;|\x{3000}|&#12288;)+/u', '', $raw);
            $text = trim(html_entity_decode(wp_strip_all_tags($label), ENT_QUOTES, 'UTF-8'));
            if ($text === '') {
                $current = null;
                continue;
            }
            $indented = (bool) preg_match('/^(?:\s|&nbsp;|\x{3000}|&#12288;)/u', $raw);
            $is_child = $current !== null && ($indented || !nbk_book_is_chapter_label($text));
            if ($is_child) {
                $groups[$current]['children'][] = $label;
                continue;
            }
            $groups[] = array(
                'html' => $label,
                'children' => array(),
            );
            $current = count($groups) - 1;
        }

        $tag = strtolower($list->nodeName);
        $nested = $document->createElement($tag);
        $nested->setAttribute('class', 'wp-block-list');
        foreach ($groups as $group) {
            $item = $document->createElement('li');
            nbk_book_append_html($item, $group['html']);
            if ($group['children']) {
                $child_list = $document->createElement($tag);
                $child_list->setAttribute('class', 'wp-block-list');
                foreach ($group['children'] as $child_html) {
                    $child_item = $document->createElement('li');
                    nbk_book_append_html($child_item, $child_html);
                    $child_list->appendChild($child_item);
                }
                $item->appendChild($child_list);
            }
            $nested->appendChild($item);
        }
        return $nested;
    }
}

get_header();
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>

        <div class="global_inner _content publication_budo-shell publication_budo-shell--detail">
            <div class="gc_main _oneColumn">
                <?php while (have_posts()) : the_post(); ?>
                    <?php get_template_part('template-parts/publications/_book-detail', null, array('post_id' => get_the_ID())); ?>

                    <?php $book_content = get_field('book_content'); ?>
                    <?php if (nbk_acf_value_present($book_content)) : ?>
                        <div class="block-editor_wrap publication_book-content">
                            <h3 class="wp-block-heading">内容</h3>
                            <?php echo nbk_book_content_list_classes($book_content); ?>
                        </div>
                    <?php endif; ?>
                <?php endwhile; ?>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
