"use client";

import { CandidateCard } from "./CandidateCard";
import type { Candidate } from "@/lib/predict";

export type CandidateListProps = {
  matches: Candidate[];
};

export function CandidateList({ matches }: CandidateListProps) {
  if (matches.length === 0) return null;
  return (
    <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {matches.map((c, i) => {
        const rank = i + 1;
        const variant = rank === 1 ? "hero" : rank <= 3 ? "medium" : "standard";
        return (
          <li
            key={c.pet.id}
            className={variant === "hero" ? "md:col-span-2" : ""}
          >
            <CandidateCard candidate={c} rank={rank} variant={variant} />
          </li>
        );
      })}
    </ol>
  );
}
