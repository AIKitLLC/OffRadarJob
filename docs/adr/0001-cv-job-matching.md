# ADR 0001: CV-to-job matching

## Decision

Rank open jobs against a candidate profile with a deterministic weighted score. Factors are skills (0.45), seniority (0.20), location (0.15), remote (0.10), and visa-sponsorship signal (0.10). Profiles accept CV text or structured fields. Explanations are the factor reasons, ordered by how far each score sits from neutral.

## Options

| Option | Fit | Determinism | Cost | Score |
| --- | --- | --- | --- | --- |
| Workers AI ranks every pair | 7 | 3 | 4 | 4.7 |
| Vectorize embeddings | 8 | 6 | 5 | 6.3 |
| Lexicon overlap plus explicit factor rules | 8 | 10 | 10 | 9.3 |

Vectorize is named in the product overview and is not a binding in `wrangler.jsonc`. Adding it would be new infrastructure. The tag-cloud lexicon already extracts skills, so the scorer reuses it.

## Trade-offs

The score is explainable and stable for the same input. It misses paraphrases that the lexicon does not list. Sponsorship is a text signal (`yes`, `no`, `unknown`), not a verification of an employer's policy. Unknown sponsorship lowers the score when the profile requires it and does not by itself reject the job; saved filters can require an explicit `yes`.

## Consequences

`parseCandidateProfile`, `scoreJobMatch`, and `rankJobMatches` are pure. Callers in the HTTP API, MCP, and the continuous pass share them.
