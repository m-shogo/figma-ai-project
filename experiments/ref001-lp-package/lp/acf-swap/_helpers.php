<?php
/**
 * lp/acf-swap/ の共通ヘルパー関数。
 *
 * student-voice-acf.php / swiper-acf.php から require_once される。
 * lp-originalPage.php本体（直書き版）は依存しない -- ACF差し替えを使う時だけ読み込まれる。
 *
 * $lp_base は呼び出し元(lp-originalPage.php)が定義した
 *   trailingslashit(get_stylesheet_directory_uri()) . 'lp/'
 * をそのまま使う。呼び出し元で未定義の場合に備えてフォールバックも用意する。
 */

if (!isset($lp_base) || $lp_base === '') {
    $lp_base = function_exists('get_stylesheet_directory_uri')
        ? rtrim(get_stylesheet_directory_uri(), '/') . '/lp/'
        : 'lp/';
}

function ref001_lp_e($value): void
{
    echo htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/**
 * ACF PROのrepeaterから配列を読む。ACFが無効/未設定/0件の時は
 * $fixture_rows（固定文言のフォールバック）をそのまま返すので、
 * PHP warningも空セクションも発生しない。
 */
function ref001_lp_repeater_or_fixture(string $acf_field, array $sub_fields, array $fixture_rows): array
{
    if (function_exists('have_rows') && function_exists('the_row') && function_exists('get_sub_field')) {
        if (have_rows($acf_field)) {
            $rows = [];
            while (have_rows($acf_field)) {
                the_row();
                $row = [];
                foreach ($sub_fields as $key) {
                    $row[$key] = get_sub_field($key);
                }
                $rows[] = $row;
            }
            if (!empty($rows)) {
                return $rows;
            }
        }
    }

    return $fixture_rows;
}

/**
 * lp/image/photos/{pc,sp}/ 内の既知スロット名 -> ファイル名 対応表。
 * REF-001の元fixtureのFigma書き出しと同一ファイル（1バイトも変更なし）。
 */
function ref001_lp_photo_slot(string $slot): ?array
{
    $slots = [
        'reason-1'       => ['pc' => 'reason-1-21378-8002.webp',       'sp' => 'reason-1-21376-4855.webp'],
        'reason-2'       => ['pc' => 'reason-2-21378-8010.webp',       'sp' => 'reason-2-21376-4864.webp'],
        'reason-3'       => ['pc' => 'reason-3-21378-8018.webp',       'sp' => 'reason-3-21376-4872.webp'],
        'voice-1-avatar' => ['pc' => 'voice-1-avatar-21378-7857.webp', 'sp' => 'student-voice-01-21376-4709.webp'],
        'voice-1-detail' => ['pc' => 'voice-1-detail-21378-7849.webp', 'sp' => 'voice-1-detail-21376-4701.webp'],
        'voice-2-avatar' => ['pc' => 'voice-2-avatar-21378-7826.webp', 'sp' => 'student-voice-02-21376-4678.webp'],
        'voice-3-avatar' => ['pc' => 'voice-3-avatar-21378-7795.webp', 'sp' => 'student-voice-04-21376-4663.webp'],
        'messages-photo' => ['pc' => 'messages-photo-21378-7760.webp', 'sp' => 'messages-photo-21376-4643.webp'],
    ];

    return $slots[$slot] ?? null;
}

/**
 * 固定スロット画像（フォールバック用）の<picture>を出力する。
 */
function ref001_lp_picture_from_slot(string $lp_base, string $slot, string $class = '', string $alt = '', bool $eager = false): void
{
    $entry = ref001_lp_photo_slot($slot);
    if ($entry === null) {
        return;
    }

    ref001_lp_picture_urls(
        $lp_base . 'image/photos/pc/' . $entry['pc'],
        $lp_base . 'image/photos/sp/' . $entry['sp'],
        $class,
        $alt,
        $eager,
        $slot
    );
}

/**
 * ACF Image フィールド（1枚アップロード = PC/SP共通）の<picture>を出力する。
 */
function ref001_lp_picture_from_acf_image(?array $image, string $class = '', bool $eager = false): void
{
    if (empty($image['url'])) {
        return;
    }

    $url = (string) $image['url'];
    ref001_lp_picture_urls($url, $url, $class, (string) ($image['alt'] ?? ''), $eager, 'acf-image');
}

function ref001_lp_picture_urls(string $pc, string $sp, string $class, string $alt, bool $eager = false, string $slot = ''): void
{
    printf(
        '<picture class="ref-picture %s" data-asset-slot="%s">',
        htmlspecialchars($class, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($slot, ENT_QUOTES, 'UTF-8')
    );
    printf(
        '<source media="(max-width:767px)" srcset="%s">',
        htmlspecialchars($sp, ENT_QUOTES, 'UTF-8')
    );
    printf(
        '<img src="%s" alt="%s" loading="%s" decoding="async">',
        htmlspecialchars($pc, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($alt, ENT_QUOTES, 'UTF-8'),
        $eager ? 'eager' : 'lazy'
    );
    echo '</picture>';
}

function ref001_lp_icon(string $lp_base, string $key, string $class = ''): void
{
    printf(
        '<img class="ref-svg-icon %s" src="%simage/icons/%s.svg" alt="" aria-hidden="true">',
        htmlspecialchars($class, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($lp_base, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($key, ENT_QUOTES, 'UTF-8')
    );
}
