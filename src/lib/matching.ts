import type { Profile } from "@/hooks/useProfile";

export interface MatchResult {
  profile: Profile;
  compatibility: number;
  matchingTeach: string[];
  matchingLearn: string[];
}

export function computeMatches(myProfile: Profile, allProfiles: Profile[]): MatchResult[] {
  const myTeach = (myProfile.skills_teach || []).map((s) => s.toLowerCase());
  const myLearn = (myProfile.skills_learn || []).map((s) => s.toLowerCase());

  if (myTeach.length === 0 && myLearn.length === 0) return [];

  return allProfiles
    .filter((p) => p.id !== myProfile.id)
    .map((p) => {
      const theirTeach = (p.skills_teach || []).map((s) => s.toLowerCase());
      const theirLearn = (p.skills_learn || []).map((s) => s.toLowerCase());

      // They teach what I want to learn
      const matchingTeach = myLearn.filter((s) => theirTeach.includes(s));
      // They want to learn what I teach
      const matchingLearn = myTeach.filter((s) => theirLearn.includes(s));

      const totalPossible = Math.max(myLearn.length + myTeach.length, 1);
      const compatibility = Math.round(
        ((matchingTeach.length + matchingLearn.length) / totalPossible) * 100
      );

      return { profile: p, compatibility, matchingTeach, matchingLearn };
    })
    .filter((m) => m.compatibility > 0)
    .sort((a, b) => b.compatibility - a.compatibility);
}
