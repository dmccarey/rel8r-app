import { analyzeLogoSafe } from "@/lib/analyze-logo";

const STORAGE_KEY = "rel8r:default-branding";

export function normalizeBranding({
  orgName,
  logoUrl,
  logoHeight,
  logoMaxWidth,
  theme,
} = {}) {
  const name =
    typeof orgName === "string" && orgName.length > 0 ? orgName : null;

  return {
    orgName: name,
    logoUrl: logoUrl?.trim() || null,
    logoHeight: logoHeight ?? null,
    logoMaxWidth: logoMaxWidth ?? null,
    theme: theme ?? null,
  };
}

export function sanitizeBranding(branding) {
  const orgName = branding?.orgName?.trim() || null;
  const logoUrl = branding?.logoUrl?.trim() || null;
  const theme = branding?.theme ?? null;

  return {
    orgName,
    logoUrl,
    logoHeight: branding?.logoHeight ?? null,
    logoMaxWidth: branding?.logoMaxWidth ?? null,
    theme: theme
      ? {
          accent: theme.accent,
          border: theme.border,
          surface: theme.surface,
          pager: theme.pager,
        }
      : null,
  };
}

export function hasBranding(branding) {
  const sanitized = sanitizeBranding(branding);
  return !!(sanitized.orgName || sanitized.logoUrl);
}

export function hasLogoTheme(branding) {
  return !!(
    branding?.theme?.accent &&
    branding?.theme?.border &&
    branding?.theme?.surface
  );
}

export async function enrichBranding(branding, { previousBranding } = {}) {
  const sanitized = sanitizeBranding(branding);

  if (!hasBranding(sanitized)) {
    return null;
  }

  if (!sanitized.logoUrl) {
    return { ...sanitized, logoHeight: null, logoMaxWidth: null, theme: null };
  }

  const logoUnchanged =
    previousBranding?.logoUrl === sanitized.logoUrl &&
    previousBranding?.logoHeight != null &&
    previousBranding?.logoMaxWidth != null &&
    previousBranding?.theme?.accent &&
    previousBranding?.theme?.pager;

  if (logoUnchanged) {
    return {
      ...sanitized,
      logoHeight: previousBranding.logoHeight,
      logoMaxWidth: previousBranding.logoMaxWidth,
      theme: previousBranding.theme,
    };
  }

  const analysis = await analyzeLogoSafe(sanitized.logoUrl);

  return {
    ...sanitized,
    logoHeight: analysis.heightPx,
    logoMaxWidth: analysis.maxWidthPx,
    theme: {
      accent: analysis.accent,
      border: analysis.border,
      surface: analysis.surface,
      pager: analysis.pager,
    },
  };
}

export function getViewerThemeVars(branding) {
  const pager = branding?.theme?.pager ?? branding?.theme?.accent;
  if (!pager) return undefined;
  return { "--pager-active": pager };
}

export function loadDefaultBranding() {
  if (typeof window === "undefined") return normalizeBranding();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeBranding(JSON.parse(raw)) : normalizeBranding();
  } catch {
    return normalizeBranding();
  }
}

export function saveDefaultBranding(branding) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sanitizeBranding(branding))
    );
  } catch {
    // Storage full or unavailable
  }
}

export function getCardColorVars(config, branding) {
  if (hasLogoTheme(branding)) {
    return {
      "--card-accent": branding.theme.accent,
      "--card-bg": branding.theme.surface,
      "--card-border": branding.theme.border,
    };
  }

  return {
    "--card-accent": config.accent,
    "--card-bg": config.bg,
    "--card-border": config.border,
  };
}
