import { describe, it, expect } from "vitest";
import {
  CHANGE_PASSWORD_PATH,
  LOGIN_PATH,
  decideAccess,
  safeNextPath,
} from "@/lib/auth/access";

const anonymous = { isAuthenticated: false, mustChangePassword: false };
const signedIn = { isAuthenticated: true, mustChangePassword: false };
const temporary = { isAuthenticated: true, mustChangePassword: true };

describe("decideAccess, signed out", () => {
  it("sends a page request to the login screen", () => {
    expect(decideAccess({ pathname: "/armari", ...anonymous })).toEqual({
      type: "redirect",
      to: `${LOGIN_PATH}?next=%2Farmari`,
    });
  });

  it("keeps the query string in the return path", () => {
    expect(
      decideAccess({ pathname: "/armari", search: "?category=SHIRT", ...anonymous }),
    ).toEqual({
      type: "redirect",
      to: `${LOGIN_PATH}?next=%2Farmari%3Fcategory%3DSHIRT`,
    });
  });

  it("does not bother with a return path for the home screen", () => {
    expect(decideAccess({ pathname: "/", ...anonymous })).toEqual({
      type: "redirect",
      to: LOGIN_PATH,
    });
  });

  it("answers an API call with a status code, not a redirect", () => {
    expect(decideAccess({ pathname: "/api/export", ...anonymous })).toEqual({
      type: "unauthorized",
    });
  });

  it("closes the photo endpoints too", () => {
    expect(decideAccess({ pathname: "/api/uploads/abc.webp", ...anonymous })).toEqual({
      type: "unauthorized",
    });
  });

  it("leaves the login screen and Auth.js's own routes open", () => {
    expect(decideAccess({ pathname: LOGIN_PATH, ...anonymous })).toEqual({ type: "allow" });
    expect(
      decideAccess({ pathname: "/api/auth/callback/credentials", ...anonymous }),
    ).toEqual({ type: "allow" });
  });

  it("leaves the installable-app files open", () => {
    expect(decideAccess({ pathname: "/manifest.webmanifest", ...anonymous })).toEqual({
      type: "allow",
    });
    expect(decideAccess({ pathname: "/icons/icon-192.png", ...anonymous })).toEqual({
      type: "allow",
    });
  });
});

describe("decideAccess, signed in", () => {
  it("lets the wardrobe through", () => {
    expect(decideAccess({ pathname: "/armari", ...signedIn })).toEqual({ type: "allow" });
  });

  it("takes the login screen away", () => {
    expect(decideAccess({ pathname: LOGIN_PATH, ...signedIn })).toEqual({
      type: "redirect",
      to: "/",
    });
  });

  it("allows a password change nobody asked for", () => {
    expect(decideAccess({ pathname: CHANGE_PASSWORD_PATH, ...signedIn })).toEqual({
      type: "allow",
    });
  });
});

describe("decideAccess, temporary password", () => {
  it("holds every screen until it is replaced", () => {
    expect(decideAccess({ pathname: "/armari", ...temporary })).toEqual({
      type: "redirect",
      to: CHANGE_PASSWORD_PATH,
    });
  });

  it("holds the API as well", () => {
    expect(decideAccess({ pathname: "/api/export", ...temporary })).toEqual({
      type: "unauthorized",
    });
  });

  it("lets the change screen itself through", () => {
    expect(decideAccess({ pathname: CHANGE_PASSWORD_PATH, ...temporary })).toEqual({
      type: "allow",
    });
  });

  it("sends the login screen to the change screen", () => {
    expect(decideAccess({ pathname: LOGIN_PATH, ...temporary })).toEqual({
      type: "redirect",
      to: CHANGE_PASSWORD_PATH,
    });
  });

  it("still allows signing out", () => {
    expect(decideAccess({ pathname: "/api/auth/signout", ...temporary })).toEqual({
      type: "allow",
    });
  });
});

describe("safeNextPath", () => {
  it("accepts a path on this site", () => {
    expect(safeNextPath("/armari?category=SHIRT")).toBe("/armari?category=SHIRT");
  });

  it("refuses another origin", () => {
    expect(safeNextPath("https://evil.example/steal")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
  });

  it("refuses to bounce back to itself", () => {
    expect(safeNextPath(LOGIN_PATH)).toBeNull();
    expect(safeNextPath(`${LOGIN_PATH}?next=%2F`)).toBeNull();
  });

  it("treats nothing as nothing", () => {
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath("")).toBeNull();
  });
});
