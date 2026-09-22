// Pensionbuddy logo — mark + horizontal lockup.
// Requires 'Schibsted Grotesk' (400/500/700/800) to be loaded by the host page.

const TEAL = '#14CBB1';        // brand teal (bright)
const TEAL_DEEP = '#0A5C52';   // deep teal, for teal-on-white text contexts
const INK = '#0F1F1C';         // wordmark ink

export function PensionbuddyPaw({ size = 24, color = 'currentColor', ...rest }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill={color} role="img" aria-label="Pensionbuddy paw" {...rest}>
      <ellipse cx="23.2" cy="17.6" rx="6.1" ry="8.3" transform="rotate(-9 23.2 17.6)" />
      <ellipse cx="40.8" cy="17.6" rx="6.1" ry="8.3" transform="rotate(9 40.8 17.6)" />
      <ellipse cx="9.8" cy="28.6" rx="5.5" ry="7.4" transform="rotate(-31 9.8 28.6)" />
      <ellipse cx="54.2" cy="28.6" rx="5.5" ry="7.4" transform="rotate(31 54.2 28.6)" />
      <path d="M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z" />
    </svg>
  );
}

// Square app/social mark. Corner radius is 26.7% of size, paw is 57.8% of size.
export function PensionbuddyMark({ size = 40, background = TEAL, paw = '#fff', ...rest }) {
  return (
    <span
      {...rest}
      style={{
        width: size, height: size, borderRadius: size * 0.267, background,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
        ...(rest.style || {}),
      }}
    >
      <PensionbuddyPaw size={size * 0.578} color={paw} />
    </span>
  );
}

// Horizontal lockup. `height` drives everything; default 40 suits a site header.
export function PensionbuddyLockup({ height = 40, tone = 'default', ...rest }) {
  const reversed = tone === 'reversed';
  return (
    <span
      {...rest}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: height * 0.269,
        ...(rest.style || {}),
      }}
    >
      <PensionbuddyMark size={height} background={reversed ? '#fff' : TEAL} paw={reversed ? INK : '#fff'} />
      <span
        style={{
          fontFamily: "'Schibsted Grotesk', system-ui, sans-serif",
          fontSize: height * 0.635,
          fontWeight: 800,
          letterSpacing: '-0.035em',
          lineHeight: 1,
          color: reversed ? '#fff' : INK,
          whiteSpace: 'nowrap',
        }}
      >
        Pensionbuddy
      </span>
    </span>
  );
}

export const PENSIONBUDDY_BRAND = { TEAL, TEAL_DEEP, INK };
