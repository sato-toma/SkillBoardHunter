import { describe, expect, it } from "vitest";
import {
    fallbackSkillLayout,
    isSkillUnlocked,
    type Skill,
    skillVisibility,
} from "./skillBoard";

const skills: Skill[] = [
    { id: "root", name: "Root", xp: 80 },
    { id: "near", name: "Near", prerequisiteSkillIds: ["root"], xp: 0 },
    { id: "far", name: "Far", prerequisiteSkillIds: ["near"], xp: 0 },
];

describe("skill map rules", () => {
    it("separates unlocked, discoverable, and hidden territory", () => {
        expect(isSkillUnlocked(skills[0], skills)).toBe(true);
        expect(skillVisibility(skills[0], skills)).toBe("unlocked");
        expect(skillVisibility(skills[1], skills)).toBe("discoverable");
        expect(skillVisibility(skills[2], skills)).toBe("hidden");
    });

    it("returns stable fallback positions for legacy Skills", () => {
        const first = fallbackSkillLayout(skills[0], skills);
        const second = fallbackSkillLayout(skills[0], skills);
        const deeper = fallbackSkillLayout(skills[2], skills);

        expect(first).toEqual(second);
        expect(deeper).not.toEqual(first);
    });
});
