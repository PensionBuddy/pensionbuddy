# Pensionbuddy logo — implementation pack

Drop-in assets for the refreshed mark (fanned paw) and the bright brand teal.

## Colours

| Token | Hex | Use |
| --- | --- | --- |
| `--pb-teal` | `#14CBB1` | Mark background, brand teal on dark or white grounds |
| `--pb-teal-deep` | `#0A5C52` | Teal **text** on white (bright teal fails contrast at body sizes) |
| `--pb-ink` | `#0F1F1C` | Wordmark |

Bright teal is a surface/graphic colour, not a text colour. Keep existing
`--teal-700 #08453E` for button fills and link text.

## Files

| File | Use |
| --- | --- |
| `pensionbuddy-lockup-horizontal.svg` | Header, email signature, docs. 560 × 104. |
| `pensionbuddy-lockup-horizontal-reversed.svg` | Same, for deep-ink / photo grounds. |
| `pensionbuddy-lockup-horizontal-mono.svg` | One colour via `currentColor` — print, embroidery, stamps. |
| `pensionbuddy-mark.svg` | Square mark, 180 × 180. Favicon, social avatar, app icon. |
| `pensionbuddy-mark-deep.svg` | Deep-teal ground variant. |
| `pensionbuddy-paw.svg` | Paw only, `currentColor`. Bullets, icons, small embroidery. |
| `PensionbuddyLogo.jsx` | React: `PensionbuddyLockup`, `PensionbuddyMark`, `PensionbuddyPaw`. |
| `lockup.html` | Framework-free HTML + CSS version of the lockup. |

The two lockup SVGs use live `<text>`, so they need Schibsted Grotesk 800 loaded.
On a page that doesn't load the font, use `PensionbuddyLogo.jsx` or `lockup.html`
(both inherit the page's font stack) rather than the SVG.

## Proportions

Everything derives from one number — the lockup height `H`:

- mark: `H × H`, corner radius `0.267 H`
- paw inside mark: `0.578 H`
- gap between mark and wordmark: `0.269 H`
- wordmark: font-size `0.635 H`, weight 800, letter-spacing `-0.035em`

Clear space: `0.25 H` on all sides. Minimum lockup height 28px on screen,
10mm in print. Below that use the mark alone.

## Replacing the current logo

1. Copy `brand/` into the site (e.g. `assets/brand/`).
2. Replace `assets/paw.svg` with `pensionbuddy-paw.svg` — same 64 × 64 viewBox and
   `currentColor` fill, so every existing `Icon name="paw"` and inline use picks up
   the new geometry with no other change.
3. Replace `assets/logo-mark.svg` with `pensionbuddy-mark.svg`. Note the viewBox
   changes from 34 × 34 to 180 × 180; anything sizing it with width/height is fine,
   anything relying on the old viewBox numbers needs checking.
4. Swap the header lockup for `PensionbuddyLockup` / `lockup.html` and delete the
   hand-inlined mark + wordmark markup.
5. Point the favicon and social `og:image` at the new mark.

## Don't

- Don't put the bright-teal mark on a teal or amber ground.
- Don't re-space or re-weight the wordmark; it is Schibsted Grotesk 800 at `-0.035em`.
- Don't add a drop shadow, outline, or gradient to the mark.
- Don't use the full lockup below 28px — the wordmark closes up.
