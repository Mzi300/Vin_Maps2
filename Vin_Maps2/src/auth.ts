// src/auth.ts
export enum AuthState {
  Guest = "guest",
  Authenticated = "authenticated",
}

const STORAGE_KEY = "vinmaps_auth_state";

export function getAuthState(): AuthState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === AuthState.Authenticated) return AuthState.Authenticated;
  return AuthState.Guest;
}

export function setAuthState(state: AuthState): void {
  localStorage.setItem(STORAGE_KEY, state);
}

export function isAuthenticated(): boolean {
  return getAuthState() === AuthState.Authenticated;
}
