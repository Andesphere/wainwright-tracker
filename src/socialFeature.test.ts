/// <reference types="node" />

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const schemaSource = readFileSync(join(root, "convex/schema.ts"), "utf8");
const socialSource = readFileSync(join(root, "convex/social.ts"), "utf8");

describe("bagger discovery data model", () => {
  it("stores searchable public profiles and follow edges with indexes", () => {
    expect(schemaSource).toContain("userProfiles");
    expect(schemaSource).toContain("searchableName");
    expect(schemaSource).toContain("searchableEmail");
    expect(schemaSource).toContain('.index("by_user", ["userId"])');
    expect(schemaSource).toContain(
      '.index("by_searchable_name", ["searchableName"])',
    );
    expect(schemaSource).toContain(
      '.index("by_searchable_email", ["searchableEmail"])',
    );

    expect(schemaSource).toContain("follows");
    expect(schemaSource).toContain("followerUserId");
    expect(schemaSource).toContain("followingUserId");
    expect(schemaSource).toContain(
      '.index("by_pair", ["followerUserId", "followingUserId"])',
    );
  });

  it("exposes optimized search, follow, unfollow, and profile queries", () => {
    expect(socialSource).toContain("export const searchBaggers");
    expect(socialSource).toContain('withIndex("by_searchable_name"');
    expect(socialSource).toContain('withIndex("by_searchable_email"');
    expect(socialSource).toContain("export const follow");
    expect(socialSource).toContain("export const unfollow");
    expect(socialSource).toContain("export const getProfile");
    expect(socialSource).toContain("ctx.storage.getUrl");
  });
});
