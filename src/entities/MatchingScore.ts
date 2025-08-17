
// src/entities/MatchingScore.ts

export interface MatchingScore {
  score: number;
  breakdown: {
    interests: number;
    location: number;
    trustScore: number;
  };
}

