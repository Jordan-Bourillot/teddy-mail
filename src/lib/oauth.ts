// OAuth 2.0 + PKCE client helpers (TS side).
// The actual code-for-token exchange happens in the Rust shell to keep
// secrets and refresh tokens out of the renderer process. The TS side only
// builds the auth URL, opens the browser, and listens for the redirect.

import { ipc, isTauri, type OAuthStartArgs, type OAuthCompleteArgs } from './ipc';

export type OAuthProvider = 'gmail' | 'outlook';

export interface OAuthClientConfig {
  provider: OAuthProvider;
  clientId: string; // user-supplied (registered Google/MS app)
  redirectUri: string; // typically http://127.0.0.1:<port>/callback
}

/**
 * Step 1: build auth URL (PKCE done in Rust core), return it.
 */
export async function startFlow(cfg: OAuthClientConfig) {
  const args: OAuthStartArgs = {
    provider: cfg.provider,
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
  };
  return ipc.startOAuth(args);
}

/**
 * Step 2: open the auth URL in the OS browser. In web mode, falls back
 * to window.open (which can't actually receive the redirect).
 */
export async function openInBrowser(url: string): Promise<void> {
  if (isTauri()) {
    const shell = await import('@tauri-apps/plugin-shell');
    await shell.open(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Step 3: complete the flow by exchanging the code for tokens. The Rust
 * core stores them in the OS keyring under the given account_id.
 */
export async function completeFlow(
  cfg: OAuthClientConfig,
  code: string,
  codeVerifier: string,
  accountId: string,
): Promise<void> {
  const args: OAuthCompleteArgs = {
    provider: cfg.provider,
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    code,
    code_verifier: codeVerifier,
    account_id: accountId,
  };
  return ipc.completeOAuth(args);
}

/**
 * The redirect URI strategy: in desktop, Tauri can register a deep link
 * scheme (`pitelafe://oauth-callback`) and listen via the deep-link plugin.
 * For now we expose the helper as documentation; the wiring happens once
 * the deep-link plugin is added.
 */
export const desktopRedirectUri = 'pitelafe://oauth-callback';
export const localLoopbackRedirectUri = (port: number) =>
  `http://127.0.0.1:${port}/callback`;
