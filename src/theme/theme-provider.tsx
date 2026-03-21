import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { applyTheme } from "./apply-theme";
import type { ThemeColorToken, ThemeTokens } from "./theme-types";
import { builtInThemes, defaultThemeId } from "./themes";

type ThemeContextValue = {
  activeThemeId: string;
  activeAccentToken: ThemeColorToken;
  themes: ThemeTokens[];
  previewTheme: (themeId: string, accentToken?: ThemeColorToken) => void;
  applyThemeSelection: (themeId: string, accentToken: ThemeColorToken) => void;
  resetPreview: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeIdStorageKey = "lira:theme-id";
const accentTokenStorageKey = "lira:theme-accent-token";
const defaultAccentToken: ThemeColorToken = "accent";

function findStoredValueBySuffix(storage: Storage, key: string, suffix: string) {
  for (let index = 0; index < storage.length; index += 1) {
    const candidateKey = storage.key(index);

    if (!candidateKey?.endsWith(suffix)) {
      continue;
    }

    const value = storage.getItem(candidateKey);

    if (value) {
      storage.setItem(key, value);
      return value;
    }
  }

  return null;
}

function getThemeById(themeId: string) {
  return builtInThemes.find((theme) => theme.id === themeId) ?? builtInThemes[0];
}

function readStoredThemeId() {
  if (typeof window === "undefined") {
    return defaultThemeId;
  }

  const storedThemeId =
    window.localStorage.getItem(themeIdStorageKey) ??
    findStoredValueBySuffix(window.localStorage, themeIdStorageKey, ":theme-id");

  return storedThemeId && builtInThemes.some((theme) => theme.id === storedThemeId)
    ? storedThemeId
    : defaultThemeId;
}

function readStoredAccentToken(): ThemeColorToken {
  if (typeof window === "undefined") {
    return defaultAccentToken;
  }

  const storedAccentToken =
    window.localStorage.getItem(accentTokenStorageKey) ??
    findStoredValueBySuffix(
      window.localStorage,
      accentTokenStorageKey,
      ":theme-accent-token",
    );

  return storedAccentToken && storedAccentToken in builtInThemes[0].colors
    ? (storedAccentToken as ThemeColorToken)
    : defaultAccentToken;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [activeThemeId, setActiveThemeId] = useState(readStoredThemeId);
  const [activeAccentToken, setActiveAccentToken] = useState<ThemeColorToken>(
    readStoredAccentToken,
  );

  useEffect(() => {
    applyTheme(getThemeById(activeThemeId), { accentToken: activeAccentToken });

    if (typeof window !== "undefined") {
      window.localStorage.setItem(themeIdStorageKey, activeThemeId);
      window.localStorage.setItem(accentTokenStorageKey, activeAccentToken);
    }
  }, [activeAccentToken, activeThemeId]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      activeThemeId,
      activeAccentToken,
      themes: builtInThemes,
      previewTheme: (themeId: string, accentToken = activeAccentToken) => {
        applyTheme(getThemeById(themeId), { accentToken });
      },
      applyThemeSelection: (themeId: string, accentToken: ThemeColorToken) => {
        setActiveThemeId(themeId);
        setActiveAccentToken(accentToken);
      },
      resetPreview: () => {
        applyTheme(getThemeById(activeThemeId), { accentToken: activeAccentToken });
      },
    }),
    [activeAccentToken, activeThemeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
