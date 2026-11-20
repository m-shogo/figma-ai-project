<?php //使い方 $wordcount = 30; include locate_template( 'excerpt.php' ); ?>
<?php
$contentsIndex = "";
$wordcount = $wordcount > 0 ? $wordcount : 40;
$acfContents = ['module_title-text','module_text-col1','module_text-col2-01','module_text-col2-02','module_mix_text'];
?>
<?php if(have_rows('acf5-custom_field_editor')): ?>
	<?php while (have_rows('acf5-custom_field_editor')) : the_row(); ?>
		<?php foreach( $acfContents as $acfContent ): ?>
			<?php
			$subFieldContent = get_sub_field($acfContent);
			if ($subFieldContent) {
				$text = strip_tags($subFieldContent);
				$contentsIndex .= $text;
			}
			?>
		<?php endforeach; ?>
	<?php endwhile; ?>
	<?php
	$contents = mb_substr($contentsIndex, 0, $wordcount);
	echo str_replace(["\r\n", "\r", "\n"], '', $contents . (mb_strlen($contentsIndex) > $wordcount ? '…' : ''));
	?>
<?php endif; ?>