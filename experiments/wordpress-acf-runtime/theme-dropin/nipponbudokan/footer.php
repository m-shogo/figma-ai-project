</div><!-- /global_wrapper -->
<?php get_template_part('template-parts/_footer', null, array(
    'map' => is_front_page(),
)); ?>
<?php if (is_front_page()): ?>
    <nav class="top_purposeMenu" aria-label="目的から探す">
        <a class="tpm_link" href="#top_guide-01">
            <span class="tpm_label"><span class="tpm_listIcon" aria-hidden="true"></span><span>目的から探す</span></span>
            <span class="tpm_arrow" aria-hidden="true"></span>
        </a>
    </nav>
<?php endif; ?>
<?php wp_footer(); ?>
<?php
$bodyTag_before = get_field('bodyTag_before', 'option');
if ($bodyTag_before) {
    echo $bodyTag_before;
}
?>
</body>

</html>