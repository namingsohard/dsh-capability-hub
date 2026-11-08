# Capability Hub

**A DSH plugin that makes Skills, MCP servers and plugin capabilities manageable per Session.**

DeepSeek Harness lets a plugin, a Skill or an MCP server exist — but answering *"is this actually in front of the model right now?"*
usually means reading `cordis.patch.yml`, the profile manifest and the transcript side by side.
Capability Hub replaces that with one idea: a **capability preset** — a named, complete set of capabilities that a
Session starts from and can be tuned away from while it runs.

It answers five questions without reading any config file:

- Is it **installed**?
- Is it **enabled**?
- Which **preset** puts it into a Session?
- Does **this** Session expose it?
- Does the **model** actually see it?

```text
Settings → Capabilities → Presets      define what a Session may get
Session panel (composer chip)         pick a preset, tune this Session
Model view                            see what the model really got, and why not
```

---

## Features

- **Capability presets** — a library of named, full capability sets. Create from a blank sheet or from the default
  baseline, edit, rename, export/import as JSON, set a per-workspace default, delete.
- **Capability directories** — group installed capabilities into scenes (*browser*, *long-term memory*) holding any
  mix of MCP servers, plugins and Skills. Presentation only; a capability may sit in many directories.
- **Capability plugins** — register a third-party DSH plugin as a capability provider, let the *preset* decide which
  Sessions mount it, and release it back to profile-wide enablement when you are done.
- **Per-Session MCP** — a server is mounted only for the Sessions that expose it, on that Session's agent scope.
- **Per-Session Skill states** — `auto` / `manual` / `off`, enforced without touching a single file on disk.
- **Composer chip + session header action** — live count of exposed MCP servers and model-visible Skills for the
  current Session; one click opens the Session capability panel.
- **Model view** — visible tools (with the MCP server or plugin that supplied them), the Skill catalog, prompt
  sections contributed by MCP servers and plugins, an estimated token cost, and what is *not* exposed with the reason.
- **Skill import** — copy Skills from Codex (`~/.codex/skills`), Claude Code (`~/.claude/skills`) or
  `~/.agents/skills` into `~/.dsh/skills`. Source directories are never modified.
- **No build step, no runtime dependencies** — the package is plain ESM JavaScript; everything DSH-side is resolved
  through the host loader at runtime.

---

## Requirements

| | |
|---|---|
| DSH | **0.2.1-rc.1 or newer** — there is deliberately **no upper bound**, so a DSH upgrade never disables this plugin |
| Node | 22+ (whatever the DSH runtime ships) |
| Platform | the desktop / web profile (`platform: web` for the client half) |

