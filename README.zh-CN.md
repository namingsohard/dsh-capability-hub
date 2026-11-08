# Capability Hub（能力中心）

**一个把 Skills、MCP 服务器和插件型能力按「会话」管理的 DSH 插件。**

DeepSeek Harness 允许一个插件、一个 Skill、一个 MCP 服务器存在——但要回答「**它现在到底在不在模型眼前**」，
通常得同时翻 `cordis.patch.yml`、profile 清单和会话记录。本插件把这件事收成一个概念：**能力方案**
（capability preset）——一份具名的、完整的会话能力集合，会话从它启动，也可以在运行中偏离它。

它回答五个问题，不用打开任何配置文件：

- **装了没有**？
- **启用了没有**？
- 它被哪个**方案**带进会话？
- **这个**会话对外暴露了它吗？
- **模型**真的看到了吗？

```text
设置 → 能力 → 方案                 定义「会话能拿到什么」
会话面板（输入框旁的能力胶囊）      选方案、就地调这个会话
模型视图                          看模型真正拿到了什么，以及没拿到为什么
```

---

## 功能

- **能力方案**：一份具名、完整的会话能力集合库。可以从空白起步或「以默认方案为起点」，编辑、改名、导出/导入
  JSON、按工作区设默认、删除。
- **能力目录**：把已安装的能力按场景分组（*浏览器*、*长期记忆*），每组可以混放 MCP 服务器、插件和 Skills。
  只影响展示与勾选，不影响运行；一个能力可以同属多个目录。
- **插件型能力**：把第三方 DSH 插件注册成能力提供者，由**方案**决定哪些会话挂载它；用完了可以「释放」回
  profile 全局启用。
- **按会话的 MCP**：服务器只为暴露它的会话挂载，挂在那个会话的 agent 作用域上，各会话各自一条连接。
- **按会话的 Skill 状态**：`auto` / `manual` / `off`，落盘一个字节都不写。
- **能力胶囊 + 会话头部按钮**：实时显示当前会话暴露的 MCP 数量与模型可见的 Skill 数量，一键打开会话能力面板。
- **模型视图**：可见工具（连同它由哪个 MCP 服务器或插件提供）、Skill 目录、MCP 与插件贡献的 prompt 段、估算
  token 成本，以及**没暴露的能力与原因**。
- **Skill 导入**：把 Codex（`~/.codex/skills`）、Claude Code（`~/.claude/skills`）或 `~/.agents/skills` 里的
  Skill 复制进 `~/.dsh/skills`。来源目录永远只读。
- **无构建步骤、无运行时依赖**：包里是纯 ESM JavaScript，DSH 侧的一切都在运行时通过宿主 loader 解析。

---

## 运行要求

| | |
|---|---|
| DSH | **0.2.1-rc.1 及以上**——故意**不设上限**，所以升级 DSH 不会让这个插件失效 |
| Node | 22+（跟随 DSH 运行时自带的版本） |
| 平台 | desktop / web profile（客户端半边的 `platform` 为 `web`） |

