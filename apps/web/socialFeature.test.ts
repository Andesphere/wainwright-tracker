/// <reference types="node" />

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const schemaSource = readFileSync(
  join(root, "../../packages/backend/convex/schema.ts"),
  "utf8",
);
const socialSource = readFileSync(
  join(root, "../../packages/backend/convex/social.ts"),
  "utf8",
);

describe("bagger discovery data model", () => {
  it("stores onboarded public profiles and follow edges with privacy-aware indexes", () => {
    expect(schemaSource).toContain("userProfiles");
    expect(schemaSource).toContain("firstName");
    expect(schemaSource).toContain("lastName");
    expect(schemaSource).toContain("nickname");
    expect(schemaSource).toContain("displayName");
    expect(schemaSource).toContain("profileVisibility");
    expect(schemaSource).toContain("onboardingCompletedAt");
    expect(schemaSource).toContain("searchableText");
    expect(schemaSource).toContain("searchableEmail: v.optional");
    expect(schemaSource).toContain("searchableName: v.optional");
    expect(schemaSource).toContain('.index("by_user", ["userId"])');
    expect(schemaSource).toContain('.index("by_visibility_searchable_text", [');
    expect(schemaSource).toContain('"profileVisibility",');
    expect(schemaSource).toContain('"searchableText",');
    expect(schemaSource).toContain("by_visibility_searchable_first_name");
    expect(schemaSource).toContain("by_visibility_searchable_last_name");
    expect(schemaSource).toContain("by_visibility_searchable_nickname");

    expect(schemaSource).toContain("follows");
    expect(schemaSource).toContain("followerUserId");
    expect(schemaSource).toContain("followingUserId");
    expect(schemaSource).toContain(
      '.index("by_pair", ["followerUserId", "followingUserId"])',
    );
  });

  it("exposes onboarding, privacy-safe search, follow, unfollow, and profile queries", () => {
    expect(socialSource).toContain("export const getCurrentProfile");
    expect(socialSource).toContain("export const completeOnboarding");
    expect(socialSource).toContain("export const updateProfileSettings");
    expect(socialSource).toContain("export const searchBaggers");
    expect(socialSource).toContain('withIndex("by_visibility_searchable_text"');
    expect(socialSource).toContain('profileVisibility === "public"');
    expect(socialSource).toContain("onboardingCompletedAt");
    expect(socialSource).not.toContain("searchableEmail");
    expect(socialSource).toContain("export const follow");
    expect(socialSource).toContain("export const unfollow");
    expect(socialSource).toContain("export const getProfile");
    expect(socialSource).toContain("ctx.storage.getUrl");
  });
});
