import { afterEach, describe, expect, it, vi } from "vitest";
import { createLoginVerifier, loginVersion } from "../lib/password-login";
import authConfig from "../auth.config";

afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
function configure() {
  vi.stubEnv("LOGIN_USER", "owner");
  vi.stubEnv("LOGIN_PASSWORD", "test-only-password-123");
  vi.stubEnv("AUTH_SECRET", "test-only-session-secret");
}
const correct = { username: "owner", password: "test-only-password-123" };

describe("private password login", () => {
  it("accepts only the configured user ID and exact password", async () => {
    configure();
    const verify = createLoginVerifier();
    expect(await verify(correct)).toEqual({ id: "wallet-owner", name: "owner" });
    expect(await verify({ ...correct, username: "another-user" })).toBeNull();
    expect(await verify({ ...correct, password: "wrong" })).toBeNull();
    expect(await verify({ ...correct, password: correct.password + " " })).toBeNull();
  });
  it("fails closed for missing settings, weak configured passwords and malformed requests", async () => {
    configure();
    const verify = createLoginVerifier();
    expect(await verify({ username: {}, password: [] })).toBeNull();
    vi.stubEnv("LOGIN_PASSWORD", "short");
    expect(await verify(correct)).toBeNull();
    vi.stubEnv("LOGIN_PASSWORD", correct.password);
    vi.stubEnv("AUTH_SECRET", "");
    expect(await verify(correct)).toBeNull();
    vi.stubEnv("AUTH_SECRET", "test");
    vi.stubEnv("LOGIN_USER", "");
    expect(await verify(correct)).toBeNull();
  });
  it("throttles repeated failures and allows another attempt after five minutes", async () => {
    configure(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-25T00:00:00Z"));
    const verify = createLoginVerifier();
    for (let i = 0; i < 10; i++) expect(await verify({ ...correct, password: "wrong" })).toBeNull();
    expect(await verify(correct)).toBeNull();
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(await verify(correct)).not.toBeNull();
  });
  it("invalidates existing and legacy Google sessions when login settings change", async () => {
    configure();
    const version = await loginVersion();
    const jwt = authConfig.callbacks.jwt;
    const session = { token: { loginVersion: version } } as unknown as Parameters<typeof jwt>[0];
    expect(await jwt(session)).toEqual(session.token);
    vi.stubEnv("LOGIN_PASSWORD", "replacement-password-456");
    expect(await jwt(session)).toBeNull();
    expect(await jwt({ token: {} } as unknown as Parameters<typeof jwt>[0])).toBeNull();
  });
});