这个版本号是**下限**，不是窗口：插件只要求宿主「至少这么新」。如果将来某个 DSH 版本改掉了本插件依赖的某个
机制，它会在 UI 里**明确地降级报警**（见[兼容性](#兼容性)），而不是拒绝加载。

---

## 安装

### 从 GitHub 安装

```bash
dsh plugin --profile desktop add github:<owner>/capability-hub
```

需要可复现的会话时钉住版本：

```bash
dsh plugin --profile desktop add github:<owner>/capability-hub#v0.4.0
```

装完**重启 DSH**。host 半边在启动时编排，新加入的 bundle 不重启不会真的生效；重启后客户端半边随设置页一起出现。

### 从本地检出安装（开发用）

```bash
git clone https://github.com/<owner>/capability-hub.git
dsh plugin --profile desktop add link:$(pwd)/capability-hub
```

也可以让 GUI 的 **插件 → 添加插件** 指向这个包目录。

> 两种方式只选一种：同一个包里既有 `link:` 条目又有注册表条目，插件会被加载两份。

### 装完自检

1. **设置 → 能力** 存在，落地页是「方案」标签。
2. 没有出现「宿主端还是旧版本」的横幅（客户端会与宿主的 API 级别握手，不一致说明只更新了一半——重启 DSH）。
3. 安装前就存在的会话会被立即接管；新会话跟随工作区默认方案。

---

## 快速上手

1. **设置 → 能力 → MCP**：新增一个服务器（表单，或直接粘贴一段 `mcpServers` JSON）。
2. **设置 → 能力 → 方案**：新建方案，勾选它包含的服务器 / 插件 / Skills。
3. 把它设为**工作区默认**（或按会话选择）。
4. 打开会话，点输入框旁的**能力**胶囊。
5. 就地调整，然后**存为新方案**或**更新方案**。

MCP 服务器**只为暴露它的会话**连接。每个会话一条独立连接；移除即断开连接并收回它的工具。

---

## 概念

### 方案语义

方案是一个会话的**完整期望能力集**：挂哪些 MCP 服务器、跑哪些插件型能力、暴露哪些 Skill。

- **应用方案会覆盖会话当前的选择**，不是合并——这才让「会话 3 看起来和会话 1 一样」成立。
- **没选方案**＝*跟随工作区默认*，再退到全局默认方案。
- **会话不会自己跟随被改动的方案**。改方案只影响**下一个**会话；运行中的会话保留自己那份，并显示「已手动调整」，
  直到你重新应用。
- **新建方案默认是基线**（`sparse`）：只列出它新增或排除的东西，之后再装的 Skill 仍然跟随安装状态。想要可复现的
  清单，在编辑器里切成**快照**（`explicit`）。

| 模式 | 方案里没列出的 Skill | 典型使用者 |
|---|---|---|
| `sparse`（基线） | 跟随安装状态 → `auto` | 默认方案、从 v0.1 迁移来的库 |
| `explicit`（快照） | 视为未纳入 → `off`，标「未纳入」 | 从会话捕获出来的方案 |

快照方案会把当时所有已安装的 Skill 都写出来，所以之后新装的 Skill 会**显式缺席**，而不是悄悄生效。基线则会跟着
新安装一起长。

- **漂移（drift）**：默认方案有、而这个方案没有的东西。会话面板提供一键同步，把这些条目加进会话（于是会话被标记为
  已手动调整）。
- **缺失（missing）**：方案会一直保留对已删除的 MCP 服务器、未注册的插件、已卸载的 Skill 的引用，让缺口**可见**，
  而不是悄悄把方案缩水。定义回来时，这个引用自动恢复生效。

### 能力目录

目录是用户自建的、对**已安装**能力的归组，不是能力集合：它永远不改变会话跑什么。它让能力库可以按场景而不是按类型
浏览，也是预设编辑器的勾选来源。

- 会话面板把同样的能力显示成一棵**目录树**：每个目录是一个折叠的标题行，带
  `N items · x MCP · y plugins · z Skills` 摘要，展开后按类型（MCP / 插件 / Skills）分组。
- 目录可以逐个展开，也可以全部展开；标题行保留*全选 / 全清 / 编辑 / 删除*。
- 能力被卸载后目录**仍然保留**这个成员，并在行上注明——和方案引用一样。不在任何目录里的能力归入「未归入目录」，
  保证没有东西变得不可达。
- 新建方案从空白开始，另有「以默认方案为起点」复选框。

详见 [`docs/v0.4-capability-directory.md`](docs/v0.4-capability-directory.md)。

### Skill 状态

| 状态 | 模型目录 | `skill` 工具 | 用户 `/name` |
|---|---|---|---|
| Auto | 列出 | 可加载 | 可用 |
| Manual | 隐藏 | 不可加载 | 可用 |
| Off | 隐藏 | 不可加载 | 隐藏 |

按会话的覆盖**只能收紧**文件自身的调用策略。frontmatter 写着 `disable-model-invocation: true` 的 Skill，无法从 UI
里提回 Auto。

**所有 Skill，一处管理。** 无论一个 Skill 来自 `~/.dsh/skills`、项目的 `.dsh/skills`、内置的 Skill provider，
还是别的插件，都在这里管。事实源是 harness 的 **`skills` 服务**——和模型目录、会话策略看到的是同一份——再把两个
管理根目录合并上去。这就是设置页、能力目录和会话面板不会对「某个 Skill 装没装」各说各话的原因。

只有两个管理根里的 Skill 可删。内置 Skill 会列出并标**内置**，可以像别的 Skill 一样按方案或按会话切换，只是没有
文件可删。

#### 状态是怎么被强制的

状态是一个**按 agent 的 provider 影子**（`capability-policy`），注册进该 agent 自己的 `skills` 作用域：会话把某个
Skill 置为 `manual` / `off` 时，影子以比任何真实 provider 更低的 `rank` 重新发布这个 Skill（收紧后的 `invocation`），
于是每一次读取——系统提示、`<available_skills>` 目录、`skill` 工具——都由影子胜出。不落盘，也不影响其它会话。

让它成立的这两个细节，都曾经错过：

- **要从 agent 的外围作用域枚举，不是从根。** Skill 的 *provider* 编排在每个 agent preset 的作用域里，而 `skills`
  服务本身是根行。provider 把候选落进 *preset* 图层，所以不带 scope 的 `list()` 只看得到 global 层、返回空表——
  影子集为空，被隐藏的 Skill 照样留在模型目录里。插件改用 `scope` = agent 的最近祖先作用域来读，这样也天然排除了
  策略自己的层，读取不会自我递归。
- **读完要回读并说明。** 影子没落地是**静默**的，因为服务会把 provider 的异常吞掉。装完策略后插件会回读真实目录，
  记录 `{ok, visible, leaked}`；Skills 段在模型仍能看到某个 Skill 时给出点名警告。

---

## 插件型能力

第三方 DSH 插件可以成为方案的一部分：注册一次，之后由**方案**决定哪些会话挂载它——而不是 profile。

```text
设置 → 插件能力 → 注册插件 → 选一个插件 → 检查
  → 「会话启动时决定」→ 接管
会话面板 → 勾选了它的方案 → 这个会话有它的工具和 prompt 段
                          → 其它会话没有
```

- **接管**通过 `pluginManager.setPluginEnabled` 把插件在 profile 层关掉，于是它哪里都不跑，变成「已安装、未编排」。
  插件从不手写 `cordis.patch.yml`。
- **新注册的插件会自动加入默认方案**，所以「装上 + 注册」就够让跟随基线的会话拿到它。但你手工整理过的基线不会被自动
  重新填充。
- **挂载**按会话发生，在 MCP 之后、首轮对话之前，挂在该会话的 agent 作用域上。
- `mountAt: session-start`（默认）给所有会注入系统提示的插件：它在首轮之前决定，中途改变会作废 prompt 缓存。中途切换
  只报 `deferred`（还没挂上）或 `locked`（保持到会话结束），不会撒谎。
- `mountAt: any-time` 给只有工具的插件，可以在轮次边界上开关。
- **释放**把插件还给 profile，并清理所有方案引用，同时报告哪些方案被改了。

这里只管**第三方**插件；DSH 自己的插件**就是** harness。一个纯客户端的 bundle、没有 profile patch、或者需要 agent
作用域提供不了的服务的插件，会被判为*仅能全局使用*并给出原因，无法注册。

**有些例外天生无法按会话挂载。** 注册**进程级资源**的插件——HTTP 路由、websocket upgrade、监听端口——在进程里只能
存在一份。把它挂到第二个会话会收到宿主的重复注册错误，例如 `webserver: duplicate exact route "/wiki/tree"`。插件会
识别这类失败、记在 provider 记录上、在设置行和会话面板里双向解释，之后不再盲目重试，而是点名是哪个会话占着它。
这类插件的正确处置是**释放**回全局启用；按会话切换只适用于作用域安全的插件。

可挂载性判定是**缓存的预测**，不是真理：**模型视图**才是模型真正拿到了什么的地方。挂载前后贡献的差集（多出了哪些
工具与 prompt 段）会按会话记录并在那里显示。

---

## 数据与隐私

```text
~/.dsh/
  skills/                           # DSH 管理的 Skill 安装目录
  capabilities/
    library.json                    # v2：MCP 定义、方案、工作区默认、插件提供者、能力目录
    library.v1.backup.json          # v1 库迁移时写一次
    sessions/<sessionId>.json       # 按会话的选择（mcp、skills、plugins）
    trash/                          # 删除的 Skill，留着可恢复
```

唯一会碰到 profile 的是**能力注册**：接管时 `pluginManager.setPluginEnabled` 写一行 `- id: <patchId>` /
`disabled: true`，释放时删掉它。本插件从不自己读写 `cordis.patch.yml`，MCP 的生命周期也仍然归插件所有。

> **保密提示。** MCP 的 `env` 与 `headers` 值以**明文**存在 `library.json` 里。优先用 `${ENV_NAME}` 引用。UI 不会把
> 已存的值回传给浏览器，但文件本身是明文——按 `.env` 的等级对待它。

---

## 项目结构

```text
capability-hub/
  index.js                  host 入口：inject 列表、agent/created + agent/disposed 接线、拆除
  client.js                 客户端半边：设置页、能力胶囊、头部按钮、浮层面板（无构建步骤）
  cordis.patch.yml          bundle patch：一行 `capability-hub`
  host/
    api.js                  /api/capability-hub —— 同源鉴权的 JSON 接口
    store.js                库持久化、v1 → v2 迁移、会话 sidecar
    presets.js              纯逻辑：归一化、捕获、解析、漂移、Skill 状态规则
    providers.js            纯逻辑：provider 记录形状、挂载时机、desired 比较、展示形状
    catalogs.js             纯逻辑：目录模型、解析、未归入目录
    capability-catalog.js   唯一调用 pluginManager / loader.import 的模块
    session.js              应用方案、per-agent Skill 策略、挂载 provider、来源标注
    mcp.js                  每个会话一个 dsh-mcp-client 实例，走 ctx.loader.import
    skills.js               Skill 扫描、导入来源、删除、与 harness 服务合并
    util.js                 路径、id、HOST_API 级别
  docs/                     设计与实现蓝图
  locale/                   UI 文案（zh / en）
```

客户端半边是单文件、全部使用宿主主题 token，并且坚持使用**应用内对话框**——从不用
`window.confirm/alert/prompt`：宿主外壳可能把这些原生对话框吞掉，让一个破坏性操作变成静默无操作。

---

## 兼容性

- 插件对 DSH 声明的是**只有下限、没有上限**的版本要求，所以升级 harness 不会让它失效。
- `HOST_API` / `CLIENT_API` 是一次**握手**而不是版本号：客户端在跑着旧宿主时直接告诉你，而不是抛一个
  `Unknown action "…"` 让人去猜。
- 未来 harness 有可能改动的，是设计文档里列出的那几个机制：`skills` 服务及其分层作用域模型、`agent/created` 的
  触发时序、`ctx.systemPrompt.assemble({agent, scope})`、`pluginManager.setPluginEnabled`、宿主 `webserver`
  的路由表。它们每一个都被测试套件覆盖。
- 万一其中一个变了，本插件的典型失败形态是**UI 里的警告**（策略没落地、挂载判定未知、模型视图为空），而不是崩溃或
  一个悄悄出错的会话。

## 已知限制

- 还没有 MCP OAuth 流程；需要 OAuth 的远程服务器标记为不支持。
- Fork 出来的会话不继承源会话的方案，使用工作区默认。
- `/` 菜单的 Skill 目录可能在会话内策略变化后仍然滞后；以模型目录和 `skill` 工具为准。
- MCP 服务器名一旦创建就固定；改名会改变工具名，并可能破坏既有历史。
- 还没有工具级的 MCP 过滤，MCP 以服务器为粒度暴露。
- 插件型能力的判定基于静态检查（模块形状、条目可寻址、`inject` 可解析）。*模块级*状态在会话间泄漏的插件，静态检查
  查不出来；判定是预测，模型视图才是真相。
- 注册进程级资源（HTTP 路由、端口）的插件无法被两个会话同时挂载。插件能从宿主的重复路由错误中学到这点并报告，但
  挡不住第一次失败——这类插件请「释放」而不是按会话分配。
- 接管插件会**立刻**影响运行中的会话（profile 条目停了）。会话面板提供「重新挂载」把它还回已经丢掉它的会话；没有
  自动重挂。
- 一个 profile 里同一个插件只能有一个版本：同一能力插件的两个版本无法共存。

## 开发

行为测试套件（库迁移、方案解析与漂移、对 mock plugin manager 的接管/释放、目录模型、完整 API 面、真实 Cordis 图配真实
stdio MCP 服务器、jsdom 端到端 UI 流程）维护在作者的开发工作区里，与包并列，**不随包发布**。欢迎用 issue 描述你期望的
行为和你看到的实际行为。

如果你要改它，两条实践经验：

- **改 host 半边就带着「要不要重启」的决定。** 客户端半边随页面刷新，但 `link:` 安装的包的 host 半边只有 DSH 重启才
  重新编排，因为 profile 的 watcher 盯的是 *profile* 目录，而被链接的包在别处。不重启就会出现「新代码跑在旧宿主上」——
  这正是 `HOST_API` 握手要变成横幅而不是谜团的原因。
- **注册这条路径是单向的。** 接管和释放都必须走 `pluginManager`；手改 `cordis.patch.yml` 会让插件和 profile 失去同步。

完整的 v0.3 蓝图——数据模型、模块设计、流程、可挂载性判定、测试计划、验收标准，以及开工前四次验证及其实测结果——
见 [`docs/v0.3-blueprint.md`](docs/v0.3-blueprint.md)；v0.4 的能力目录设计见
[`docs/v0.4-capability-directory.md`](docs/v0.4-capability-directory.md)。

## 路线图

- **能力包**（`preset.bundles[]` / `library.bundles[]`）：把能力目录打包复用，跨工作区共享，把相关的 MCP 服务器和它的
  Skills 归到一起。
- 工具级的 MCP 过滤，让一个服务器可以被部分暴露。

## 许可证

MIT，见 [LICENSE](LICENSE)。
