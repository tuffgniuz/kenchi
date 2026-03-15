import { FolderIcon, PaletteIcon } from "../../app/icons";

type SettingsModalProps = {
  activeSection: "theme" | "vault";
  onSectionChange: (section: "theme" | "vault") => void;
  themes: Array<{
    id: string;
    label: string;
    colors: {
      sidebarSurface: string;
      panelBg: string;
      accent: string;
      textPrimary: string;
      textMuted: string;
    };
  }>;
  pendingThemeId: string;
  pendingVaultPath: string;
  vaultError: string;
  onPreviewTheme: (themeId: string) => void;
  onVaultPathChange: (path: string) => void;
  onBrowseVault: () => Promise<void>;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function SettingsModal({
  activeSection,
  onSectionChange,
  themes,
  pendingThemeId,
  pendingVaultPath,
  vaultError,
  onPreviewTheme,
  onVaultPathChange,
  onBrowseVault,
  onClose,
  onConfirm,
}: SettingsModalProps) {
  return (
    <div className="settings-modal__backdrop" role="presentation" onClick={onClose}>
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <aside className="settings-modal__sidebar">
          <div className="settings-modal__sidebar-top">
            <p id="settings-title" className="settings-modal__eyebrow">
              Settings
            </p>
          </div>

          <nav className="settings-nav" aria-label="Settings sections">
            <button
              type="button"
              className={`settings-nav__button ${
                activeSection === "theme" ? "is-active" : ""
              }`}
              onClick={() => onSectionChange("theme")}
            >
              <PaletteIcon className="nav-icon" />
              <span>Theme</span>
            </button>
            <button
              type="button"
              className={`settings-nav__button ${
                activeSection === "vault" ? "is-active" : ""
              }`}
              onClick={() => onSectionChange("vault")}
            >
              <FolderIcon className="nav-icon" />
              <span>Vault</span>
            </button>
          </nav>
        </aside>

        <div className="settings-modal__content">
          {activeSection === "theme" ? (
            <div className="settings-panel">
              <div className="settings-panel__header">
                <div>
                  <p className="settings-modal__eyebrow">Appearance</p>
                  <h3 className="settings-panel__title">Theme</h3>
                </div>
              </div>

              <div className="theme-grid">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    className={`theme-card ${
                      pendingThemeId === theme.id ? "is-selected" : ""
                    }`}
                    onClick={() => onPreviewTheme(theme.id)}
                  >
                    <div className="theme-card__preview">
                      <span
                        className="theme-card__swatch"
                        style={{ backgroundColor: theme.colors.sidebarSurface }}
                      />
                      <span
                        className="theme-card__swatch"
                        style={{ backgroundColor: theme.colors.panelBg }}
                      />
                      <span
                        className="theme-card__swatch"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                      <span
                        className="theme-card__swatch"
                        style={{ backgroundColor: theme.colors.textPrimary }}
                      />
                    </div>
                    <div className="theme-card__copy">
                      <span className="theme-card__label">{theme.label}</span>
                      <span className="theme-card__meta">{theme.id}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="settings-panel">
              <div className="settings-panel__header">
                <div>
                  <p className="settings-modal__eyebrow">Storage</p>
                  <h3 className="settings-panel__title">Vault</h3>
                </div>
              </div>

              <div className="vault-settings">
                <label className="vault-settings__field">
                  <span className="vault-settings__label">Vault path</span>
                  <input
                    type="text"
                    value={pendingVaultPath}
                    onChange={(event) => onVaultPathChange(event.target.value)}
                    className="vault-settings__input"
                    placeholder="/path/to/kenchi-vault"
                    aria-label="Vault path"
                  />
                </label>
                <button
                  type="button"
                  className="vault-settings__browse"
                  onClick={() => void onBrowseVault()}
                >
                  Choose directory
                </button>
                <p className="vault-settings__hint">
                  Vaults stay local-first. Choosing a synced folder later should remain
                  compatible with future sync workflows.
                </p>
                {vaultError ? <p className="vault-settings__error">{vaultError}</p> : null}
              </div>
            </div>
          )}

          <div className="settings-modal__footer">
            <button
              type="button"
              className="settings-modal__confirm"
              onClick={() => void onConfirm()}
            >
              Confirm
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
