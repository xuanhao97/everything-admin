---
description: Implementing designs and building UI
---

- Reuse UI components from `/components/ui` whenever possible.
- Create new components only when no existing primitive solves the problem.
- If a new UI block or pattern is needed, add it under `/components` with a minimal, clear API.
- For any new page or feature:
  - Put page-level layouts/templates in `features/{feature_name}/templates`
  - Put feature-specific components in `features/{feature_name}/components`
- Prefer composing existing primitives instead of reinventing them.
- Ask the human for direction when components or designs are missing or ambiguous.
