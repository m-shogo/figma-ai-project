<?php
if (!function_exists('nbk_acf_value_present')) {
  /**
   * 値が空なら出力しない。代替文言（非売品・データなし等）は出さない。
   */
  function nbk_acf_value_present($value)
  {
    if ($value === null || $value === false || $value === '') {
      return false;
    }
    if (is_array($value)) {
      foreach ($value as $item) {
        if (nbk_acf_value_present($item)) {
          return true;
        }
      }
      return false;
    }
    if (is_int($value) || is_float($value)) {
      return true;
    }
    return trim(wp_strip_all_tags((string) $value)) !== '';
  }
}
