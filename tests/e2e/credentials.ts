/**
 * The account the e2e run signs in as. Created (or reset) by
 * `global-setup.ts` against the e2e database, never against a real one.
 */
export const E2E_USERNAME = "e2e";
export const E2E_PASSWORD = "e2e-password-1234";

/** Where the signed-in cookie jar is kept between the setup project and
 * the specs. Git-ignored: it is a session, not a fixture. */
export const STORAGE_STATE = "tests/e2e/.auth/state.json";
