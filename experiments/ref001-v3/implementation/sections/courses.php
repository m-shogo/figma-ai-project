<?php
$d = v3_data()['courses'];
$courses = v3_courses();
$titleHtml = htmlspecialchars($d['titlePrefix'], ENT_QUOTES, 'UTF-8')
    . '<strong>' . htmlspecialchars($d['titleStrong'], ENT_QUOTES, 'UTF-8') . '</strong>'
    . htmlspecialchars($d['titleSuffix'], ENT_QUOTES, 'UTF-8');
?>
<section class="v3-courses" data-section="courses" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-content">
    <?php v3_component('section-heading', ['kicker' => $d['kicker'], 'titleHtml' => $titleHtml, 'modifier' => 'v3-heading--center']); ?>
    <div class="v3-courses__grid">
      <?php foreach ($courses as $course): ?>
        <article class="v3-course" style="--course:<?php v3_e($course['color']); ?>">
          <div class="v3-course__icon"><?php v3_icon($course['icon'], 'v3-course__icon-svg'); ?></div>
          <h3><?php v3_e($course['title']); ?></h3>
          <p class="v3-course__desc"><?php v3_e($course['description']); ?></p>
          <div class="v3-course__rec">
            <span class="v3-course__rec-label"><?php v3_e($d['recommendLabel']); ?></span>
            <ul>
              <?php foreach ($course['recommendations'] as $line): ?>
                <li><?php v3_icon('check', 'v3-course__check'); ?><span><?php v3_e($line); ?></span></li>
              <?php endforeach; ?>
            </ul>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>
