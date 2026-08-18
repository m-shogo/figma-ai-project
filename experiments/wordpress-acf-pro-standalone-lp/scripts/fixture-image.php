<?php
declare(strict_types=1);

function standalone_lp_fixture_png_chunk(string $type, string $data): string
{
    return pack('N', strlen($data)) . $type . $data . pack('N', crc32($type . $data));
}

/** @return array{0:int,1:int} */
function standalone_lp_fixture_image_dimensions(string $seed): array
{
    $shapes = [
        [160, 90],  // landscape
        [90, 160],  // portrait
        [120, 120], // square
    ];
    $shape_index = hexdec(substr(md5($seed), 0, 2)) % count($shapes);
    return $shapes[$shape_index];
}

function standalone_lp_fixture_png_bytes(string $seed): string
{
    [$width, $height] = standalone_lp_fixture_image_dimensions($seed);
    $hash = hash('sha256', $seed, true);
    $red = 80 + (ord($hash[0]) % 150);
    $green = 80 + (ord($hash[1]) % 150);
    $blue = 80 + (ord($hash[2]) % 150);
    $pixel = chr($red) . chr($green) . chr($blue);
    $row = "\x00" . str_repeat($pixel, $width);
    $raw = str_repeat($row, $height);

    return "\x89PNG\r\n\x1a\n"
        . standalone_lp_fixture_png_chunk('IHDR', pack('NNCCCCC', $width, $height, 8, 2, 0, 0, 0))
        . standalone_lp_fixture_png_chunk('IDAT', gzcompress($raw, 9))
        . standalone_lp_fixture_png_chunk('IEND', '');
}