The version floor is a floor, not a window: the plugin asks for a harness **at least** this new. If a future DSH
release changes a mechanism this plugin depends on, it degrades loudly in the UI (see
[Compatibility](#compatibility)) rather than refusing to load.

---

## Install

### From GitHub

```bash
dsh plugin --profile desktop add github:namingsohard/dsh-capability-hub
```

Pin a release when you want reproducible Sessions:

```bash
dsh plugin --profile desktop add github:namingsohard/dsh-capability-hub#v0.4.0
```

Then **restart DSH**. The host half is composed at startup, so a newly added bundle is not live until the restart;
the client half appears after the restart with the rest of the Settings page.

### From a local checkout (development)

```bash
git clone https://github.com/namingsohard/dsh-capability-hub.git
dsh plugin --profile desktop add link:$(pwd)/capability-hub
```

or point the GUI's **Plugins → Add plugin** at the package directory.

> Install one way or the other, not both: a profile that has both a `link:` entry and a registry entry for the same
> package loads the plugin twice.

### Verify

1. **Settings → Capabilities** exists and the Presets tab is the landing view.
2. No "host is outdated" banner appears (the client compares its API level with the host's; a mismatch means only
   one half was updated — restart DSH).
3. Sessions created before the install are adopted immediately; new Sessions follow the workspace default preset.

---

## Quick start

1. Open **Settings → Capabilities → MCP** and add a server (form, or paste an `mcpServers` JSON block).
2. **Settings → Capabilities → Presets**: create a preset, tick the servers / plugins / Skills it contains.
3. Make it the **workspace default** (or select it per Session).
4. Open a Session, click the **Capabilities** chip beside the composer.
5. Tune that Session, then **Save as preset** (new) or **Update preset** (existing).

An MCP server is connected **only for the Sessions that expose it**. Every Session gets its own connection; removing
it disposes the connection and its tools.

---

## Concepts

### Preset semantics

A preset is the **complete desired capability set** for one Session: which MCP servers are mounted, which capability
plugins run, and which Skills are exposed.

- **Applying a preset overwrites the Session's selection.** It is not a merge — that is what makes "Session 3 looks
  like Session 1" true.
- **No preset selected** means *follow the workspace default*, which falls back to the global default preset.
- **A Session never re-follows a changed preset on its own.** Editing a preset changes what the *next* Session gets;
  a live Session keeps its own copy and shows *tuned manually* until you apply again.
- **New presets are baselines** (`sparse`): they list what they add or exclude, and a Skill installed later still
  follows the install. Switch to *snapshot* (`explicit`) when you want a reproducible list.

| Mode | A Skill the preset does not list | Typical user |
|---|---|---|
| `sparse` (baseline) | follows what is installed → `auto` | the default preset, and libraries migrated from v0.1 |
| `explicit` (snapshot) | counts as not included → `off`, marked *not included* | presets captured from a Session |

A snapshot preset writes out every installed Skill, so a Skill installed later is visibly absent instead of silently
enabled. A baseline keeps up with new installs.

- **Drift** — what the default preset has and this preset does not. The Session panel offers a one-click sync, which
  adds those items to the Session (and therefore marks it tuned).
- **Missing** — a preset keeps referencing a deleted MCP server, an unregistered capability plugin or an uninstalled
  Skill, so the gap stays visible instead of silently shrinking the preset. The reference comes back into effect if
  the definition returns.

### Capability directories

A directory is a user-owned grouping of *installed* capabilities, not a capability set: it never changes what a
Session runs. It makes the library browsable by scene instead of by kind, and it is what the preset editor ticks
through.

- The Session panel shows the same capabilities as a **directory tree**: a collapsed header per directory with an
  `N items · x MCP · y plugins · z Skills` summary, and inside it the capabilities grouped by kind.
- Directories expand one at a time or all at once; the header keeps *select all / clear all / edit / delete*.
- A directory keeps its members even after a capability is uninstalled, and the row says so — exactly like a preset
  reference. Anything in no directory appears under *unfiled*, so nothing becomes unreachable.
- Creating a preset starts from a blank sheet, with an optional "start from the default preset" checkbox.

See [`docs/v0.4-capability-directory.md`](docs/v0.4-capability-directory.md) (Chinese).

### Skill states

| State | Model catalog | `skill` tool | User `/name` |
|---|---|---|---|
| Auto | listed | loadable | available |
| Manual | hidden | not loadable | available |
| Off | hidden | not loadable | hidden |

Per-Session overrides can only **tighten** the file's own invocation policy. A Skill whose frontmatter says
`disable-model-invocation: true` cannot be promoted to Auto from the UI.

**Every Skill, one place.** A Skill is managed here whether it came from `~/.dsh/skills`, a project `.dsh/skills`,
a bundled Skill provider, or another plugin. The authority is the harness **`skills` service** — the same list the
model catalog and the Session policy see — with the two managed directories merged on top. That is what keeps
Settings, the directories and the Session panel from disagreeing about whether a Skill is installed.

Only the two managed roots are *removable*. A built-in Skill is listed, marked **built-in**, and can be toggled per
preset or per Session like any other; there is simply no file to delete.

#### How a Skill state is enforced

The state is a per-Agent **provider shadow** (`capability-policy`) registered into that Agent's own `skills` scope:
for every Skill the Session turns `manual` / `off`, the hub re-publishes the Skill with the tightened `invocation` at
a lower `rank` than any real provider, so the shadow wins every read — system prompt, `<available_skills>` catalog,
`skill` tool. Nothing is written to disk and no other Session is affected.

Two details make that work, and both were wrong once:

- **Enumerate through the Agent's enclosing scope, not the root.** Skill *providers* are composed inside each Agent
  preset's scope, while the `skills` service is a root row. A provider files its candidates into the *preset* layer,
  so an unscoped `list()` sees only the global layer, finds nothing, and the shadow set comes out empty — a hidden
  Skill stays in the model catalog. The hub reads with `scope` set to the Agent's nearest ancestor scope, which also
  leaves out the policy's own layer, so the read cannot re-enter itself.
- **Read back and say so.** A shadow that never lands is silent, because the service swallows provider errors. After
  installing the policy the hub re-reads the real catalog and records `{ok, visible, leaked}`; the Skills section
  shows a warning naming any Skill the model can still see.

---

## Capability plugins

A third-party DSH plugin can become part of a preset: register it once, and the **preset** decides which Sessions
mount it — not the profile.

```text
Settings → Plugins → Register plugin → pick a plugin → Inspect
  → "decided at session start" → Take over
Session panel → a preset with it ticked → this Session has its tools and its prompt section
                                       → other Sessions do not
```

- **Takeover** turns the plugin off profile-wide through `pluginManager.setPluginEnabled`, so it stops running
  everywhere and becomes "installed, not composed". The hub never edits `cordis.patch.yml` by hand.
- **A new registration joins the default preset**, so installing and registering a plugin is enough for Sessions
  that follow the baseline. A baseline you have curated by hand is never re-filled automatically.
- **Mount** happens per Session on that Session's agent scope, after MCP and before the first turn.
- `mountAt: session-start` (default) is for anything that injects into the system prompt: it is decided before the
  first turn and cannot change mid-Session without invalidating the prompt cache. Switching it mid-Session reports
  `deferred` (not mounted yet) or `locked` (kept until the Session ends) instead of lying.
- `mountAt: any-time` is for tools-only plugins and can be toggled at a turn boundary.
- **Release** gives the plugin back to the profile and cleans every preset reference, reporting which presets changed.

Only **third-party** plugins are managed here; DSH's own plugins *are* the harness. A plugin that is a client-only
bundle, has no profile patch, or needs a service an Agent scope cannot provide is reported as *profile-wide only*
with the reason, and cannot be registered.

**Exceptions that cannot be per-Session, by nature.** A plugin that registers a *process-wide* resource — an HTTP
route, a websocket upgrade, a listening port — can only exist once in the process. Mounting such a plugin in a second
Session fails with a duplicate-registration error from the host. The hub recognises that failure, remembers it on the
provider record, explains it in both the Settings row and the Session panel, and from then on names the Session that
holds it instead of retrying blindly. The fix is to **release** the plugin back to profile-wide enablement;
per-Session switching is for scope-safe plugins.

The mountability verdict is a cached prediction, not truth: the **Model View** is where you see what the model
actually got. Contribution diffs (which tools and prompt sections appeared when the plugin mounted) are recorded per
Session and shown there.

---

## Data and privacy

```text
~/.dsh/
  skills/                           # DSH-managed Skill installs
  capabilities/
    library.json                    # v2: MCP definitions, presets, workspace defaults, capability providers, directories
    library.v1.backup.json          # written once when a v1 library is migrated
    sessions/<sessionId>.json       # per-Session selection (mcp, skills, plugins)
    trash/                          # removed Skills, kept for recovery
```

Capability **registration** is the one thing that touches the profile: `pluginManager.setPluginEnabled` writes a
single `- id: <patchId>` / `disabled: true` line when you take a plugin over, and removes it when you release it.
This plugin never reads or writes `cordis.patch.yml` itself, and the MCP lifecycle still belongs to the plugin.

> **Secrets.** MCP `env` and `headers` values live in `library.json` in plain text. Prefer `${ENV_NAME}` references.
> The UI never sends stored values back to the browser, but the file itself is plain text — treat it like `.env`.

---

## Project layout

```text
capability-hub/
  index.js                  host entry: inject list, agent/created + agent/disposed wiring, teardown
  client.js                 client half: Settings page, composer chip, header action, overlay panel (no build step)
  cordis.patch.yml          bundle patch: one `capability-hub` row
  host/
    api.js                  /api/capability-hub — authenticated same-origin JSON endpoint
    store.js                library persistence, v1 → v2 migration, Session sidecars
    presets.js              pure: normalisation, capture, resolution, drift, Skill-state rules
    providers.js            pure: provider record shape, mount timing, desired-set comparison, view shape
    catalogs.js             pure: directory model, resolution, unfiled bucket
    capability-catalog.js   the only module that calls pluginManager / loader.import
    session.js              applying presets, per-agent Skill policy, provider mounting, provenance
    mcp.js                  one dsh-mcp-client instance per Session, through ctx.loader.import
    skills.js               Skill scan, import sources, deletion, harness-service merge
    util.js                 paths, ids, HOST_API level
  docs/                     design and implementation blueprints (Chinese)
  locale/                   UI strings (zh / en)
```

The client half is a single file on host theme tokens, and it uses **in-app dialogs** — never
`window.confirm/alert/prompt`, which a host shell can swallow and turn a destructive action into a silent no-op.

---

## Compatibility

- The plugin declares a **version floor with no ceiling** for DSH, so upgrading the harness does not disable it.
- `HOST_API` / `CLIENT_API` are a handshake, not a version number: the client tells you when it is running against an
  older host instead of failing with `Unknown action "…"`.
- Things that could break in a future harness are the mechanisms listed in the design docs: the `skills` service and
  its layered scope model, `agent/created` ordering, `ctx.systemPrompt.assemble({agent, scope})`,
  `pluginManager.setPluginEnabled`, and the host `webserver` route table. Each of them is exercised by the test suite.
- If one of them changes, the plugin's characteristic failure mode is a **warning in the UI** (policy not landing,
  mount verdict unknown, model view empty) rather than a crash or a silently wrong Session.

## Known limitations

- No MCP OAuth flow yet; remote servers that require OAuth are marked unsupported.
- Forked Sessions do not inherit their source Session's preset; they use the workspace default.
- The `/` Skill menu may cache its catalog after an in-Session policy change; the model catalog and the `skill` tool
  are authoritative.
- MCP server names are stable once created; renaming one changes tool names and can break existing history.
- There is no tool-level MCP filter yet; MCP is exposed at server granularity.
- A capability plugin is judged by static checks (module shape, entry addressability, `inject` resolvability). A
  plugin whose *module-level* state leaks between Sessions cannot be detected that way; the verdict is a prediction
  and the Model View is the truth.
- A plugin that registers a process-wide resource (HTTP route, port) cannot be mounted by two Sessions. The hub learns
  this from the host's duplicate-route error and reports it, but it cannot prevent the first failed attempt — release
  such a plugin instead of assigning it per Session.
- Taking a plugin over affects running Sessions immediately (the profile entry stops). The Session panel offers
  *Remount* to restore it in a Session that already lost it; there is no automatic remount.
- One version per plugin per profile: two versions of the same capability plugin cannot coexist.

## Development

The behavioural test suite (library migration, preset resolution and drift, provider takeover against a mocked plugin
manager, directory model, the full API surface, a real Cordis graph with a real stdio MCP server, jsdom end-to-end
UI flows) is maintained in the author's development workspace next to the package and is **not part of the published
package**. Contributions are welcome as issues that describe the behaviour you expected and what you saw instead.

Two practical notes if you hack on it:

- **A restart decision comes with every change to the host half.** The client half reloads with the page, but a
  `link:`ed package's host half only reloads when DSH restarts, because the profile watcher watches the *profile*
  directory and the linked package lives elsewhere. Without a restart the page runs new code against an old host —
  which is exactly what the `HOST_API` handshake turns into a banner instead of a mystery.
- **The registration path is one-way by design.** Taking a plugin over and releasing it must go through
  `pluginManager`; editing `cordis.patch.yml` by hand puts the hub and the profile out of sync.

The full v0.3 blueprint — data model, module design, flows, mountability verdicts, test plan, acceptance criteria and
the four pre-flight verifications with their measured results — is in [`docs/v0.3-blueprint.md`](docs/v0.3-blueprint.md),
and the v0.4 directory design is in [`docs/v0.4-capability-directory.md`](docs/v0.4-capability-directory.md)
(both in Chinese).

## Roadmap

- **Capability bundles** (`preset.bundles[]` / `library.bundles[]`): a directory that can be packaged and reused
  across workspaces, grouping a related MCP server with its Skills.
- Tool-level MCP filtering, so a server can be exposed partially.

## License

MIT — see [LICENSE](LICENSE).
