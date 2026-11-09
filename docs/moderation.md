# Moderation

How the pending-review queue works, what a moderator can do, and the
runbook for common operations.

---

## Why moderation exists

Every new Skill submitted through the publish form or through
`skills:submit` lands with `moderationStatus: "pending"`. It stays
invisible to the public catalogue and to anonymous visitors on the
submitter's profile until a moderator explicitly approves it.

Two reasons:

1. **Spam / reputation inflation.** The reputation score awards +50
   per published Skill. Without a moderation gate, a scripted caller
   could submit a batch of empty Skills and immediately climb the
   leaderboard.
2. **Legal / brand risk.** A listing posted under a famous handle
   (think `@anthropic`, `@openai`) can be mistaken for an endorsed
   product. A quick human review stops that before it goes public.

Approved Skills behave exactly as before: visible in the catalogue,
count toward reputation, searchable.

---

## Who can see a pending Skill

| Viewer | What they see |
|---|---|
| **The submitter**, signed in | Full detail page with a "Pending review" notice. Install, ratings, votes, My Status and comments are hidden — the submitter can't interact with their own unapproved listing. Their own profile shows the Skill card with a "Pending review" badge. |
| **Anyone else**, signed in | 404 on the detail URL, pending Skill hidden from the submitter's public profile. The /skills catalogue does not list it. |
| **Anonymous visitors** | Same as above. |

Legacy rows (created before the moderation gate shipped) have
`moderationStatus: undefined` and are treated as approved — otherwise
the entire seed catalogue would retro-hide itself on deploy.

---

## Current moderation surface

For now the approve / reject actions run from the Convex CLI against
the production deployment. A dedicated `/admin/moderation` page is in
the backlog; until it ships, everything below uses one-liners.

**All commands run from the project root** (`marketplace/`). Running
`npx convex` without extra flags targets the deployment named in the
local `.env` file (`determined-finch-765` for production).

### List pending Skills

```bash
npx convex run skills:list '{}' \
  | python3 -c 'import json,sys; [print(s["slug"], "—", s["name"]) for s in json.load(sys.stdin) if s.get("moderationStatus") == "pending"]'
```

(`skills:list` already filters out pending for public callers, but
the Convex CLI bypasses that filter because it reads the raw rows
via its own privileged channel.)

Alternatively open the Convex dashboard → Data → `skills` table and
sort or filter by `moderationStatus`.

### Approve a Skill

```bash
npx convex run skills:moderateSkill '{"id":"<_id>","action":"approve"}'
```

The `id` is the Convex `_id`, visible in the dashboard. After this
call:

- The Skill becomes publicly listed in the catalogue, searchable,
  visible on other users' profiles.
- Its submitter's reputation increases by 50 (counted as it enters
  the "publicly visible" filter in `convex/profile.ts`).
- The "Pending review" notice on the detail page disappears, and
  Install / rating / vote / comment sections re-appear.

### Reject a Skill

```bash
npx convex run skills:moderateSkill '{"id":"<_id>","action":"reject"}'
```

- The row stays in the database with `moderationStatus: "rejected"`.
- It's hidden from the catalogue, the profile and anyone but the
  submitter.
- It doesn't count toward the submitter's reputation.

Rejecting is reversible — call `moderateSkill` again with
`"approve"` to flip it back.

### Delete a Skill

If the Skill is clearly abuse (hostile install command, impersonation,
copy-pasted spam), skip rejection and delete it outright. The cascade
cleans up installs, favourites, votes, ratings, comments, labels and
purchases so nothing is left pointing at the removed row.

```bash
npx convex run skills:deleteBySlug '{"slug":"<slug>"}'
```

Or, for a bulk cleanup by name prefix (defaults to dry-run):

```bash
# Preview what would be removed
npx convex run skills:deleteByNamePrefix '{"prefix":"[QA TEST]"}'
# Actually remove
npx convex run skills:deleteByNamePrefix '{"prefix":"[QA TEST]","dryRun":false}'
```

Dry-run returns `{ deleted: 0, dryRun: true, wouldDelete: [...] }` so a
moderator can eyeball the list before committing.

---

## Dealing with crawled Skills

`convex/crawl.ts` can mirror a public GitHub repo of Skills into the
catalogue (`crawlAnthropicSkills` is the shipped entry point). These
rows get `source: "crawled"` and a `submitterHandle` of
`github-anthropics` — the handle is deliberately not `anthropics`,
so listings don't read as an official account on this marketplace.

Every Skill detail page where `source === "crawled"` shows an amber
"Auto-discovered" disclaimer stating the listing isn't endorsed by
the repo owner and that trademarks remain with their owners.

To migrate historical crawled rows that still use the old handle:

```bash
npx convex run skills:renameSubmitterHandle \
  '{"from":"anthropics","to":"github-anthropics"}'
```

The helper is idempotent — later runs find no matches and return
`{renamed: 0}`.

---

## Reputation accounting

The reputation score lives in `convex/profile.ts` and
`convex/user.ts` and is derived on read, not stored. The formula is:

```
reputation = totalInstalls + approvedForRep.length * 50
```

Where `approvedForRep` is the submitter's Skills that are either
publicly approved or legacy (no `moderationStatus`). Pending and
rejected Skills contribute **nothing**.

Approving a Skill after a few days of install activity doesn't
retroactively lose the installs — those are counted on the Skill row,
not gated by moderation status.

---

## Appeals

There is no formal appeal workflow yet. If a submitter contests a
rejection, re-review by reading the Skill's detail page while signed
in as a moderator and calling `moderateSkill` again.

A proper `/admin/moderation` UI with an audit log is the right next
step — see `docs/improvement.md` for the broader backlog.
