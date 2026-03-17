import { invoke } from "@tauri-apps/api/core";

export async function initializeVault(path: string) {
  return invoke<string>("initialize_vault", {
    path,
  });
}
