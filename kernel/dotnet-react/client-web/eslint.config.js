import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// UI-2: literal visual values are errors. Closed gaps from the adversarial review: modern CSS color functions
// (oklch/oklab/lab/lch/hwb/color), hex embedded in composite values (boxShadow/gradient/border shorthand) via an
// unanchored match, string-literal and kebab-case property keys (which esquery key.name selectors miss), and a
// broader named-color set. Template literals are matched too, and font weights are a closed set.
const NAMED_COLORS =
  'red|blue|green|black|white|gray|grey|yellow|orange|purple|pink|cyan|magenta|silver|gold|teal|navy|maroon|olive|lime|aqua|fuchsia|crimson|coral|indigo|salmon|tomato|turquoise|khaki|violet|chocolate|rebeccapurple|orchid|plum|tan|beige|ivory|azure|lavender|linen|salmon|sienna|wheat|snow|thistle|periwinkle|mint|slategray|slategrey|steelblue|skyblue|royalblue|midnightblue|forestgreen|seagreen|darkred|darkblue|darkgreen|hotpink|deeppink|dodgerblue';

const fontKeyBans = ['fontSize', 'fontFamily', 'fontWeight', 'font-size', 'font-family', 'font-weight'].flatMap((key) => [
  { selector: `Property[key.name='${key}'][value.type='Literal']`, message: `Inline ${key} literal (UI-2). Use a design token.` },
  { selector: `Property[key.value='${key}'][value.type='Literal']`, message: `Inline ${key} literal (UI-2). Use a design token.` },
]);

// UI-2 dimension ban (INV-09): gated axes hold, ungated axes drift. The pilot shipped 77+ raw sizes with zero
// token references while colour and type stayed clean, so spacing and dimension literals are error tier too.
// The allowlist is structural, by not matching: unitless ratios (lineHeight), flex/flexGrow/flexShrink/order,
// integer zIndex, percentages, viewport units, ch/fr/auto keywords, and 0 all pass these selectors.
const DIM_CAMEL = '(?:padding|margin)(?:Top|Right|Bottom|Left|Inline(?:Start|End)?|Block(?:Start|End)?)?|gap|rowGap|columnGap|width|height|minWidth|maxWidth|minHeight|maxHeight|top|left|right|bottom|inset(?:Inline(?:Start|End)?|Block(?:Start|End)?)?';
const DIM_KEBAB = '(?:padding|margin)(?:-(?:top|right|bottom|left|inline(?:-start|-end)?|block(?:-start|-end)?))?|gap|row-gap|column-gap|width|height|min-width|max-width|min-height|max-height|top|left|right|bottom|inset(?:-(?:inline(?:-start|-end)?|block(?:-start|-end)?))?';
const DIM_MESSAGE = 'Raw dimension/spacing literal (UI-2). Use a spacing or size token.';
const dimensionBans = [
  // Bare numbers (padding: 24); zero is legal. Numeric literals are matched on `raw` (the source text), because
  // esquery regex-tests only string values, so a `value=` regex silently never matches a number.
  { selector: `Property[key.name=/^(?:${DIM_CAMEL})$/] > Literal[raw=/^(?!0$)\\d+(?:\\.\\d+)?$/]`, message: DIM_MESSAGE },
  { selector: `Property[key.value=/^(?:${DIM_CAMEL}|${DIM_KEBAB})$/] > Literal[raw=/^(?!0$)\\d+(?:\\.\\d+)?$/]`, message: DIM_MESSAGE },
  // px/rem anywhere in the string, so shorthand ('12px 24px') and calc mixes are caught too.
  { selector: `Property[key.name=/^(?:${DIM_CAMEL})$/] > Literal[value=/\\d(?:px|rem)\\b/]`, message: DIM_MESSAGE },
  { selector: `Property[key.value=/^(?:${DIM_CAMEL}|${DIM_KEBAB})$/] > Literal[value=/\\d(?:px|rem)\\b/]`, message: DIM_MESSAGE },
];

const bannedVisualLiterals = [
  ...dimensionBans,
  { selector: 'Literal[value=/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/]', message: 'Hex color literal (UI-2). Use a design token.' },
  { selector: 'Literal[value=/\\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\\(/i]', message: 'CSS color function literal (UI-2). Use a design token.' },
  { selector: `Literal[value=/^(?:${NAMED_COLORS})$/i]`, message: 'Named color literal (UI-2). Use a design token.' },
  { selector: 'TemplateElement[value.raw=/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/]', message: 'Hex color in a template literal (UI-2). Use a design token.' },
  { selector: 'TemplateElement[value.raw=/\\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\\(/i]', message: 'CSS color function in a template literal (UI-2). Use a design token.' },
  ...fontKeyBans,
  // Both forms: `value` catches strings ('8px'); `raw` catches bare numbers, which esquery's value regex never
  // matches (found during the invariants pass: the old value-only selector was vacuous for `borderRadius: 8`).
  { selector: "Property[key.name='borderRadius'] > Literal[value=/^[0-9]/]", message: 'Raw borderRadius number (UI-2). Use a design token.' },
  { selector: "Property[key.name='borderRadius'] > Literal[raw=/^[0-9]/]", message: 'Raw borderRadius number (UI-2). Use a design token.' },
  { selector: "Property[key.value='border-radius'][value.type='Literal']", message: 'Raw border-radius literal (UI-2). Use a design token.' },
  { selector: "Property[key.name=/^(?:borderWidth|border)$/] > Literal", message: 'Raw border/hairline width (UI-2). Use a design token.' },
  { selector: "Property[key.value=/^(?:border-width|border)$/][value.type='Literal']", message: 'Raw border/hairline width (UI-2). Use a design token.' },
];

// Ban the whole theme layer (including a re-export barrel), not just the tokens file (UI-3).
const themeBan = {
  group: ['**/theme', '**/theme/**'],
  message: 'Only primitives (src/components) import the token source or theme (UI-3).',
};

// UI-5: modules outside the composition root import neither the transport nor the data services. One import
// statement is how the pilot's wiring hole arrived; this makes it structural. Type-only imports stay legal
// (a screen may type its props against a service's exported types; types carry no behavior).
const serviceBan = {
  group: ['**/api', '**/api/**', '**/data', '**/data/**'],
  message: 'Only the composition root (src/main.tsx) constructs the transport or data services; screens receive data and callbacks (UI-5).',
  allowTypeImports: true,
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-syntax': ['error', ...bannedVisualLiterals],
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [themeBan, serviceBan] }],
    },
  },
  {
    // Exempt from the UI-5 service ban (the theme ban stays): the composition root itself, the service and
    // transport layers (the banned surface), tests (they drive services directly), and the harness and smoke
    // tools (TEST-2 and the UI-5 smoke ARE the service drivers).
    files: ['src/main.tsx', 'src/api/**', 'src/data/**', 'src/**/__tests__/**', 'tools/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [themeBan] }],
    },
  },
  {
    // The token source and the primitives are the transcription point: they hold literal values and import tokens.
    files: ['src/theme/**', 'src/components/**'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
);
