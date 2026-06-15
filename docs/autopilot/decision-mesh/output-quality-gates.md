# Output Quality Gates

Model output must be scored before adoption.

Score dimensions:

- task relevance
- instruction following
- source grounding
- local-code support
- privacy and redaction compliance
- implementation safety
- uncertainty and disagreement handling
- artifact completeness
- verification readiness

Decision thresholds:

- `90+`: may be proposed for adoption after local verification.
- `75-89`: advisory only; extract follow-up checks before adoption.
- `<75`: reject or rerun with a corrected prompt/context packet.
- missing output: block the advisory workflow and record provider failure.

Adoption requires:

- source pointer or local file reference
- verifier identity
- reason for adoption
- accepted changes or explicit no-op outcome
- residual risks

Rejected outputs should record:

- why the output was not adopted
- whether the prompt was too broad, stale, or missing context
- whether another provider or local check is required

Quality scores are not canonical business truth. They only govern whether model advice is safe enough to turn into a human-reviewed plan or local code/doc change.
