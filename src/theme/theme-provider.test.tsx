import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "./theme-provider";
import { builtInThemes, defaultThemeId } from "./themes";
import { rozejinTheme } from "./themes/rozejin";
import { nordTheme } from "./themes/nord";

function installLocalStorage(initialValues: Record<string, string> = {}) {
  const store = new Map(Object.entries(initialValues));

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      get length() {
        return store.size;
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  });
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    installLocalStorage();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.cssText = "";
  });

  it("registers rozejin as a built-in theme and default selection", () => {
    expect(builtInThemes.map((theme) => theme.id)).toEqual([
      "rozejin",
      "harbor",
      "catppuccin",
      "nord",
      "one-dark",
    ]);
    expect(builtInThemes[0]).toEqual(
      expect.objectContaining({
        id: "rozejin",
        label: "Rozejin",
      }),
    );
    expect(defaultThemeId).toBe("rozejin");
  });

  it("falls back to rozejin when local storage points to an unknown theme", async () => {
    installLocalStorage({
      "lira:theme-id": "legacy-theme",
      "lira:theme-accent-token": "accent",
    });

    render(
      <ThemeProvider>
        <div>Lira</div>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("rozejin");
    });

    expect(window.localStorage.getItem("lira:theme-id")).toBe("rozejin");
  });

  it("migrates a previous app theme preference that uses the same storage suffix", async () => {
    installLocalStorage({
      "legacy:theme-id": "nord",
      "legacy:theme-accent-token": "accent",
    });

    render(
      <ThemeProvider>
        <div>Lira</div>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("nord");
    });

    expect(window.localStorage.getItem("lira:theme-id")).toBe("nord");
    expect(window.localStorage.getItem("lira:theme-accent-token")).toBe("accent");
  });

  it("applies the rozejin theme when no stored preference exists", async () => {
    render(
      <ThemeProvider>
        <div>Lira</div>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("rozejin");
    });

    expect(
      document.documentElement.style.getPropertyValue("--color-accent"),
    ).toBe("#ff9fc0");
    expect(window.localStorage.getItem("lira:theme-id")).toBe("rozejin");
    expect(window.localStorage.getItem("lira:theme-accent-token")).toBe("accent");
  });

  it("keeps rozejin and nord elevated surfaces clearly distinct from the main page background", () => {
    expect(rozejinTheme.colors.surfaceElevated).not.toBe(rozejinTheme.colors.mainBg);
    expect(rozejinTheme.colors.surfaceElevated).not.toBe(rozejinTheme.colors.panelMuted);
    expect(nordTheme.colors.surfaceElevated).not.toBe(nordTheme.colors.mainBg);
    expect(nordTheme.colors.surfaceElevated).not.toBe(nordTheme.colors.panelMuted);
  });
});
