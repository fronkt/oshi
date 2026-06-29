# Lessons

## 2026-06-29 — Don't blanket-apply IP caution; distinguish host vs distributor
**Correction:** I set a guardrail "stickers = original art only, no copyrighted anime images."
User pushed back: users *import their own* stickers (from Pinterest, anywhere), Oshi isn't
selling them.

**Pattern:** For user-generated/user-imported content, the liability model is **host (DMCA safe
harbor)**, not **distributor**. Discord/Telegram operate this way. Blanket "no copyrighted
content" caution is wrong for UGC. The real, narrow requirements are: don't *ship/sell* curated
copyrighted packs yourself, and keep safe-harbor hygiene (DMCA agent + takedown + repeat-infringer
policy). Only content **Oshi itself distributes** (e.g. a default pack) must be original/licensed.

**How to apply:** When flagging IP/legal risk, first ask "is the platform hosting user content or
distributing its own?" Calibrate the caution to that — don't impose distributor-grade rules on a
host-model feature.

## 2026-06-29 — Decouple the moat from the critical path
Mangamood's tone engine was framed as shared between the recommender and the social app. But the
social MVP doesn't need it (Airbuds' own compat score is shallow title-overlap). Pulling the
expensive/unproven engine *off* the critical path of the riskiest bet (retention) let us ship a
cheap read+write v0 and keep the engine as a v2 upgrade. Lesson: when two products "share an
engine," check whether the riskier product actually *needs* it at MVP — often the engine is a
later differentiation layer, not a prerequisite.
