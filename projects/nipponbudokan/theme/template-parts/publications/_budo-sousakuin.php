<?php
/**
 * バックナンバー一覧の総索引。Parts の core/details + 番号リスト + 注釈リスト + button_L。
 * ダウンロード URL は表示中の固定ページの ACF sousakuin。無いときはボタンを出さない。
 */
get_template_part('template-parts/publications/_budo-helpers');

$file_url = nbk_budo_page_sousakuin_url(get_queried_object_id());
?>
<div class="block-editor_wrap publication_budo-sousakuin">
    <details class="wp-block-details">
        <summary>月刊「武道」総索引</summary>
        <div class="publication_budo-sousakuinLead">
            <p>下記よりダウンロードしてご利用ください。</p>
            <?php if (nbk_acf_value_present($file_url)) : ?>
                <div class="wp-block-buttons">
                    <div class="wp-block-button">
                        <a class="wp-block-button__link wp-element-button" href="<?php echo esc_url($file_url); ?>"><span>月刊「武道」総索引<br class="publication_budo-sousakuinBr">ダウンロード</span></a>
                    </div>
                </div>
            <?php endif; ?>
        </div>
        <div class="publication_budo-sousakuinGuide">
            <h4>使い方</h4>
            <ol class="wp-block-list">
                <li>下部の「データベース」をクリックして、検索（Windows→Ctrl+F、Mac→command+F）で、目的の記事をお探しいただけます。</li>
                <li>文字サイズは6ptになっています。拡大表示してご利用ください。データ量が膨大であるため、文字サイズの変更には、パソコンの性能によって、長時間かかることやフリーズしてしまうことがあります。ご注意ください。</li>
                <li>プリントの際には、指定範囲の設定を忘れずに行ってください。すべてをプリントすると、500枚以上の出力になります。</li>
                <li>ファイル名にある数字は最終更新年月日になります。必ず最新のものをお使いください。</li>
                <li>誤植を発見した場合は、お手数ですが下記連絡先までご連絡ください。</li>
            </ol>
            <ul class="wp-block-list annotation-list">
                <li>「連載※」は毎回筆者の変わる連載を意味します。</li>
                <li>「筆者」には座談会や対談出席者も含まれます。</li>
                <li>タイトルや筆者名など、一部パソコンで表示されない文字（下の横線が長い「吉」や、中心の線が下に突き出た「角」など）が使用されている場合は、新字や似た字に置き換えています。</li>
            </ul>
        </div>
    </details>
</div>
