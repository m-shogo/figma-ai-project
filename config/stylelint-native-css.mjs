// Optional native CSS advisory starter. Adopt through the target project toolchain,
// not a global dependency or an automatic rewrite of the existing Theme.
// Rule names verified against Stylelint 17.16.0 documentation.
export default {
  ignoreFiles: ['**/reference/**', '**/vendor/**', '**/node_modules/**', '**/dist/**', '**/build/**', '**/generated/**', '**/*.min.css'],
  defaultSeverity: 'warning',
  rules: {
    'property-no-unknown': true,
    'custom-property-no-missing-var-function': true,
    'declaration-block-no-duplicate-properties': [true, { ignore: ['consecutive-duplicates-with-different-syntaxes'] }],
    'declaration-block-no-duplicate-custom-properties': true,
    'no-duplicate-selectors': true,
    'selector-no-unmatchable': true,
    'nesting-selector-no-missing-scoping-root': true,
    'no-descending-specificity': true,
    'max-nesting-depth': 3
  }
};
