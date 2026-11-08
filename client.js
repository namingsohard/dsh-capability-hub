window.__ModuleLoader__.load({
  id: 'capability-hub',
  factory(require) {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useState } = React;

    const NS = 'capabilityHub';
    /**
     * The host API level this bundle expects. Must match `HOST_API` in
     * `host/util.js`; a mismatch means the page is newer than the running host
     * (a linked plugin's host half only changes on a DSH restart).
     */
    const CLIENT_API = 3;

    const zh = {
      title: '能力中心',
      subtitle: '统一管理 Skills 与 MCP，并按会话控制模型实际能看到的能力。',
      settingsSubtitle: '这里管理本机安装的能力；每次会话的暴露范围在输入框旁的「能力」里调整。',
      refresh: '刷新',
      addMcp: '添加 MCP',
      pasteJson: '粘贴 JSON',
      importSkills: '导入 Skills',
      cancel: '取消',
      confirm: '确定',
      dialogError: '操作失败',
      hostOutdated: '宿主端还是旧版本',
      hostOutdatedHint: '界面已经更新，但插件宿主还在运行旧代码（link 安装的插件需要重启 DSH 才会重载宿主端）。重启 DSH 后这个功能就可用。',
      policyLeak: '技能策略未生效，模型仍然能看到',
      save: '保存',
      close: '关闭',
      delete: '删除',
      edit: '编辑',
      remove: '移除',
      name: '名称',
      transport: '传输方式',
      command: '命令',
      args: '参数',
      cwd: '工作目录',
      url: '地址',
      env: '环境变量',
      headers: '请求头',
      optional: '可选',
      skills: 'Skills',
      mcp: 'MCP',
      presets: '能力方案',
      importTab: '导入',
      emptySkills: '还没有安装 Skill。可以从 Codex、Claude Code 或 Agents 导入。',
      emptyMcp: '还没有 MCP server。添加一个 stdio 命令或 Streamable HTTP 地址。',
      emptyPresets: '还没有方案。在会话里调好能力后点「存为方案」，或直接新建一个。',
      installed: '已安装',
      notInstalled: '未安装',
      enabled: '已启用',
      disabled: '已停用',
      stateAuto: '自动',
      stateManual: '手动',
      stateOff: '隐藏',
      sourceUser: '用户',
      sourceProject: '项目',
      sourceCodex: 'Codex',
      sourceClaude: 'Claude Code',
      sourceAgents: 'Agents',
      sourceBuiltin: '内置',
      builtinNoPath: '内置 Skill，没有可删除的文件',
      tokens: 'tokens',
      tools: '工具',
      exposed: '本次暴露',
      notExposed: '未暴露',
      session: '本次会话',
      modelView: '模型视图',
      live: '会话进行中',
      notLive: '会话未激活；改动会保存，下次恢复时生效。',
      apply: '应用',
      applied: '已保存',
      saveAsPreset: '另存为新方案',
      workspaceDefault: '设为工作区默认',
      preset: '方案',
      mcpCount: 'MCP',
      skillCount: 'Skills',
      statusIdle: '未连接',
      statusConnecting: '连接中',
      statusReady: '已连接',
      statusFailed: '连接失败',
      retry: '重试',
      reasonNotExposed: '不在本方案中',
      reasonManual: '仅手动调用',
      reasonOff: '已隐藏',
      reasonDisabled: '已在能力库中停用',
      modelTools: '工具',
      modelSkills: 'Skills catalog',
      modelInstructions: 'MCP instructions',
      estimate: '估算上下文',
      description: '描述',
      path: '路径',
      confirmDeleteMcp: '删除这个 MCP server？已连接的会话会立即断开。',
      confirmDeleteSkill: '把 Skill 移到回收站？文件不会被永久删除。',
      parse: '解析',
      addAll: '全部添加',
      importSelected: '导入选中',
      replaceExisting: '覆盖同名 Skill',
      selectAll: '全选',
      clear: '清空',
      scanHint: '导入会复制到 ~/.dsh/skills，不会修改 Codex/Claude 目录。',
      chip: '能力',
      sessionTitle: '本次会话的能力',
      sessionSubtitle: '只影响当前会话；改动在下一轮消息生效。',
      changesSaved: '已应用',
      error: '出错了',
      loading: '加载中…',
      noSession: '还没有会话。',
      deletePreset: '删除方案',
      deletePresetHint: '删除后不可恢复。正在使用它的会话会回落到工作区默认方案。',
      defaultPreset: '默认方案',
      optionalSecrets: '留空则保留原有密钥',
      envHint: '每行 KEY=VALUE；支持 ${ENV_NAME} 引用环境变量。',
      argsHint: '空格分隔；含空格的参数请直接粘贴 JSON 数组。',
      pasteHint: '支持 {"mcpServers": {...}} 或直接的 server map。',
      imported: '导入完成',
      someFailed: '部分导入失败',
      reload: '重新读取',
      modelEmpty: '当前会话没有暴露任何能力。',
      native: '原生',
      fromMcp: 'MCP',
      notExposedSection: '未暴露',
      noItems: '没有',
      savePresetPrompt: '给这个方案起个名字',
      presetSaved: '方案已保存',
      workspaceDefaultSaved: '已设为当前工作区默认',
      back: '返回',
      next: '下一步',
      view: '查看',
      hide: '收起',
      show: '展开',
      all: '全部',
      none: '无',
      defaultPresetHint: '新会话默认使用它；可在会话面板里切换，也可为某个工作区单独指定默认。',
      importGroupEmpty: '这个来源没有可导入的 Skill。',
      mcpTarget: '目标',
      secretKeys: '密钥字段',
      noSecrets: '无',
      configured: '已配置',
      notConfigured: '未配置',
      editMcp: '编辑 MCP',
      newMcp: '添加 MCP',
      closePanel: '关闭能力面板',
      sessionCapabilities: '会话能力',
      toolCount: '个工具',
      skillCountLabel: '个 Skill',
      presetSelect: '选择方案',
      currentPreset: '当前方案',
      saveFailed: '保存失败',
      removeFailed: '删除失败',
      scanFailed: '扫描失败',
      importFailed: '导入失败',
      loadFailed: '读取失败',
      mcpNamePlaceholder: '例如 github',
      commandPlaceholder: 'npx',
      argsPlaceholder: '-y @modelcontextprotocol/server-github',
      urlPlaceholder: 'https://example.com/mcp',
      envPlaceholder: 'GITHUB_TOKEN=${GITHUB_TOKEN}',
      headersPlaceholder: '{"Authorization":"Bearer ${TOKEN}"}',
      jsonPlaceholder: '{"mcpServers":{"github":{"command":"npx","args":["-y","@modelcontextprotocol/server-github"]}}}',
      noDescription: '没有描述',
      installedAt: '安装于',
      toolList: '工具列表',
      instructionsHint: '这些是 MCP server 自带的 instructions，会进入 system prompt。',
      modelEstimateHint: '按字符数粗略估算，实际 token 以模型为准。',
      workspace: '工作区',
      currentWorkspace: '当前工作区',
      setDefaultHint: '把当前方案设为这个工作区的默认。',
      followDefault: '跟随工作区默认',
      followDefaultHint: '不固定方案：工作区的默认方案变了，新会话跟着变。',
      newPreset: '新建方案',
      createPreset: '创建能力预设',
      newPresetPrompt: '新方案名称',
      editPreset: '编辑方案',
      renamePreset: '重命名',
      exportPreset: '导出',
      importPreset: '导入方案',
      importPresetHint: '粘贴导出的方案 JSON；同名方案会自动改名。',
      presetImported: '方案已导入',
      presetModeSparse: '基线',
      presetModeExplicit: '快照',
      presetModeSparseHint: '未列出的 Skill 跟随安装状态（默认启用）。',
      presetModeExplicitHint: '未列出的 Skill 视为未纳入，不会启用。',
      presetApplied: '已应用方案',
      applyPresetConfirm: '应用方案会用它的内容覆盖当前会话的全部 MCP 与 Skill 选择，继续？',
      appliedFrom: '来自',
      dirtyLabel: '已手动调整',
      notInPreset: '未纳入',
      presetCount: '方案',
      pluginCount: '插件',
      pluginsNote: '勾选的插件只在本会话挂载；不勾选就不加载。会话中途切换「会话开始时确定」的插件要下次会话才生效。',
      pluginsTab: '插件能力',
      pluginThirdPartyHint: '这里只管理第三方插件；DSH 原生插件不在此列——它们是 Harness 本身。',
      pluginNoCandidates: '没有可管理的第三方插件。装好一个第三方插件后回到这里注册。',
      pluginUnavailable: '当前 DSH 版本没有插件管理器服务，插件能力不可用；MCP 与 Skills 不受影响。',
      pluginCandidates: '可管理的第三方插件',
      registerPlugin: '注册能力插件',
      pluginMountAt: '生效时机',
      pluginMountStart: '会话开始时确定',
      pluginMountAny: '会话中可切换',
      pluginMountStartHint: '注入 prompt 的插件应当只在会话开始时确定，避免上下文缓存失效、前后世界观不一致。',
      pluginMountAnyHint: '仅当插件只注册工具、不注入 prompt 时才选这个。若它注册进程级资源（例如 HTTP 路由），同一时刻只能有一个会话启用它。',
      pluginTakeover: '接管',
      pluginTakeoverWarn: '接管后它不再全局生效；所有会话都必须显式选用它才有。插件管理器会往 profile 配置写一行停用。',
      pluginTakeoverLive: '正在运行的会话会立即失去它。要让它继续有，请把它加进方案后点「重新挂载」，或重开会话。',
      pluginRelease: '释放',
      pluginReleaseWarn: '释放后它恢复为全局启用，所有会话都会加载它；引用它的方案会同时被清理。',
      pluginVerdictMountable: '可挂载',
      pluginVerdictReview: '需人工确认',
      pluginVerdictProfileOnly: '仅支持全局',
      pluginGlobalResource: '全局资源型',
      pluginGlobalResourceHint: '它注册了进程级的 HTTP 路由或端口，同一时刻只能有一个实例。想让所有会话都用，请「释放」让它回到 profile 全局运行。',
      pluginStatusMounted: '已挂载',
      pluginStatusFailed: '挂载失败',
      pluginStatusDeferred: '下次会话生效',
      pluginStatusLocked: '本会话已锁定',
      pluginStatusOff: '未启用',
      pluginRestartRequired: '需要重启 DSH 才生效',
      pluginOverridden: '被更高优先层覆盖，实际未生效',
      pluginMissing: '方案引用的插件已不存在',
      pluginInspect: '体检',
      pluginConfig: '配置',
      pluginConfigHint: '没有配置 schema 时按 JSON 填；留空使用默认值。',
      pluginConfigInvalid: '配置必须是一个 JSON 对象。',
      pluginRecheck: '重新检查',
      pluginCheckedAt: '最近检查',
      pluginNoContributions: '已注册，但没观察到它注册工具或 prompt 段。',
      pluginRemount: '重新挂载',
      pluginFromPreset: '方案未包含',
      pluginTakeoverDone: '已接管',
      pluginReleased: '已释放',
      driftTitle: '默认方案比本方案多',
      driftHint: '同步只把缺少的项加进本会话，不会删除任何东西。',
      syncFromDefault: '同步到会话',
      driftNone: '与默认方案一致',
      missingTitle: '方案引用了已不存在的能力',
      missingMcp: '已删除的 MCP',
      missingSkill: '未安装的 Skill',
      removeFromPreset: '从方案中移除',
      updatePreset: '用当前选择更新方案',
      presetActions: '方案',
      presetActionsHint: '这些操作改动的是方案本身，不是本会话的能力。',
      updatePresetConfirm: '用当前会话的选择覆盖方案',
      overwriteHint: '应用方案会覆盖当前选择。',
      presetDetail: '方案内容',
      presetEmpty: '这个方案没有选中任何能力。',
      catalogsTab: '能力目录',
      catalogUnfiled: '未归入目录',
      catalogNew: '新建目录',
      catalogEdit: '编辑目录',
      catalogName: '目录名称',
      catalogMembers: '目录内容',
      catalogEmpty: '这个目录还没有能力。',
      catalogNoItems: '还没有能力目录。先建一个，把常用的 MCP、Skills、插件放进去。',
      catalogSelectAll: '全选',
      catalogSelectNone: '全部关闭',
      catalogDeleteHint: '删除目录不会删除能力，只是解除分组。',
      catalogFromPreset: '以默认方案为起点',      catalogFromPresetHint: '勾选后把默认方案的内容复制进来；不勾就是一张白纸。',
      catalogMissingItem: '已不存在',
      catalogExpandAll: '全部展开',
      catalogCollapseAll: '全部折叠',
      catalogItemCount: '项',
      workspaceDefaultFrom: '工作区默认',
      clearWorkspaceDefault: '取消工作区默认',
      cleared: '已清除',
      migrationNote: '已从 v0.1 的 Loadout 迁移为能力方案，旧文件已备份。',
      copy: '复制',
      copied: '已复制',
    };

    const en = {
      title: 'Capabilities',
      subtitle: 'Manage Skills and MCP servers, and control what each Session exposes.',
      settingsSubtitle: 'Manage installed capabilities here. Per-session exposure is controlled from the Capabilities chip beside the composer.',
      refresh: 'Refresh',
      addMcp: 'Add MCP',
      pasteJson: 'Paste JSON',
      importSkills: 'Import Skills',
      cancel: 'Cancel',
      confirm: 'Confirm',
      dialogError: 'Action failed',
      hostOutdated: 'The host is running an older version',
      hostOutdatedHint: 'The page is up to date but the plugin host still runs the previous code (a linked plugin only reloads its host half when DSH restarts). Restart DSH to use this.',
      policyLeak: 'The skill policy is not in effect; the model still sees',
      save: 'Save',
      close: 'Close',
      delete: 'Delete',
      edit: 'Edit',
      remove: 'Remove',
      name: 'Name',
      transport: 'Transport',
      command: 'Command',
      args: 'Arguments',
      cwd: 'Working directory',
      url: 'URL',
      env: 'Environment',
      headers: 'Headers',
      optional: 'optional',
      skills: 'Skills',
      mcp: 'MCP',
      presets: 'Presets',
      importTab: 'Import',
      emptySkills: 'No Skill installed yet. Import one from Codex, Claude Code, or Agents.',
      emptyMcp: 'No MCP server yet. Add a stdio command or a Streamable HTTP URL.',
      emptyPresets: 'No preset yet. Tune a Session and choose Save as preset, or create one here.',
      installed: 'installed',
      notInstalled: 'not installed',
      enabled: 'enabled',
      disabled: 'disabled',
      stateAuto: 'Auto',
      stateManual: 'Manual',
      stateOff: 'Off',
      sourceUser: 'user',
      sourceProject: 'project',
      sourceCodex: 'Codex',
      sourceClaude: 'Claude Code',
      sourceAgents: 'Agents',
      sourceBuiltin: 'built-in',
      builtinNoPath: 'Built-in Skill: no file to delete',
      tokens: 'tokens',
      tools: 'tools',
      exposed: 'exposed',
      notExposed: 'not exposed',
      session: 'This session',
      modelView: 'Model view',
      live: 'Session is live',
      notLive: 'Session is not active; changes are saved and apply on resume.',
      apply: 'Apply',
      applied: 'Saved',
      saveAsPreset: 'Save as new preset',
      workspaceDefault: 'Set workspace default',
      preset: 'Preset',
      mcpCount: 'MCP',
      skillCount: 'Skills',
      statusIdle: 'idle',
      statusConnecting: 'connecting',
      statusReady: 'connected',
      statusFailed: 'failed',
      retry: 'Retry',
      reasonNotExposed: 'not in this preset',
      reasonManual: 'manual only',
      reasonOff: 'hidden',
      reasonDisabled: 'disabled in the library',
      modelTools: 'Tools',
      modelSkills: 'Skills catalog',
      modelInstructions: 'MCP instructions',
      estimate: 'Estimated context',
      description: 'Description',
      path: 'Path',
      confirmDeleteMcp: 'Delete this MCP server? Live sessions will disconnect it.',
      confirmDeleteSkill: 'Move this Skill to the trash? The file is not permanently deleted.',
      parse: 'Parse',
      addAll: 'Add all',
      importSelected: 'Import selected',
      replaceExisting: 'Replace same-name Skills',
      selectAll: 'Select all',
      clear: 'Clear',
      scanHint: 'Imports are copied into ~/.dsh/skills; Codex/Claude directories are not modified.',
      chip: 'Capabilities',
      sessionTitle: 'Session capabilities',
      sessionSubtitle: 'Affects this Session only; changes apply on the next message.',
      changesSaved: 'Applied',
      error: 'Something went wrong',
      loading: 'Loading…',
      noSession: 'No Session yet.',
      deletePreset: 'Delete preset',
      deletePresetHint: 'Deletion cannot be undone. Sessions using it fall back to the workspace default preset.',
      defaultPreset: 'Default preset',
      optionalSecrets: 'Leave blank to keep existing secrets',
      envHint: 'One KEY=VALUE per line; ${ENV_NAME} reads an environment variable.',
      argsHint: 'Space separated; paste a JSON array when an argument contains spaces.',
      pasteHint: 'Accepts {"mcpServers": {...}} or a direct server map.',
      imported: 'Import complete',
      someFailed: 'Some imports failed',
      reload: 'Reload',
      modelEmpty: 'This Session exposes no capabilities.',
      native: 'Native',
      fromMcp: 'MCP',
      notExposedSection: 'Not exposed',
      noItems: 'None',
      savePresetPrompt: 'Name this preset',
      presetSaved: 'Preset saved',
      workspaceDefaultSaved: 'Set as the workspace default',
      back: 'Back',
      next: 'Next',
      view: 'View',
      hide: 'Hide',
      show: 'Show',
      all: 'All',
      none: 'None',
      defaultPresetHint: 'New Sessions use the workspace default preset; pick another one from the Session panel.',
      importGroupEmpty: 'No importable Skill in this source.',
      mcpTarget: 'Target',
      secretKeys: 'Secret fields',
      noSecrets: 'None',
      configured: 'configured',
      notConfigured: 'not configured',
      editMcp: 'Edit MCP',
      newMcp: 'Add MCP',
      closePanel: 'Close capabilities panel',
      sessionCapabilities: 'Session capabilities',
      toolCount: 'tools',
      skillCountLabel: 'Skills',
      presetSelect: 'Select preset',
      currentPreset: 'Current preset',
      saveFailed: 'Save failed',
      removeFailed: 'Remove failed',
      scanFailed: 'Scan failed',
      importFailed: 'Import failed',
      loadFailed: 'Load failed',
      mcpNamePlaceholder: 'e.g. github',
      commandPlaceholder: 'npx',
      argsPlaceholder: '-y @modelcontextprotocol/server-github',
      urlPlaceholder: 'https://example.com/mcp',
      envPlaceholder: 'GITHUB_TOKEN=${GITHUB_TOKEN}',
      headersPlaceholder: '{"Authorization":"Bearer ${TOKEN}"}',
      jsonPlaceholder: '{"mcpServers":{"github":{"command":"npx","args":["-y","@modelcontextprotocol/server-github"]}}}',
      noDescription: 'No description',
      installedAt: 'Installed',
      toolList: 'Tool list',
      instructionsHint: 'These are MCP server instructions and enter the system prompt.',
      modelEstimateHint: 'Rough character-based estimate; the model tokenizer is authoritative.',
      workspace: 'Workspace',
      currentWorkspace: 'Current workspace',
      setDefaultHint: 'Make the current preset the default for this workspace.',
      followDefault: 'Follow workspace default',
      followDefaultHint: 'No fixed preset: new Sessions follow whatever the workspace default is.',
      newPreset: 'New preset',
      createPreset: 'Create preset',
      newPresetPrompt: 'Name the new preset',
      editPreset: 'Edit preset',
      renamePreset: 'Rename',
      exportPreset: 'Export',
      importPreset: 'Import preset',
      importPresetHint: 'Paste an exported preset JSON. A duplicate name is renamed automatically.',
      presetImported: 'Preset imported',
      presetModeSparse: 'Baseline',
      presetModeExplicit: 'Snapshot',
      presetModeSparseHint: 'Skills the preset does not list follow what is installed (enabled by default).',
      presetModeExplicitHint: 'Skills the preset does not list count as not included and stay off.',
      presetApplied: 'Preset applied',
      applyPresetConfirm: 'Applying a preset replaces every MCP and Skill choice in this Session. Continue?',
      appliedFrom: 'from',
      dirtyLabel: 'tuned manually',
      notInPreset: 'not included',
      presetCount: 'Presets',
      pluginCount: 'plugins',
      pluginsNote: 'Checked plugins mount in this Session only; unchecked ones do not load. Switching a "decided at session start" plugin mid-session takes effect next Session.',
      pluginsTab: 'Plugins',
      pluginThirdPartyHint: 'Only third-party plugins are managed here. DSH native plugins are the Harness itself and are not listed.',
      pluginNoCandidates: 'No third-party plugins to manage. Install one, then come back here to register it.',
      pluginUnavailable: 'This DSH version has no plugin manager service, so capability plugins are unavailable. MCP and Skills are unaffected.',
      pluginCandidates: 'Third-party plugins you can manage',
      registerPlugin: 'Register plugin',
      pluginMountAt: 'When it applies',
      pluginMountStart: 'Decided at session start',
      pluginMountAny: 'Switchable mid-session',
      pluginMountStartHint: 'A plugin that injects into the system prompt belongs here: changing it mid-session would invalidate the prompt cache and give the Session two different world views.',
      pluginMountAnyHint: 'Pick this only when the plugin registers tools and injects no prompt text. If it registers process-wide resources (HTTP routes, a port), only one Session can have it at a time.',
      pluginTakeover: 'Take over',
      pluginTakeoverWarn: 'It stops running profile-wide: every Session must select it explicitly from now on. The plugin manager writes one disable line into the profile config.',
      pluginTakeoverLive: 'Running Sessions lose it immediately. To keep it in one, add it to that Session\'s preset and press "Remount", or reopen the Session.',
      pluginRelease: 'Release',
      pluginReleaseWarn: 'It returns to profile-wide enablement and every Session loads it again; presets referencing it are cleaned up too.',
      pluginVerdictMountable: 'Mountable',
      pluginVerdictReview: 'Needs confirmation',
      pluginVerdictProfileOnly: 'Profile-wide only',
      pluginGlobalResource: 'Process-wide',
      pluginGlobalResourceHint: 'It registers process-wide HTTP routes or a port, so only one instance can run at a time. To have it in every Session, release it back to profile-wide.',
      pluginStatusMounted: 'Mounted',
      pluginStatusFailed: 'Mount failed',
      pluginStatusDeferred: 'Next Session',
      pluginStatusLocked: 'Locked for this Session',
      pluginStatusOff: 'Not enabled',
      pluginRestartRequired: 'Needs a DSH restart',
      pluginOverridden: 'Overridden by a higher layer; not in effect',
      pluginMissing: 'A preset references a plugin that no longer exists',
      pluginInspect: 'Inspect',
      pluginConfig: 'Config',
      pluginConfigHint: 'Paste a JSON object when the plugin has no config schema; leave it empty to use defaults.',
      pluginConfigInvalid: 'Config must be a JSON object.',
      pluginRecheck: 'Re-check',
      pluginCheckedAt: 'Last checked',
      pluginNoContributions: 'Registered, but no tool or prompt section was observed.',
      pluginRemount: 'Remount',
      pluginFromPreset: 'not in preset',
      pluginTakeoverDone: 'Taken over',
      pluginReleased: 'Released',
      driftTitle: 'The default preset also has',
      driftHint: 'Syncing only adds the missing items to this Session; nothing is removed.',
      syncFromDefault: 'Sync to Session',
      driftNone: 'Same as the default preset',
      missingTitle: 'The preset references capabilities that no longer exist',
      missingMcp: 'deleted MCP',
      missingSkill: 'missing Skill',
      removeFromPreset: 'Remove from preset',
      updatePreset: 'Update preset from this Session',
      presetActions: 'Preset',
      presetActionsHint: 'These change the preset itself, not this Session\'s capabilities.',
      updatePresetConfirm: 'Overwrite the preset with this Session\'s selection:',
      overwriteHint: 'Applying a preset overwrites the current selection.',
      presetDetail: 'Preset contents',
      presetEmpty: 'This preset selects no capability.',
      catalogsTab: 'Directories',
      catalogUnfiled: 'Not in a directory',
      catalogNew: 'New directory',
      catalogEdit: 'Edit directory',
      catalogName: 'Directory name',
      catalogMembers: 'Contents',
      catalogEmpty: 'This directory has no capability yet.',
      catalogNoItems: 'No capability directories yet. Create one and put the MCP servers, Skills and plugins you use together into it.',
      catalogSelectAll: 'Select all',
      catalogSelectNone: 'Clear all',
      catalogDeleteHint: 'Deleting a directory removes the grouping only; the capabilities stay installed.',
      catalogFromPreset: 'Start from the default preset',
      catalogFromPresetHint: 'Checked copies the default preset\'s contents in; unchecked starts empty.',
      catalogMissingItem: 'no longer exists',
      catalogExpandAll: 'Expand all',
      catalogCollapseAll: 'Collapse all',
      catalogItemCount: 'items',
      workspaceDefaultFrom: 'workspace default',
      clearWorkspaceDefault: 'Clear workspace default',
      cleared: 'Cleared',
      migrationNote: 'Loadouts from v0.1 were migrated to presets; the previous file is backed up.',
      copy: 'Copy',
      copied: 'Copied',
    };

    // A tiny shared store keeps one modal host alive even when the chip or the
    // header action that opened it unmounts.
    const panel = {
      sessionId: null,
      listeners: new Set(),
      emit() {
        for (const listener of this.listeners) listener();
      },
      open(sessionId) {
        this.sessionId = sessionId;
        this.emit();
      },
      close() {
        this.sessionId = null;
        this.emit();
      },
      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      },
    };

    function usePanel() {
      const [, force] = useState(0);
      useEffect(() => panel.subscribe(() => force((value) => value + 1)), []);
      return panel;
    }

    // ── Dialogs ──────────────────────────────────────────────────────────────
    // Never rely on `window.confirm/alert/prompt`: a host shell that suppresses
    // native dialogs makes a confirmation resolve to `false` and an error
    // report resolve to nothing, so every destructive action becomes a silent
    // no-op. These render inside the plugin, on host theme tokens.
    const dialogs = {
      current: null,
      listeners: new Set(),
      emit() {
        for (const listener of this.listeners) listener();
      },
      ask(request) {
        return new Promise((resolve) => {
          // A newer request supersedes an unanswered one: resolve it as "no".
          this.current?.resolve?.('superseded');
          this.current = { ...request, resolve };
          this.emit();
        });
      },
      answer(value) {
        const current = this.current;
        if (current === null) return;
        this.current = null;
        this.emit();
        current.resolve(value);
      },
    };

    /** Yes/no. Resolves `true` only when the user confirms. */
    function askConfirm(title, message, options = {}) {
      return dialogs
        .ask({
          kind: 'confirm',
          title,
          message,
          detail: options.detail,
          danger: options.danger === true,
          confirmLabel: options.confirmLabel,
        })
        .then((value) => value === true);
    }

    /** Something the user must see, with one button. */
    function askNotice(title, message) {
      return dialogs.ask({ kind: 'notice', title, message }).then(() => undefined);
    }

    /** A single line of text. Resolves the text, or `null` when cancelled. */
    function askText(title, message, defaultValue = '') {
      return dialogs
        .ask({ kind: 'text', title, message, defaultValue })
        .then((value) => (typeof value === 'string' ? value : null));
    }

    /** Report a failed action instead of swallowing it in an invisible alert. */
    function notifyError(t, error) {
      const message = String(error?.message ?? error);
      // A stale host answers every new action with this; say what to do about it
      // instead of presenting it as a plugin bug.
      if (/unknown action/i.test(message)) {
        void askNotice(t('hostOutdated'), t('hostOutdatedHint'));
        return;
      }
      void askNotice(t('dialogError'), message);
    }

    function DialogHost({ t }) {
      const [, bump] = useState(0);
      const [value, setValue] = useState('');
      useEffect(() => {
        const listener = () => bump((count) => count + 1);
        dialogs.listeners.add(listener);
        return () => dialogs.listeners.delete(listener);
      }, []);
      const request = dialogs.current;
      useEffect(() => {
        if (request?.kind === 'text') setValue(request.defaultValue ?? '');
      }, [request]);
      if (request === null) return null;
      const cancel = () => dialogs.answer(request.kind === 'text' ? null : false);
      return h(
        Modal,
        {
          title: request.title,
          subtitle: request.message,
          onClose: cancel,
          t,
          footer: h(
            React.Fragment,
            null,
            request.kind === 'notice' ? null : h(Button, { onClick: cancel }, t('cancel')),
            h(
              Button,
              {
                variant: request.danger ? 'danger-ghost' : 'primary',
                onClick: () => dialogs.answer(request.kind === 'text' ? value : true),
              },
              request.confirmLabel ?? (request.kind === 'notice' ? t('close') : t('confirm')),
            ),
          ),
        },
        request.detail ? h('div', { className: 'ch-note' }, request.detail) : null,
        request.kind === 'text'
          ? h('input', {
              className: 'ch-input',
              value,
              onChange: (event) => setValue(event.target.value),
            })
          : null,
      );
    }

    async function call(action, payload = {}) {
      const response = await fetch('/api/capability-hub', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      let json;
      try {
        json = await response.json();
      } catch {
        throw new Error(`HTTP ${response.status}`);
      }
      if (!json || json.ok !== true) throw new Error(json?.error || `HTTP ${response.status}`);
      return json.data;
    }

    function useAsync(loader, deps) {
      const [state, setState] = useState({ loading: true, data: null, error: null });
      const reload = useCallback(() => {
        let alive = true;
        setState((current) => ({ ...current, loading: true, error: null }));
        Promise.resolve()
          .then(loader)
          .then((data) => {
            if (alive) setState({ loading: false, data, error: null });
          })
          .catch((error) => {
            if (alive) setState({ loading: false, data: null, error });
          });
        return () => {
          alive = false;
        };
      }, deps);
      useEffect(() => reload(), [reload]);
      return { ...state, reload };
    }

    function Badge({ tone = 'neutral', children }) {
      return h('span', { className: `ch-badge ch-badge-${tone}` }, children);
    }

    function Button({ variant = 'default', size = 'md', children, ...rest }) {
      return h(
        'button',
        { ...rest, className: `ch-btn ch-btn-${variant} ch-btn-${size}`, type: 'button' },
        children,
      );
    }

    function Spinner() {
      return h('span', { className: 'ch-spinner', 'aria-hidden': true });
    }

    function Empty({ children }) {
      return h('div', { className: 'ch-empty' }, children);
    }

    function ErrorBox({ error, onRetry, t }) {
      if (!error) return null;
      return h(
        'div',
        { className: 'ch-errorbox', role: 'alert' },
        h('div', { className: 'ch-error-text' }, String(error.message ?? error)),
        onRetry
          ? h(Button, { size: 'sm', onClick: onRetry }, t('reload'))
          : null,
      );
    }

    function Modal({ title, subtitle, onClose, children, footer, wide = false, t }) {
      useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      }, [onClose]);
      const content = h(
        'div',
        {
          className: 'ch-overlay',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
        },
        h(
          'div',
          {
            className: `ch-modal${wide ? ' ch-modal-wide' : ''}`,
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': title,
          },
          h(
            'div',
            { className: 'ch-modal-head' },
            h(
              'div',
              { className: 'ch-modal-heading' },
              h('div', { className: 'ch-modal-title' }, title),
              subtitle ? h('div', { className: 'ch-modal-subtitle' }, subtitle) : null,
            ),
            h(
              'button',
              {
                className: 'ch-icon-btn',
                type: 'button',
                'aria-label': t('close'),
                onClick: onClose,
              },
              '×',
            ),
          ),
          h('div', { className: 'ch-modal-body' }, children),
          footer ? h('div', { className: 'ch-modal-footer' }, footer) : null,
        ),
      );
      if (ReactDOM?.createPortal && typeof document !== 'undefined') {
        return ReactDOM.createPortal(content, document.body);
      }
      return content;
    }

    function Tabs({ items, value, onChange }) {
      return h(
        'div',
        { className: 'ch-tabs', role: 'tablist' },
        items.map((item) =>
          h(
            'button',
            {
              key: item.id,
              type: 'button',
              role: 'tab',
              'aria-selected': value === item.id,
              className: `ch-tab${value === item.id ? ' ch-tab-active' : ''}`,
              onClick: () => onChange(item.id),
            },
            item.label,
            item.count === undefined ? null : h('span', { className: 'ch-tab-count' }, item.count),
          ),
        ),
      );
    }

    function Switch({ checked, onChange, label, disabled = false }) {
      return h(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': checked,
          'aria-label': label,
          className: `ch-switch${checked ? ' ch-switch-on' : ''}`,
          onClick: () => onChange(!checked),
          disabled,
        },
        h('span', { className: 'ch-switch-knob' }),
      );
    }

    function Segmented({ value, onChange, options, disabled = false }) {
      return h(
        'div',
        { className: 'ch-segmented', role: 'radiogroup' },
        options.map((option) =>
          h(
            'button',
            {
              key: option.value,
              type: 'button',
              role: 'radio',
              'aria-checked': value === option.value,
              className: `ch-segment${value === option.value ? ' ch-segment-active' : ''}`,
              onClick: () => onChange(option.value),
              disabled,
            },
            option.label,
          ),
        ),
      );
    }

    function relativeTime(value) {
      if (!value) return '';
      const time = Date.parse(value);
      if (!Number.isFinite(time)) return '';
      const delta = Date.now() - time;
      if (delta < 60_000) return 'now';
      if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m`;
      if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h`;
      return `${Math.round(delta / 86_400_000)}d`;
    }

    function formatTokens(value) {
      if (!Number.isFinite(value) || value <= 0) return '0';
      if (value < 1000) return String(Math.round(value));
      return `${(value / 1000).toFixed(1)}k`;
    }

    function sourceLabel(source, t, builtin = false) {
      if (source === 'project') return t('sourceProject');
      if (source === 'codex') return t('sourceCodex');
      if (source === 'claude') return t('sourceClaude');
      if (source === 'agents') return t('sourceAgents');
      // Anything not imported by this plugin (bundled or plugin-provided) is a
      // harness Skill: visible and togglable, not removable.
      if (builtin) return t('sourceBuiltin');
      return t('sourceUser');
    }

    function stateLabel(state, t) {
      if (state === 'manual') return t('stateManual');
      if (state === 'off') return t('stateOff');
      return t('stateAuto');
    }

    function statusTone(status) {
      if (status === 'ready') return 'success';
      if (status === 'failed') return 'error';
      if (status === 'connecting') return 'warn';
      return 'neutral';
    }

    function statusLabel(status, t) {
      if (status === 'ready') return t('statusReady');
      if (status === 'failed') return t('statusFailed');
      if (status === 'connecting') return t('statusConnecting');
      return t('statusIdle');
    }

    // ── Capability plugins ───────────────────────────────────────────────────
    // Verb badges: a provider's mountability verdict and its live status are
    // different things, so they get separate helpers.

    function verdictLabel(verdict, t) {
      const level = verdict?.level;
      if (level === 'mountable') return t('pluginVerdictMountable');
      if (level === 'review') return t('pluginVerdictReview');
      if (level === 'profile-only') return t('pluginVerdictProfileOnly');
      return t('pluginInspect');
    }

    function verdictTone(verdict) {
      const level = verdict?.level;
      if (level === 'mountable') return 'success';
      if (level === 'review') return 'warn';
      if (level === 'profile-only') return 'error';
      return 'neutral';
    }

    function pluginStatusLabel(status, t) {
      if (status === 'mounted') return t('pluginStatusMounted');
      if (status === 'failed') return t('pluginStatusFailed');
      if (status === 'deferred') return t('pluginStatusDeferred');
      if (status === 'locked') return t('pluginStatusLocked');
      return t('pluginStatusOff');
    }

    function pluginStatusTone(status) {
      if (status === 'mounted') return 'success';
      if (status === 'failed') return 'error';
      if (status === 'deferred' || status === 'locked') return 'warn';
      return 'neutral';
    }

    function mountAtLabel(mountAt, t) {
      return mountAt === 'any-time' ? t('pluginMountAny') : t('pluginMountStart');
    }

    /** A takeover's `application` outcome, as the user needs to read it. */
    function applicationNotice(application, t) {
      if (application === 'restart-required') return { tone: 'warn', text: t('pluginRestartRequired') };
      if (application === 'overridden') return { tone: 'warn', text: t('pluginOverridden') };
      return null;
    }

    function SkillRow({ skill, onRemove, t }) {
      // Only a Skill whose file lives in a managed root can be removed. A
      // bundled one is still listed and togglable — that is the point of
      // managing every Skill in one place — but there is no file to delete.
      const removable = skill.removable !== false;
      return h(
        'div',
        { className: 'ch-row' },
        h(
          'div',
          { className: 'ch-row-main' },
          h(
            'div',
            { className: 'ch-row-title-line' },
            h('span', { className: 'ch-row-title' }, skill.name),
            h(Badge, { tone: skill.state === 'auto' ? 'success' : skill.state === 'manual' ? 'warn' : 'neutral' }, stateLabel(skill.state, t)),
            h(Badge, { tone: removable ? null : 'info' }, sourceLabel(skill.source, t, !removable)),
            h('span', { className: 'ch-muted ch-mono' }, `~${formatTokens(skill.tokens)} ${t('tokens')}`),
          ),
          h('div', { className: 'ch-row-description' }, skill.description || t('noDescription')),
          h('div', { className: 'ch-row-meta ch-mono', title: skill.path }, skill.path ?? t('builtinNoPath')),
        ),
        h(
          'div',
          { className: 'ch-row-actions' },
          onRemove && removable
            ? h(
                Button,
                {
                  size: 'sm',
                  variant: 'ghost',
                  onClick: () => onRemove(skill),
                },
                t('remove'),
              )
            : null,
        ),
      );
    }

    function McpRow({ server, onEdit, onRemove, onToggle, t }) {
      const target =
        server.transport === 'stdio'
          ? [server.command, ...(server.args ?? [])].filter(Boolean).join(' ')
          : server.url;
      const secretKeys = [...(server.envKeys ?? []), ...(server.headerKeys ?? [])];
      return h(
        'div',
        { className: 'ch-row' },
        h(
          'div',
          { className: 'ch-row-main' },
          h(
            'div',
            { className: 'ch-row-title-line' },
            h('span', { className: 'ch-row-title' }, server.name),
            h(Badge, { tone: server.enabled ? 'success' : 'neutral' }, server.enabled ? t('enabled') : t('disabled')),
            h(Badge, null, server.transport === 'stdio' ? 'stdio' : 'http'),
            h('span', { className: 'ch-muted ch-mono' }, `mcp__${server.serverName}__*`),
          ),
          h('div', { className: 'ch-row-meta ch-mono', title: target }, target || t('notConfigured')),
          h(
            'div',
            { className: 'ch-row-meta' },
            `${t('secretKeys')}: ${secretKeys.length > 0 ? secretKeys.join(', ') : t('noSecrets')}`,
          ),
        ),
        h(
          'div',
          { className: 'ch-row-actions' },
          h(Switch, {
            checked: server.enabled,
            label: server.name,
            onChange: (value) => onToggle(server, value),
          }),
          h(Button, { size: 'sm', variant: 'ghost', onClick: () => onEdit(server) }, t('edit')),
          h(
            Button,
            { size: 'sm', variant: 'danger-ghost', onClick: () => onRemove(server) },
            t('delete'),
          ),
        ),
      );
    }

    function parseKeyValueLines(text) {
      const result = {};
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#')) continue;
        const index = trimmed.indexOf('=');
        if (index === -1) {
          result[trimmed] = '';
        } else {
          result[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
        }
      }
      return result;
    }

    function parseJsonObject(text, label) {
      if (text.trim() === '') return undefined;
      const value = JSON.parse(text);
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${label} must be a JSON object.`);
      }
      return value;
    }

    function parseObjectText(text, label, allowLines) {
      if (text.trim() === '') return undefined;
      if (allowLines && !text.trimStart().startsWith('{')) {
        return parseKeyValueLines(text);
      }
      return parseJsonObject(text, label);
    }

    function parseArgs(text) {
      const trimmed = text.trim();
      if (trimmed === '') return [];
      if (trimmed.startsWith('[')) {
        const value = JSON.parse(trimmed);
        if (!Array.isArray(value)) throw new Error('Arguments must be a JSON array.');
        return value.map(String);
      }
      return trimmed.split(/\s+/).filter(Boolean);
    }

    function McpForm({ t, initial, onClose, onSaved }) {
      const [name, setName] = useState(initial?.name ?? '');
      const [transport, setTransport] = useState(initial?.transport ?? 'stdio');
      const [command, setCommand] = useState(initial?.command ?? '');
      const [args, setArgs] = useState((initial?.args ?? []).join(' '));
      const [cwd, setCwd] = useState(initial?.cwd ?? '');
      const [url, setUrl] = useState(initial?.url ?? '');
      const [envText, setEnvText] = useState('');
      const [headersText, setHeadersText] = useState('');
      const [saving, setSaving] = useState(false);
      const [error, setError] = useState(null);

      const submit = async () => {
        setSaving(true);
        setError(null);
        try {
          if (name.trim() === '') throw new Error(`${t('name')} is required.`);
          if (transport === 'stdio' && command.trim() === '') {
            throw new Error(`${t('command')} is required.`);
          }
          if (transport === 'streamable-http' && url.trim() === '') {
            throw new Error(`${t('url')} is required.`);
          }
          const mcp = {
            ...(initial?.id ? { id: initial.id } : {}),
            name: name.trim(),
            transport,
            command: transport === 'stdio' ? command.trim() : '',
            args: transport === 'stdio' ? parseArgs(args) : [],
            cwd: transport === 'stdio' ? cwd.trim() : '',
            url: transport === 'streamable-http' ? url.trim() : '',
          };
          if (transport === 'stdio') {
            const env = parseObjectText(envText, t('env'), true);
            if (env !== undefined) mcp.env = env;
          } else {
            const headers = parseObjectText(headersText, t('headers'), false);
            if (headers !== undefined) mcp.headers = headers;
          }
          await call('saveMcp', { mcp });
          await onSaved();
        } catch (saveError) {
          setError(saveError);
        } finally {
          setSaving(false);
        }
      };

      return h(
        Modal,
        {
          title: initial ? t('editMcp') : t('newMcp'),
          subtitle: t('settingsSubtitle'),
          onClose,
          t,
          footer: h(
            React.Fragment,
            null,
            h(Button, { onClick: onClose }, t('cancel')),
            h(
              Button,
              { variant: 'primary', onClick: submit, disabled: saving || name.trim() === '' },
              saving ? h(Spinner) : t('save'),
            ),
          ),
        },
        h(
          'div',
          { className: 'ch-form' },
          h(
            'label',
            { className: 'ch-field' },
            h('span', { className: 'ch-field-label' }, t('name')),
            h('input', {
              className: 'ch-input',
              value: name,
              placeholder: t('mcpNamePlaceholder'),
              onChange: (event) => setName(event.target.value),
            }),
          ),
          h(
            'label',
            { className: 'ch-field' },
            h('span', { className: 'ch-field-label' }, t('transport')),
            h(
              'select',
              {
                className: 'ch-input',
                value: transport,
                onChange: (event) => setTransport(event.target.value),
              },
              h('option', { value: 'stdio' }, 'stdio'),
              h('option', { value: 'streamable-http' }, 'streamable-http'),
            ),
          ),
          transport === 'stdio'
            ? h(
                React.Fragment,
                null,
                h(
                  'label',
                  { className: 'ch-field' },
                  h('span', { className: 'ch-field-label' }, t('command')),
                  h('input', {
                    className: 'ch-input ch-mono',
                    value: command,
                    placeholder: t('commandPlaceholder'),
                    onChange: (event) => setCommand(event.target.value),
                  }),
                ),
                h(
                  'label',
                  { className: 'ch-field' },
                  h('span', { className: 'ch-field-label' }, t('args')),
                  h('input', {
                    className: 'ch-input ch-mono',
                    value: args,
                    placeholder: t('argsPlaceholder'),
                    onChange: (event) => setArgs(event.target.value),
                  }),
                  h('span', { className: 'ch-field-hint' }, t('argsHint')),
                ),
                h(
                  'label',
                  { className: 'ch-field' },
                  h('span', { className: 'ch-field-label' }, `${t('cwd')} (${t('optional')})`),
                  h('input', {
                    className: 'ch-input ch-mono',
                    value: cwd,
                    onChange: (event) => setCwd(event.target.value),
                  }),
                ),
                h(
                  'label',
                  { className: 'ch-field' },
                  h(
                    'span',
                    { className: 'ch-field-label' },
                    `${t('env')} (${initial ? t('optionalSecrets') : t('optional')})`,
                  ),
                  h('textarea', {
                    className: 'ch-input ch-mono ch-textarea',
                    rows: 4,
                    value: envText,
                    placeholder: t('envPlaceholder'),
                    onChange: (event) => setEnvText(event.target.value),
                  }),
                  h('span', { className: 'ch-field-hint' }, t('envHint')),
                ),
              )
            : h(
                React.Fragment,
                null,
                h(
                  'label',
                  { className: 'ch-field' },
                  h('span', { className: 'ch-field-label' }, t('url')),
                  h('input', {
                    className: 'ch-input ch-mono',
                    value: url,
                    placeholder: t('urlPlaceholder'),
                    onChange: (event) => setUrl(event.target.value),
                  }),
                ),
                h(
                  'label',
                  { className: 'ch-field' },
                  h(
                    'span',
                    { className: 'ch-field-label' },
                    `${t('headers')} (${initial ? t('optionalSecrets') : t('optional')})`,
                  ),
                  h('textarea', {
                    className: 'ch-input ch-mono ch-textarea',
                    rows: 3,
                    value: headersText,
                    placeholder: t('headersPlaceholder'),
                    onChange: (event) => setHeadersText(event.target.value),
                  }),
                ),
              ),
          h(ErrorBox, { error, t }),
        ),
      );
    }

    function McpPasteModal({ t, onClose, onSaved }) {
      const [text, setText] = useState('');
      const [error, setError] = useState(null);
      const [saving, setSaving] = useState(false);
      const submit = async () => {
        setSaving(true);
        setError(null);
        try {
          const parsed = JSON.parse(text);
          const map = parsed?.mcpServers && typeof parsed.mcpServers === 'object' ? parsed.mcpServers : parsed;
          if (!map || typeof map !== 'object' || Array.isArray(map)) throw new Error(t('pasteHint'));
          const entries = Object.entries(map);
          if (entries.length === 0) throw new Error(t('pasteHint'));
          for (const [name, value] of entries) {
            if (!value || typeof value !== 'object') continue;
            const transport = value.url ? 'streamable-http' : 'stdio';
            await call('saveMcp', {
              mcp: {
                name: value.name || name,
                transport,
                command: value.command ?? '',
                args: Array.isArray(value.args) ? value.args : [],
                cwd: value.cwd ?? '',
                url: value.url ?? '',
                env: transport === 'stdio' ? value.env ?? {} : {},
                headers: transport === 'streamable-http' ? value.headers ?? {} : {},
              },
            });
          }
          await onSaved();
        } catch (pasteError) {
          setError(pasteError);
        } finally {
          setSaving(false);
        }
      };
      return h(
        Modal,
        {
          title: t('pasteJson'),
          subtitle: t('pasteHint'),
          onClose,
          t,
          footer: h(
            React.Fragment,
            null,
            h(Button, { onClick: onClose }, t('cancel')),
            h(
              Button,
              { variant: 'primary', onClick: submit, disabled: saving || text.trim() === '' },
              saving ? h(Spinner) : t('addAll'),
            ),
          ),
        },
        h(
          'div',
          { className: 'ch-form' },
          h('textarea', {
            className: 'ch-input ch-mono ch-textarea ch-textarea-lg',
            rows: 12,
            value: text,
            placeholder: t('jsonPlaceholder'),
            onChange: (event) => setText(event.target.value),
          }),
          h(ErrorBox, { error, t }),
        ),
      );
    }

    function ImportPanel({ t, onImported }) {
      const { data, loading, error, reload } = useAsync(() => call('scanImports'), []);
      const [selected, setSelected] = useState(new Set());
      const [replace, setReplace] = useState(false);
      const [result, setResult] = useState(null);
      const [busy, setBusy] = useState(false);

      const toggle = (key) => {
        const next = new Set(selected);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setSelected(next);
      };

      const allEntries = useMemo(
        () => (data?.groups ?? []).flatMap((group) => group.entries.map((entry) => ({ ...entry, group: group.id }))),
        [data],
      );

      const importSelected = async () => {
        if (selected.size === 0) return;
        setBusy(true);
        setResult(null);
        try {
          const items = allEntries
            .filter((entry) => selected.has(`${entry.group}:${entry.name}`))
            .map((entry) => ({ source: entry.group, name: entry.name, sourcePath: entry.sourcePath }));
          const value = await call('importSkills', { items, replace });
          setResult(value.results);
          setSelected(new Set());
          await onImported?.();
          await reload();
        } catch (importError) {
          setResult([{ ok: false, error: String(importError.message ?? importError) }]);
        } finally {
          setBusy(false);
        }
      };

      if (loading) return h('div', { className: 'ch-loading' }, h(Spinner), t('loading'));
      if (error) return h(ErrorBox, { error, onRetry: reload, t });

      return h(
        'div',
        { className: 'ch-stack' },
        h('div', { className: 'ch-note' }, t('scanHint')),
        h(
          'div',
          { className: 'ch-toolbar' },
          h(
            Button,
            {
              size: 'sm',
              onClick: () => setSelected(new Set(allEntries.map((entry) => `${entry.group}:${entry.name}`))),
            },
            t('selectAll'),
          ),
          h(Button, { size: 'sm', onClick: () => setSelected(new Set()) }, t('clear')),
          h(
            'label',
            { className: 'ch-check-line' },
            h('input', {
              type: 'checkbox',
              checked: replace,
              onChange: (event) => setReplace(event.target.checked),
            }),
            t('replaceExisting'),
          ),
          h(
            Button,
            { variant: 'primary', size: 'sm', onClick: importSelected, disabled: busy || selected.size === 0 },
            busy ? h(Spinner) : `${t('importSelected')} (${selected.size})`,
          ),
        ),
        result
          ? h(
              'div',
              { className: `ch-result ${result.every((item) => item.ok) ? 'ch-result-ok' : 'ch-result-warn'}` },
              result.every((item) => item.ok) ? t('imported') : t('someFailed'),
              result.filter((item) => !item.ok).map((item) =>
                h('div', { key: item.name ?? item.error, className: 'ch-muted' }, `${item.name ?? ''}: ${item.error}`),
              ),
            )
          : null,
        (data?.groups ?? []).map((group) =>
          h(
            'section',
            { key: group.id, className: 'ch-section' },
            h(
              'div',
              { className: 'ch-section-head' },
              h('div', { className: 'ch-section-title' }, group.label),
              h('span', { className: 'ch-muted ch-mono' }, group.root),
              h('span', { className: 'ch-muted' }, `${group.entries.length}`),
            ),
            group.entries.length === 0
              ? h(Empty, null, t('importGroupEmpty'))
              : group.entries.map((entry) => {
                  const key = `${group.id}:${entry.name}`;
                  return h(
                    'label',
                    { key, className: 'ch-import-row' },
                    h('input', {
                      type: 'checkbox',
                      checked: selected.has(key),
                      onChange: () => toggle(key),
                    }),
                    h(
                      'div',
                      { className: 'ch-row-main' },
                      h(
                        'div',
                        { className: 'ch-row-title-line' },
                        h('span', { className: 'ch-row-title' }, entry.name),
                        entry.installed ? h(Badge, { tone: 'neutral' }, t('installed')) : null,
                      ),
                      h('div', { className: 'ch-row-description' }, entry.description),
                      h('div', { className: 'ch-row-meta ch-mono' }, entry.path),
                    ),
                  );
                }),
          ),
        ),
      );
    }

    // ── Presets ─────────────────────────────────────────────────────────────
    // A preset is the complete capability set a Session should have. The
    // Settings page owns the library of presets; the Session panel applies one.

    function presetLabel(preset, t) {
      return preset.isDefault ? t('defaultPreset') : preset.name;
    }

    function PresetModeBadge({ preset, t }) {
      if (preset.isDefault) return h(Badge, { tone: 'info' }, t('defaultPreset'));
      return h(
        Badge,
        { tone: preset.skillsMode === 'explicit' ? 'info' : 'neutral' },
        preset.skillsMode === 'explicit' ? t('presetModeExplicit') : t('presetModeSparse'),
      );
    }

    function presetModeHint(preset, t) {
      return preset.skillsMode === 'explicit' ? t('presetModeExplicitHint') : t('presetModeSparseHint');
    }

    /** The portable shape: what an export writes and an import accepts. */
    function serializePreset(preset) {
      return {
        name: preset.isDefault ? 'Default' : preset.name,
        skillsMode: preset.skillsMode,
        base: preset.base ?? null,
        capturedAt: preset.capturedAt ?? null,
        mcp: (preset.mcp ?? []).map((item) => item.id),
        skills: Object.fromEntries((preset.skills ?? []).map((item) => [item.name, item.state])),
        // Provider ids travel, not their names: an import resolves them against
        // the local registration and reports the ones it cannot find.
        plugins: {
          desired: (preset.plugins ?? [])
            .filter((item) => item.enabled !== false)
            .map((item) => ({ providerId: item.providerId, enabled: true })),
        },
        bundles: preset.bundles ?? [],
      };
    }

    function downloadJson(filename, value) {
      const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }

    function PresetRow({ preset, isWorkspaceDefault, t, onEdit, onExport, onDefault, onDelete }) {
      const missing = (preset.missing?.mcp?.length ?? 0) + (preset.missing?.skills?.length ?? 0);
      return h(
        'div',
        { className: 'ch-row' },
        h(
          'div',
          { className: 'ch-row-main' },
          h(
            'div',
            { className: 'ch-row-title-line' },
            h('span', { className: 'ch-row-title' }, presetLabel(preset, t)),
            preset.isDefault ? null : h(PresetModeBadge, { preset, t }),
            isWorkspaceDefault ? h(Badge, { tone: 'success' }, t('workspaceDefaultFrom')) : null,
            missing > 0 ? h(Badge, { tone: 'warn' }, `${missing} ${t('notInstalled')}`) : null,
          ),
          h(
            'div',
            { className: 'ch-row-meta' },
            `${preset.counts.mcp} ${t('mcpCount')} · ${preset.counts.skills} ${t('skillCount')} · ${preset.counts.plugins} ${t('pluginCount')}`,
          ),
          h('div', { className: 'ch-row-meta' }, presetModeHint(preset, t)),
        ),
        h(
          'div',
          { className: 'ch-row-actions' },
          h(Button, { size: 'sm', onClick: onEdit }, t('edit')),
          h(Button, { size: 'sm', onClick: onExport }, t('exportPreset')),
          isWorkspaceDefault
            ? h(Button, { size: 'sm', variant: 'ghost', onClick: onDefault }, t('clearWorkspaceDefault'))
            : h(Button, { size: 'sm', variant: 'ghost', onClick: onDefault }, t('workspaceDefault')),
          preset.isDefault ? null : h(Button, { size: 'sm', variant: 'danger-ghost', onClick: onDelete }, t('delete')),
        ),
      );
    }

    /**
     * Create or edit a preset.
     *
     * Editing is the only place a preset's contents change outside a Session;
     * the Session panel writes a preset from its own selection instead.
     */
    function PresetEditor({ t, mode, initial, libraryMcp, libraryProviders, installedSkills, catalogs, unfiled, onClose, onSaved }) {
      // A preset created from the default one is a new preset: it inherits the
      // default's *contents*, not its identity, name or baseline mode.
      const isDefaultPreset = mode === 'update' && initial?.isDefault === true;
      const [name, setName] = useState(mode === 'create' ? '' : initial?.name ?? '');
      const [skillsMode, setSkillsMode] = useState(
        // A new preset is a baseline by default: it lists what it adds or
        // excludes, and Skills installed later still follow the install.
        mode === 'create' ? 'sparse' : initial?.skillsMode ?? 'sparse',
      );
      // Creating a preset starts empty: ticking capabilities is independent of
      // whatever this Session (or the default preset) currently has.
      const [selected, setSelected] = useState(
        () =>
          new Set(
            mode === 'update'
              ? (initial?.mcp ?? []).filter((item) => item.present).map((item) => item.id)
              : [],
          ),
      );
      const [providerIds, setProviderIds] = useState(
        () =>
          new Set(
            mode === 'update'
              ? (initial?.plugins ?? [])
                  .filter((item) => item.enabled !== false && item.present !== false)
                  .map((item) => item.providerId)
              : [],
          ),
      );
      const [states, setStates] = useState(() => {
        const map = {};
        if (mode === 'update') for (const item of initial?.skills ?? []) map[item.name] = item.state;
        return map;
      });
      const [seedFromDefault, setSeedFromDefault] = useState(false);
      const [busy, setBusy] = useState(false);

      const missingMcp = (initial?.mcp ?? []).filter((item) => !item.present);
      const missingProviders = (initial?.plugins ?? []).filter((item) => item.present === false);

      /** Copy the default preset's contents in, or clear back to empty. */
      const applySeed = (on) => {
        setSeedFromDefault(on);
        if (!on) {
          setSelected(new Set());
          setProviderIds(new Set());
          setStates({});
          return;
        }
        setSelected(new Set((initial?.mcp ?? []).filter((item) => item.present).map((item) => item.id)));
        setProviderIds(
          new Set(
            (initial?.plugins ?? [])
              .filter((item) => item.enabled !== false && item.present !== false)
              .map((item) => item.providerId),
          ),
        );
        const map = {};
        for (const item of initial?.skills ?? []) map[item.name] = item.state;
        setStates(map);
      };

      // One section per directory, then everything that no directory owns.
      // The same capability may appear in two directories (the user allowed
      // that); both checkboxes drive the same selection.
      // Without directory data from the host, fall back to one flat section so
      // the editor still works against an older host.
      const hasDirectories = unfiled !== undefined;
      const unfiledData = unfiled ?? {
        mcp: (libraryMcp ?? []).map((server) => ({
          kind: 'mcp',
          id: server.id,
          name: server.name,
          present: true,
          enabled: server.enabled !== false,
        })),
        providers: (libraryProviders ?? []).map((provider) => ({
          kind: 'provider',
          id: provider.id,
          name: provider.packageName,
          present: true,
          enabled: provider.enabled !== false,
          mountAt: provider.mountAt,
        })),
        skills: [],
      };
      const sections = [
        ...(hasDirectories ? (catalogs ?? []) : []).map((catalog) => ({
          key: `catalog:${catalog.id}`,
          title: catalog.name,
          mcp: catalog.mcp ?? [],
          providers: catalog.providers ?? [],
          skills: (catalog.skills ?? []).map((item) => ({ name: item.name, installed: item.present })),
        })),
        {
          key: 'unfiled',
          title: t('catalogUnfiled'),
          mcp: unfiledData.mcp ?? [],
          providers: unfiledData.providers ?? [],
          skills: hasDirectories
            ? (unfiledData.skills ?? []).map((item) => ({ name: item.name, installed: item.present }))
            : (installedSkills ?? []).map((skill) => ({ name: skill.name, installed: true })),
        },
      ];
      // A Skill the preset references but that is installed nowhere and belongs
      // to no directory must still be visible, or it could never be removed.
      const shownSkills = new Set();
      for (const section of sections) for (const skill of section.skills) shownSkills.add(skill.name);
      const leftoverSkills = (initial?.skills ?? [])
        .filter((item) => !shownSkills.has(item.name))
        .map((item) => ({ name: item.name, installed: false }));
      if (leftoverSkills.length > 0) sections[sections.length - 1].skills.push(...leftoverSkills);

      const toggleMcp = (id) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
      };

      const toggleProvider = (id) => {
        const next = new Set(providerIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setProviderIds(next);
      };

      const selectGroup = (section, on) => {
        const mcpIds = new Set(selected);
        const providers = new Set(providerIds);
        const skillStates = { ...states };
        for (const item of section.mcp) {
          if (item.present === false) continue;
          if (on) mcpIds.add(item.id);
          else mcpIds.delete(item.id);
        }
        for (const item of section.providers) {
          if (item.present === false) continue;
          if (on) providers.add(item.id);
          else providers.delete(item.id);
        }
        for (const item of section.skills) {
          if (item.installed === false) continue;
          skillStates[item.name] = on ? 'auto' : 'off';
        }
        setSelected(mcpIds);
        setProviderIds(providers);
        setStates(skillStates);
      };

      const submit = async () => {
        setBusy(true);
        try {
          await call('savePreset', {
            mode,
            preset: {
              ...(mode === 'update' ? { id: initial.id } : {}),
              name: name.trim() || t('newPreset'),
              skillsMode,
              mcp: [...selected],
              skills: states,
              plugins: {
                desired: [...providerIds].map((providerId) => ({ providerId, enabled: true })),
              },
            },
          });
          onSaved();
        } catch (error) {
          notifyError(t, error);
        } finally {
          setBusy(false);
        }
      };

      return h(
        Modal,
        {
          title: mode === 'create' ? t('newPreset') : `${t('editPreset')} · ${presetLabel(initial, t)}`,
          subtitle: presetModeHint({ skillsMode }, t),
          onClose,
          t,
          wide: true,
          footer: h(
            React.Fragment,
            null,
            h(Button, { onClick: onClose }, t('cancel')),
            h(Button, { variant: 'primary', onClick: submit, disabled: busy }, busy ? h(Spinner) : t('save')),
          ),
        },
        h(
          'div',
          { className: 'ch-form' },
          h(
            'label',
            { className: 'ch-field' },
            h('span', { className: 'ch-field-label' }, t('name')),
            h('input', {
              className: 'ch-input',
              value: isDefaultPreset ? t('defaultPreset') : name,
              disabled: isDefaultPreset || busy,
              placeholder: t('presetSelect'),
              onChange: (event) => setName(event.target.value),
            }),
          ),
          isDefaultPreset
            ? null
            : h(
                'div',
                { className: 'ch-field' },
                h('span', { className: 'ch-field-label' }, t('presetDetail')),
                h(Segmented, {
                  value: skillsMode,
                  disabled: busy,
                  onChange: setSkillsMode,
                  options: [
                    { value: 'explicit', label: t('presetModeExplicit') },
                    { value: 'sparse', label: t('presetModeSparse') },
                  ],
                }),
              ),
          mode === 'create'
            ? h(
                'label',
                { className: 'ch-check-line' },
                h('input', {
                  type: 'checkbox',
                  checked: seedFromDefault,
                  disabled: busy,
                  onChange: (event) => applySeed(event.target.checked),
                }),
                t('catalogFromPreset'),
              )
            : null,
          mode === 'create' ? h('div', { className: 'ch-note' }, t('catalogFromPresetHint')) : null,
          sections.map((section) => {
            const total = section.mcp.length + section.providers.length + section.skills.length;
            return h(
              'div',
              { key: section.key, className: 'ch-section' },
              h(
                'div',
                { className: 'ch-section-head' },
                h('div', { className: 'ch-section-title' }, section.title),
                h('span', { className: 'ch-muted' }, `${total}`),
                total > 0
                  ? h(
                      Button,
                      { size: 'sm', variant: 'ghost', disabled: busy, onClick: () => selectGroup(section, true) },
                      t('catalogSelectAll'),
                    )
                  : null,
                total > 0
                  ? h(
                      Button,
                      { size: 'sm', variant: 'ghost', disabled: busy, onClick: () => selectGroup(section, false) },
                      t('catalogSelectNone'),
                    )
                  : null,
              ),
              section.mcp.length > 0
                ? h(
                    'div',
                    { className: 'ch-catalog-group-head' },
                    h('span', null, t('mcp')),
                    h('span', { className: 'ch-catalog-group-count' }, String(section.mcp.length)),
                  )
                : null,
              section.mcp.map((item) =>
                h(
                  'label',
                  { key: `mcp:${item.id}`, className: 'ch-import-row' },
                  h('input', {
                    type: 'checkbox',
                    checked: selected.has(item.id),
                    disabled: busy,
                    onChange: () => toggleMcp(item.id),
                  }),
                  h(
                    'div',
                    { className: 'ch-row-main' },
                    h(
                      'div',
                      { className: 'ch-row-title-line' },
                      h('span', { className: 'ch-row-title' }, item.name),
                      item.present === false
                        ? h(Badge, { tone: 'warn' }, t('catalogMissingItem'))
                        : null,
                      item.enabled === false ? h(Badge, null, t('disabled')) : null,
                    ),
                  ),
                ),
              ),
              section.providers.length > 0
                ? h(
                    'div',
                    { className: 'ch-catalog-group-head' },
                    h('span', null, t('pluginsTab')),
                    h('span', { className: 'ch-catalog-group-count' }, String(section.providers.length)),
                  )
                : null,
              section.providers.map((item) =>
                h(
                  'label',
                  { key: `provider:${item.id}`, className: 'ch-import-row' },
                  h('input', {
                    type: 'checkbox',
                    checked: providerIds.has(item.id),
                    disabled: busy,
                    onChange: () => toggleProvider(item.id),
                  }),
                  h(
                    'div',
                    { className: 'ch-row-main' },
                    h(
                      'div',
                      { className: 'ch-row-title-line' },
                      h('span', { className: 'ch-row-title' }, item.name),
                      item.mountAt ? h(Badge, null, mountAtLabel(item.mountAt, t)) : null,
                      item.present === false
                        ? h(Badge, { tone: 'warn' }, t('pluginMissing'))
                        : null,
                      item.enabled === false ? h(Badge, { tone: 'warn' }, t('disabled')) : null,
                      item.verdict?.level === 'profile-only'
                        ? h(Badge, { tone: 'error' }, t('pluginVerdictProfileOnly'))
                        : null,
                    ),
                  ),
                ),
              ),
              section.skills.length > 0
                ? h(
                    'div',
                    { className: 'ch-catalog-group-head' },
                    h('span', null, t('skills')),
                    h('span', { className: 'ch-catalog-group-count' }, String(section.skills.length)),
                  )
                : null,
              section.skills.map((skill) =>
                h(
                  'div',
                  { key: `skill:${skill.name}`, className: 'ch-toggle-row' },
                  h(
                    'div',
                    { className: 'ch-toggle-main' },
                    h(
                      'div',
                      { className: 'ch-row-title-line' },
                      h('span', { className: 'ch-row-title' }, skill.name),
                      skill.installed === false ? h(Badge, { tone: 'warn' }, t('notInstalled')) : null,
                    ),
                  ),
                  h(Segmented, {
                    value: states[skill.name] ?? 'auto',
                    disabled: busy,
                    onChange: (value) => setStates({ ...states, [skill.name]: value }),
                    options: [
                      { value: 'auto', label: t('stateAuto') },
                      { value: 'manual', label: t('stateManual') },
                      { value: 'off', label: t('stateOff') },
                    ],
                  }),
                ),
              ),
              total === 0 ? h('div', { className: 'ch-note' }, t('catalogEmpty')) : null,
            );
          }),
          missingMcp.length > 0
            ? h(
                'div',
                { className: 'ch-note' },
                `${t('missingMcp')}: ${missingMcp.map((item) => item.name).join(', ')}`,
              )
            : null,
          missingProviders.length > 0
            ? h(
                'div',
                { className: 'ch-note' },
                `${t('pluginMissing')}: ${missingProviders.map((item) => item.providerId).join(', ')}`,
              )
            : null,
          h('div', { className: 'ch-note' }, t('pluginsNote')),
        ),
      );
    }

    function ImportPresetModal({ t, onClose, onImported }) {
      const [text, setText] = useState('');
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState(null);

      const submit = async () => {
        setBusy(true);
        setError(null);
        try {
          let parsed;
          try {
            parsed = JSON.parse(text);
          } catch (parseError) {
            throw new Error(String(parseError.message ?? parseError));
          }
          await call('importPreset', { preset: parsed?.preset ?? parsed });
          onImported();
        } catch (importError) {
          setError(String(importError.message ?? importError));
        } finally {
          setBusy(false);
        }
      };

      return h(
        Modal,
        {
          title: t('importPreset'),
          subtitle: t('importPresetHint'),
          onClose,
          t,
          footer: h(
            React.Fragment,
            null,
            h(Button, { onClick: onClose }, t('cancel')),
            h(
              Button,
              { variant: 'primary', onClick: submit, disabled: busy || text.trim() === '' },
              busy ? h(Spinner) : t('importPreset'),
            ),
          ),
        },
        h(
          'div',
          { className: 'ch-form' },
          h('textarea', {
            className: 'ch-input ch-textarea ch-textarea-lg ch-mono',
            value: text,
            placeholder: '{"preset":{"name":"...","mcp":[],"skills":{}}}',
            onChange: (event) => setText(event.target.value),
          }),
          error ? h('div', { className: 'ch-row-error' }, error) : null,
        ),
      );
    }

    /**
     * Register one third-party plugin as a capability provider.
     *
     * Four steps on purpose: picking the plugin, seeing *why* it is judged
     * mountable, choosing when it may apply, and confirming the takeover — the
     * last one changes the whole profile, not just this Session.
     */
    function RegisterPluginModal({ t, listing, onClose, onRegistered }) {
      const candidates = (listing?.entries ?? []).filter((row) => !row.registered);
      const [entryId, setEntryId] = useState(candidates[0]?.entryId ?? null);
      const [step, setStep] = useState(1);
      const [inspection, setInspection] = useState(null);
      const [mountAt, setMountAt] = useState('session-start');
      const [configText, setConfigText] = useState('');
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState(null);

      const selected = candidates.find((row) => row.entryId === entryId) ?? null;

      const inspect = async () => {
        setBusy(true);
        setError(null);
        try {
          const value = await call('inspectCapabilityPlugin', { entryId });
          setInspection(value);
          setStep(2);
        } catch (inspectError) {
          setError(String(inspectError.message ?? inspectError));
        } finally {
          setBusy(false);
        }
      };

      const submit = async () => {
        setBusy(true);
        setError(null);
        let config = {};
        if (configText.trim().length > 0) {
          try {
            const parsed = JSON.parse(configText);
            if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
              throw new Error(t('pluginConfigInvalid'));
            }
            config = parsed;
          } catch (parseError) {
            setError(String(parseError.message ?? parseError));
            setBusy(false);
            return;
          }
        }
        try {
          const value = await call('registerProvider', { entryId, mountAt, config });
          onRegistered(value);
        } catch (registerError) {
          setError(String(registerError.message ?? registerError));
        } finally {
          setBusy(false);
        }
      };

      const footer = h(
        React.Fragment,
        null,
        h(Button, { onClick: onClose }, t('cancel')),
        step > 1
          ? h(Button, { onClick: () => setStep(step - 1), disabled: busy }, t('back'))
          : null,
        step === 1
          ? h(Button, { variant: 'primary', onClick: inspect, disabled: busy || selected === null }, t('pluginInspect'))
          : null,
        step === 2
          ? h(
              Button,
              {
                variant: 'primary',
                onClick: () => setStep(3),
                disabled: busy || inspection?.verdict?.level === 'profile-only',
              },
              t('next'),
            )
          : null,
        step === 3
          ? h(Button, { variant: 'primary', onClick: () => setStep(4), disabled: busy }, t('next'))
          : null,
        step === 4
          ? h(Button, { variant: 'primary', onClick: submit, disabled: busy }, busy ? h(Spinner) : t('pluginTakeover'))
          : null,
      );

      return h(
        Modal,
        {
          title: `${t('registerPlugin')} · ${step}/4`,
          subtitle: t('pluginThirdPartyHint'),
          onClose,
          t,
          wide: true,
          footer,
        },
        h(
          'div',
          { className: 'ch-form' },
          step === 1
            ? h(
                'div',
                { className: 'ch-stack' },
                h('div', { className: 'ch-section-title' }, t('pluginCandidates')),
                candidates.length === 0 ? h(Empty, null, t('pluginNoCandidates')) : null,
                candidates.map((row) =>
                  h(
                    'label',
                    { key: row.entryId, className: 'ch-import-row' },
                    h('input', {
                      type: 'radio',
                      name: 'ch-plugin-candidate',
                      checked: row.entryId === entryId,
                      disabled: busy,
                      onChange: () => setEntryId(row.entryId),
                    }),
                    h(
                      'div',
                      { className: 'ch-row-main' },
                      h(
                        'div',
                        { className: 'ch-row-title-line' },
                        h('span', { className: 'ch-row-title' }, row.moduleName),
                        row.enabled ? h(Badge, { tone: 'info' }, t('enabled')) : h(Badge, null, t('disabled')),
                        row.addressable ? null : h(Badge, { tone: 'warn' }, t('pluginVerdictProfileOnly')),
                      ),
                      h('div', { className: 'ch-row-meta ch-mono' }, row.entryId),
                    ),
                  ),
                ),
              )
            : null,
          step === 2 && inspection
            ? h(
                'div',
                { className: 'ch-stack' },
                h(
                  'div',
                  { className: 'ch-row-title-line' },
                  h('span', { className: 'ch-row-title' }, selected?.moduleName ?? entryId),
                  h(Badge, { tone: verdictTone(inspection.verdict) }, verdictLabel(inspection.verdict, t)),
                ),
                (inspection.verdict?.reasons ?? []).map((reason, index) =>
                  h('div', { key: `reason-${index}`, className: 'ch-row-meta' }, `· ${reason}`),
                ),
                inspection.inspected?.inject?.length
                  ? h('div', { className: 'ch-row-meta ch-mono' }, `inject: ${inspection.inspected.inject.join(', ')}`)
                  : null,
                inspection.inspected?.hasConfig
                  ? h('div', { className: 'ch-row-meta' }, t('pluginConfig'))
                  : null,
                inspection.verdict?.level === 'profile-only'
                  ? h('div', { className: 'ch-row-error' }, t('pluginVerdictProfileOnly'))
                  : null,
              )
            : null,
          step === 3
            ? h(
                'div',
                { className: 'ch-stack' },
                h(
                  'div',
                  { className: 'ch-field' },
                  h('span', { className: 'ch-field-label' }, t('pluginMountAt')),
                  h(Segmented, {
                    value: mountAt,
                    disabled: busy,
                    onChange: setMountAt,
                    options: [
                      { value: 'session-start', label: t('pluginMountStart') },
                      { value: 'any-time', label: t('pluginMountAny') },
                    ],
                  }),
                  h(
                    'div',
                    { className: 'ch-note' },
                    mountAt === 'session-start' ? t('pluginMountStartHint') : t('pluginMountAnyHint'),
                  ),
                ),
                h(
                  'div',
                  { className: 'ch-field' },
                  h('span', { className: 'ch-field-label' }, t('pluginConfig')),
                  h('textarea', {
                    className: 'ch-input ch-textarea ch-mono',
                    value: configText,
                    placeholder: '{}',
                    onChange: (event) => setConfigText(event.target.value),
                  }),
                  h('div', { className: 'ch-note' }, t('pluginConfigHint')),
                ),
              )
            : null,
          step === 4
            ? h(
                'div',
                { className: 'ch-stack' },
                h('div', { className: 'ch-note' }, t('pluginTakeoverWarn')),
                h('div', { className: 'ch-note' }, t('pluginTakeoverLive')),
                h(
                  'div',
                  { className: 'ch-row-meta ch-mono' },
                  `${selected?.moduleName ?? entryId} · ${mountAtLabel(mountAt, t)}`,
                ),
                configText.trim().length > 0
                  ? h('pre', { className: 'ch-pre' }, configText)
                  : null,
              )
            : null,
          error ? h('div', { className: 'ch-row-error' }, error) : null,
        ),
      );
    }

    // ── Capability directories ───────────────────────────────────────────────
    // A directory is a user-owned grouping ("浏览器", "长期记忆"): members are
    // MCP servers, providers and Skills, grouped by kind inside it. A capability
    // may sit in several directories; membership is a view, never a capability
    // set, so it does not change what a Session runs.

    /** Flatten a resolved catalog (or the unfiled bucket) into rows. */
    function catalogRows(group) {
      return [
        ...(group?.mcp ?? []).map((item) => ({ ...item, kind: 'mcp' })),
        ...(group?.providers ?? []).map((item) => ({ ...item, kind: 'provider' })),
        ...(group?.skills ?? []).map((item) => ({ ...item, kind: 'skill' })),
      ];
    }

    /** Normalise the three library shapes into one option list. */
    function catalogOptions(t, library) {
      return [
        ...(library?.mcp ?? []).map((server) => ({
          key: `mcp:${server.id}`,
          kind: 'mcp',
          id: server.id,
          name: server.name,
          note: server.enabled === false ? t('disabled') : server.transport === 'stdio' ? server.command : server.url,
        })),
        ...(library?.providers ?? []).map((provider) => ({
          key: `provider:${provider.id ?? provider.providerId}`,
          kind: 'provider',
          id: provider.id ?? provider.providerId,
          name: provider.packageName ?? provider.name,
          note: provider.entryId ?? '',
        })),
        ...(library?.skills ?? []).map((skill) => ({
          key: `skill:${skill.name}`,
          kind: 'skill',
          id: skill.name,
          name: skill.name,
          note: skill.description ?? '',
        })),
      ];
    }

    /** One member checkbox list; used by the directory editor. */
    function CatalogPicker({ t, options, selected, onToggle, disabled }) {
      const kinds = [
        { kind: 'mcp', label: t('mcp') },
        { kind: 'provider', label: t('pluginsTab') },
        { kind: 'skill', label: t('skills') },
      ];
      return h(
        'div',
        { className: 'ch-stack' },
        kinds.map(({ kind, label }) => {
          const rows = options.filter((option) => option.kind === kind);
          if (rows.length === 0) return null;
          return h(
            'div',
            { key: kind, className: 'ch-section' },
            h(
              'div',
              { className: 'ch-section-head' },
              h('div', { className: 'ch-section-title' }, label),
              h('span', { className: 'ch-muted' }, `${rows.length}`),
            ),
            rows.map((option) =>
              h(
                'label',
                { key: option.key, className: 'ch-import-row' },
                h('input', {
                  type: 'checkbox',
                  checked: selected.has(option.key),
                  disabled,
                  onChange: () => onToggle(option.key),
                }),
                h(
                  'div',
                  { className: 'ch-row-main' },
                  h('div', { className: 'ch-row-title-line' }, h('span', { className: 'ch-row-title' }, option.name)),
                  option.note ? h('div', { className: 'ch-row-meta ch-mono' }, option.note) : null,
                ),
              ),
            ),
          );
        }),
      );
    }

    function CatalogEditor({ t, initial, library, onClose, onSaved }) {
      const options = catalogOptions(t, library);
      const [name, setName] = useState(initial?.name ?? '');
      const [selected, setSelected] = useState(
        () => new Set((initial?.members ?? []).map((member) => `${member.kind}:${member.id}`)),
      );
      const [busy, setBusy] = useState(false);

      const toggle = (key) => {
        const next = new Set(selected);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setSelected(next);
      };

      const submit = async () => {
        setBusy(true);
        try {
          // Keep members whose capability vanished: the directory should still
          // name them (the UI marks them), and saving an unrelated rename must
          // not quietly drop them.
          const byKey = new Map((initial?.members ?? []).map((member) => [`${member.kind}:${member.id}`, member]));
          for (const option of options) byKey.set(option.key, { kind: option.kind, id: option.id });
          const members = [...selected]
            .map((key) => byKey.get(key) ?? null)
            .filter(Boolean)
            .map(({ kind, id }) => ({ kind, id }));
          await call('saveCatalog', {
            catalog: {
              ...(initial?.id ? { id: initial.id } : {}),
              name: name.trim() || t('catalogNew'),
              members,
            },
          });
          onSaved();
        } catch (error) {
          notifyError(t, error);
        } finally {
          setBusy(false);
        }
      };

      return h(
        Modal,
        {
          title: initial?.id ? t('catalogEdit') : t('catalogNew'),
          subtitle: t('catalogMembers'),
          onClose,
          t,
          wide: true,
          footer: h(
            React.Fragment,
            null,
            h(Button, { onClick: onClose }, t('cancel')),
            h(Button, { variant: 'primary', onClick: submit, disabled: busy }, busy ? h(Spinner) : t('save')),
          ),
        },
        h(
          'div',
          { className: 'ch-form' },
          h(
            'label',
            { className: 'ch-field' },
            h('span', { className: 'ch-field-label' }, t('catalogName')),
            h('input', {
              className: 'ch-input',
              value: name,
              disabled: busy,
              onChange: (event) => setName(event.target.value),
            }),
          ),
          catalogOptions(t, library).length === 0
            ? h(Empty, null, t('catalogNoItems'))
            : h(CatalogPicker, { t, options, selected, onToggle: toggle, disabled: busy }),
        ),
      );
    }

    function SettingsPage({ t }) {
      const { data, loading, error, reload } = useAsync(() => call('getSettings'), []);
      const [tab, setTab] = useState('presets');
      const [modal, setModal] = useState(null);
      const [toast, setToast] = useState(null);

      const showToast = (message) => {
        setToast(message);
        window.setTimeout(() => setToast(null), 2400);
      };

      const removeSkill = async (skill) => {
        if (!(await askConfirm(t('remove'), t('confirmDeleteSkill'), { danger: true, confirmLabel: t('delete') }))) {
          return;
        }
        try {
          await call('deleteSkill', { name: skill.name, source: skill.source, cwd: data?.cwd });
          await reload();
          showToast(t('applied'));
        } catch (removeError) {
          notifyError(t, removeError);
        }
      };

      const removeMcp = async (server) => {
        if (!(await askConfirm(t('remove'), t('confirmDeleteMcp'), { danger: true, confirmLabel: t('delete') }))) {
          return;
        }
        try {
          await call('deleteMcp', { id: server.id });
          await reload();
          showToast(t('applied'));
        } catch (removeError) {
          notifyError(t, removeError);
        }
      };

      const toggleMcp = async (server, enabled) => {
        try {
          await call('saveMcp', { mcp: { id: server.id, enabled } });
          await reload();
          showToast(t('applied'));
        } catch (toggleError) {
          notifyError(t, toggleError);
        }
      };

      const onSaved = async () => {
        setModal(null);
        await reload();
        showToast(t('applied'));
      };

      const defaultPreset = data?.presets?.find((preset) => preset.isDefault);

      const toggleWorkspaceDefault = async (presetId, currentId) => {
        try {
          if (presetId === currentId) {
            await call('clearWorkspaceDefault', { cwd: data?.cwd });
            showToast(t('cleared'));
          } else {
            await call('setWorkspaceDefault', { cwd: data?.cwd, presetId });
            showToast(t('workspaceDefaultSaved'));
          }
          await reload();
        } catch (setError) {
          notifyError(t, setError);
        }
      };

      const removePreset = async (preset) => {
        const confirmed = await askConfirm(
          t('deletePreset'),
          `${presetLabel(preset, t)}?`,
          { danger: true, confirmLabel: t('delete'), detail: t('deletePresetHint') },
        );
        if (!confirmed) return;
        try {
          await call('deletePreset', { id: preset.id });
          await reload();
          showToast(t('applied'));
        } catch (removeError) {
          notifyError(t, removeError);
        }
      };

      // ── Capability directories ──────────────────────────────────────────
      const catalogs = data?.catalogs ?? [];
      const unfiled = data?.unfiled ?? { mcp: [], skills: [], providers: [] };

      const deleteCatalog = async (catalog) => {
        const confirmed = await askConfirm(t('catalogEdit'), catalog.name, {
          danger: true,
          confirmLabel: t('delete'),
          detail: t('catalogDeleteHint'),
        });
        if (!confirmed) return;
        try {
          await call('deleteCatalog', { id: catalog.id });
          await reload();
          showToast(t('applied'));
        } catch (deleteError) {
          notifyError(t, deleteError);
        }
      };

      // ── Capability providers ────────────────────────────────────────────
      const providerListing = data?.capabilityPlugins ?? null;
      const providers = providerListing?.providers ?? [];

      const releaseProvider = async (provider) => {
        const confirmed = await askConfirm(
          t('pluginRelease'),
          provider.packageName,
          { danger: true, confirmLabel: t('pluginRelease'), detail: t('pluginReleaseWarn') },
        );
        if (!confirmed) return;
        try {
          const value = await call('unregisterProvider', { id: provider.id });
          await reload();
          const notice = applicationNotice(value.application, t);
          showToast(notice === null ? t('pluginReleased') : notice.text);
        } catch (releaseError) {
          notifyError(t, releaseError);
        }
      };

      const recheckProvider = async (provider) => {
        try {
          const value = await call('recheckProvider', { id: provider.id });
          await reload();
          showToast(`${verdictLabel(value.verdict, t)}`);
        } catch (recheckError) {
          notifyError(t, recheckError);
        }
      };

      const toggleProvider = async (provider, enabled) => {
        try {
          await call('setProviderEnabled', { id: provider.id, enabled });
          await reload();
          showToast(t('applied'));
        } catch (toggleError) {
          notifyError(t, toggleError);
        }
      };

      const onProviderRegistered = async (value) => {
        setModal(null);
        await reload();
        const notice = applicationNotice(value.application, t);
        showToast(notice === null ? t('pluginTakeoverDone') : notice.text);
      };

      if (loading && !data) return h('div', { className: 'ch-loading' }, h(Spinner), t('loading'));
      if (error && !data) return h(ErrorBox, { error, onRetry: reload, t });

      const hostOutdated = data !== null && typeof data.hostApi === 'number' && data.hostApi !== CLIENT_API;

      return h(
        'div',
        { className: 'ch-page' },
        h(
          'div',
          { className: 'ch-page-head' },
          h(
            'div',
            null,
            h('div', { className: 'ch-page-title' }, t('title')),
            h('div', { className: 'ch-page-subtitle' }, t('settingsSubtitle')),
          ),
          h(
            'div',
            { className: 'ch-page-actions' },
            h(Button, { size: 'sm', onClick: reload }, t('refresh')),
            h(Button, { size: 'sm', variant: 'primary', onClick: () => setModal({ kind: 'mcp' }) }, t('addMcp')),
          ),
        ),
        h(
          'div',
          { className: 'ch-stat-line' },
          h('span', null, `${data?.stats?.presets ?? 0} ${t('presets')}`),
          h('span', { className: 'ch-dot-sep' }),
          h('span', null, `${data?.stats?.mcp ?? 0} MCP`),
          h('span', { className: 'ch-dot-sep' }),
          h('span', null, `${data?.stats?.skills ?? 0} Skills`),
        ),
        hostOutdated
          ? h('div', { className: 'ch-note ch-note-warn' }, `${t('hostOutdated')} · ${t('hostOutdatedHint')}`)
          : null,
        h(Tabs, {
          value: tab,
          onChange: setTab,
          items: [
            { id: 'presets', label: t('presets'), count: data?.presets?.length ?? 0 },
            { id: 'catalogs', label: t('catalogsTab'), count: catalogs.length },
            { id: 'mcp', label: t('mcp'), count: data?.mcp?.length ?? 0 },
            { id: 'plugins', label: t('pluginsTab'), count: providers.length },
            { id: 'skills', label: t('skills'), count: data?.skills?.length ?? 0 },
            { id: 'import', label: t('importTab') },
          ],
        }),
        h(
          'div',
          { className: 'ch-tab-body' },
          tab === 'skills'
            ? h(
                'div',
                { className: 'ch-stack' },
                data?.skills?.length
                  ? data.skills.map((skill) => h(SkillRow, { key: `${skill.source}:${skill.name}`, skill, t, onRemove: removeSkill }))
                  : h(Empty, null, t('emptySkills')),
              )
            : null,
          tab === 'mcp'
            ? h(
                'div',
                { className: 'ch-stack' },
                h(
                  'div',
                  { className: 'ch-toolbar' },
                  h(Button, { size: 'sm', onClick: () => setModal({ kind: 'paste' }) }, t('pasteJson')),
                ),
                data?.mcp?.length
                  ? data.mcp.map((server) =>
                      h(McpRow, {
                        key: server.id,
                        server,
                        t,
                        onEdit: () => setModal({ kind: 'mcp', initial: server }),
                        onRemove: removeMcp,
                        onToggle: toggleMcp,
                      }),
                    )
                  : h(Empty, null, t('emptyMcp')),
              )
            : null,
          tab === 'presets'
            ? h(
                'div',
                { className: 'ch-stack' },
                h('div', { className: 'ch-note' }, t('defaultPresetHint')),
                data?.migration ? h('div', { className: 'ch-note' }, t('migrationNote')) : null,
                h(
                  'div',
                  { className: 'ch-toolbar' },
                  h(
                    Button,
                    {
                      size: 'sm',
                      variant: 'primary',
                      onClick: () => setModal({ kind: 'preset', mode: 'create', seed: defaultPreset }),
                    },
                    t('createPreset'),
                  ),
                  h(Button, { size: 'sm', onClick: () => setModal({ kind: 'importPreset' }) }, t('importPreset')),
                ),
                data?.presets?.length
                  ? data.presets.map((preset) =>
                      h(PresetRow, {
                        key: preset.id,
                        preset,
                        t,
                        isWorkspaceDefault: preset.id === data.workspacePresetId,
                        onEdit: () => setModal({ kind: 'preset', mode: 'update', seed: preset }),
                        onExport: () =>
                          downloadJson(`capability-preset-${preset.id}.json`, {
                            kind: 'capability-hub/preset',
                            version: 1,
                            exportedAt: new Date().toISOString(),
                            preset: serializePreset(preset),
                          }),
                        onDefault: () => toggleWorkspaceDefault(preset.id, data.workspacePresetId),
                        onDelete: () => removePreset(preset),
                      }),
                    )
                  : h(Empty, null, t('emptyPresets')),
              )
            : null,
          tab === 'catalogs'
            ? h(
                'div',
                { className: 'ch-stack' },
                h('div', { className: 'ch-note' }, t('catalogDeleteHint')),
                h(
                  'div',
                  { className: 'ch-toolbar' },
                  h(
                    Button,
                    { size: 'sm', variant: 'primary', onClick: () => setModal({ kind: 'catalog', initial: null }) },
                    t('catalogNew'),
                  ),
                  h(
                    'span',
                    { className: 'ch-muted' },
                    `${catalogs.length} ${t('catalogItemCount')} · ${t('catalogUnfiled')}: ${
                      catalogRows(unfiled).length
                    }`,
                  ),
                ),
                catalogs.length === 0 ? h(Empty, null, t('catalogNoItems')) : null,
                catalogs.map((catalog) =>
                  h(
                    'div',
                    { key: catalog.id, className: 'ch-row' },
                    h(
                      'div',
                      { className: 'ch-row-main' },
                      h(
                        'div',
                        { className: 'ch-row-title-line' },
                        h('span', { className: 'ch-row-title' }, catalog.name),
                        catalog.counts.present < catalog.counts.total
                          ? h(
                              Badge,
                              { tone: 'warn' },
                              `${catalog.counts.total - catalog.counts.present} ${t('catalogMissingItem')}`,
                            )
                          : null,
                      ),
                      h(
                        'div',
                        { className: 'ch-row-meta' },
                        `${catalog.counts.mcp} ${t('mcp')} · ${catalog.counts.providers} ${t('pluginCount')} · ${catalog.counts.skills} ${t('skills')}`,
                      ),
                      h(
                        'div',
                        { className: 'ch-row-meta ch-mono' },
                        catalogRows(catalog)
                          .map((item) => item.name)
                          .join(', '),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'ch-row-actions' },
                      h(Button, { size: 'sm', onClick: () => setModal({ kind: 'catalog', initial: catalog }) }, t('edit')),
                      h(
                        Button,
                        { size: 'sm', variant: 'danger-ghost', onClick: () => deleteCatalog(catalog) },
                        t('delete'),
                      ),
                    ),
                  ),
                ),
              )
            : null,
          tab === 'plugins'
            ? h(
                'div',
                { className: 'ch-stack' },
                h('div', { className: 'ch-note' }, t('pluginThirdPartyHint')),
                providerListing?.available === false
                  ? h('div', { className: 'ch-note' }, t('pluginUnavailable'))
                  : null,
                h(
                  'div',
                  { className: 'ch-toolbar' },
                  h(
                    Button,
                    {
                      size: 'sm',
                      variant: 'primary',
                      disabled: providerListing?.available === false,
                      onClick: () => setModal({ kind: 'plugin' }),
                    },
                    t('registerPlugin'),
                  ),
                  h(
                    'span',
                    { className: 'ch-muted' },
                    `${(providerListing?.entries ?? []).filter((row) => !row.registered).length} ${t('pluginCandidates')}`,
                  ),
                ),
                providers.length === 0
                  ? h(Empty, null, t('pluginNoCandidates'))
                  : providers.map((provider) =>
                      h(
                        'div',
                        { key: provider.id, className: 'ch-row' },
                        h(
                          'div',
                          { className: 'ch-row-main' },
                          h(
                            'div',
                            { className: 'ch-row-title-line' },
                            h('span', { className: 'ch-row-title' }, provider.packageName),
                            h(Badge, { tone: verdictTone(provider.verdict) }, verdictLabel(provider.verdict, t)),
                            h(Badge, { tone: provider.mountAt === 'any-time' ? 'neutral' : 'info' }, mountAtLabel(provider.mountAt, t)),
                            provider.enabled ? null : h(Badge, null, t('disabled')),
                            provider.entry?.enabled
                              ? h(Badge, { tone: 'warn' }, t('enabled'))
                              : null,
                            provider.issue?.kind === 'global-resource'
                              ? h(Badge, { tone: 'error' }, t('pluginGlobalResource'))
                              : null,
                          ),
                          h('div', { className: 'ch-row-meta ch-mono' }, provider.entryId),
                          provider.issue?.kind === 'global-resource'
                            ? h('div', { className: 'ch-row-error' }, t('pluginGlobalResourceHint'))
                            : null,
                          provider.verdict?.reasons?.length
                            ? h(
                                'div',
                                { className: 'ch-row-meta' },
                                `${provider.verdict.reasons[0]}`,
                              )
                            : null,
                          provider.verdict?.checkedAt
                            ? h(
                                'div',
                                { className: 'ch-row-meta' },
                                `${t('pluginCheckedAt')}: ${relativeTime(provider.verdict.checkedAt)}`,
                              )
                            : null,
                          provider.presets?.length
                            ? h(
                                'div',
                                { className: 'ch-row-meta' },
                                `${t('presetCount')}: ${provider.presets
                                  .map((preset) => (preset.isDefault ? t('defaultPreset') : preset.name))
                                  .join(', ')}`,
                              )
                            : null,
                        ),
                        h(
                          'div',
                          { className: 'ch-row-actions' },
                          h(Switch, {
                            checked: provider.enabled,
                            label: provider.packageName,
                            onChange: (enabled) => toggleProvider(provider, enabled),
                          }),
                          h(Button, { size: 'sm', onClick: () => recheckProvider(provider) }, t('pluginRecheck')),
                          h(Button, { size: 'sm', variant: 'danger-ghost', onClick: () => releaseProvider(provider) }, t('pluginRelease')),
                        ),
                      ),
                    ),
              )
            : null,
          tab === 'import'
            ? h(ImportPanel, {
                t,
                onImported: async () => {
                  await reload();
                  showToast(t('imported'));
                },
              })
            : null,
        ),
        modal?.kind === 'mcp'
          ? h(McpForm, { t, initial: modal.initial, onClose: () => setModal(null), onSaved })
          : null,
        modal?.kind === 'paste'
          ? h(McpPasteModal, { t, onClose: () => setModal(null), onSaved })
          : null,
        modal?.kind === 'preset'
          ? h(PresetEditor, {
              t,
              mode: modal.mode,
              initial: modal.seed,
              libraryMcp: data?.mcp ?? [],
              libraryProviders: data?.capabilityPlugins?.providers ?? [],
              installedSkills: data?.skills ?? [],
              catalogs: data?.catalogs ?? [],
              unfiled: data?.unfiled ?? undefined,
              onClose: () => setModal(null),
              onSaved,
            })
          : null,
        modal?.kind === 'importPreset'
          ? h(ImportPresetModal, {
              t,
              onClose: () => setModal(null),
              onImported: async () => {
                setModal(null);
                await reload();
                showToast(t('presetImported'));
              },
            })
          : null,
        modal?.kind === 'catalog'
          ? h(CatalogEditor, {
              t,
              initial: modal.initial,
              library: { mcp: data?.mcp ?? [], skills: data?.skills ?? [], providers },
              onClose: () => setModal(null),
              onSaved: async () => {
                setModal(null);
                await reload();
                showToast(t('applied'));
              },
            })
          : null,
        modal?.kind === 'plugin'
          ? h(RegisterPluginModal, {
              t,
              listing: providerListing,
              onClose: () => setModal(null),
              onRegistered: onProviderRegistered,
            })
          : null,
        toast ? h('div', { className: 'ch-toast' }, toast) : null,
      );
    }

    function ModelView({ view, t }) {
      if (!view) return null;
      const notExposedMcp = view.mcp.filter((server) => !server.exposed);
      const notExposedSkills = view.skills.filter((skill) => skill.state !== 'auto');
      return h(
        'div',
        { className: 'ch-stack ch-model-view' },
        h(
          'div',
          { className: 'ch-estimate-grid' },
          h(
            'div',
            { className: 'ch-estimate' },
            h('div', { className: 'ch-estimate-label' }, t('estimate')),
            h('div', { className: 'ch-estimate-value' }, `~${formatTokens(view.estimates?.total)}`),
            h('div', { className: 'ch-estimate-hint' }, t('modelEstimateHint')),
          ),
          h(
            'div',
            { className: 'ch-estimate' },
            h('div', { className: 'ch-estimate-label' }, t('tools')),
            h('div', { className: 'ch-estimate-value' }, `${view.tools.length}`),
            h('div', { className: 'ch-estimate-hint' }, `~${formatTokens(view.estimates?.tools)} ${t('tokens')}`),
          ),
          h(
            'div',
            { className: 'ch-estimate' },
            h('div', { className: 'ch-estimate-label' }, t('skills')),
            h('div', { className: 'ch-estimate-value' }, `${view.skills.filter((skill) => skill.invocation.modelInvocable).length}`),
            h('div', { className: 'ch-estimate-hint' }, `~${formatTokens(view.estimates?.skills)} ${t('tokens')}`),
          ),
        ),
        !view.live ? h('div', { className: 'ch-note' }, t('notLive')) : null,
        h(
          'details',
          { className: 'ch-details', open: true },
          h('summary', null, `${t('modelTools')} (${view.tools.length})`),
          view.tools.length === 0
            ? h(Empty, null, t('modelEmpty'))
            : h(
                'div',
                { className: 'ch-list' },
                view.tools.map((tool) =>
                  h(
                    'div',
                    { key: tool.name, className: 'ch-list-row' },
                    h('span', { className: 'ch-mono ch-list-name' }, tool.name),
                    h('span', { className: 'ch-muted ch-list-desc' }, tool.description),
                    h(
                      Badge,
                      { tone: tool.source === 'native' || tool.source === 'provider' ? 'neutral' : 'info' },
                      tool.source === 'native'
                        ? t('native')
                        : tool.source === 'provider'
                          ? tool.provider ?? t('pluginsTab')
                          : t('fromMcp'),
                    ),
                  ),
                ),
              ),
        ),
        h(
          'details',
          { className: 'ch-details', open: true },
          h('summary', null, `${t('modelSkills')} (${view.skills.filter((skill) => skill.invocation.modelInvocable).length})`),
          view.skills.filter((skill) => skill.invocation.modelInvocable).length === 0
            ? h(Empty, null, t('modelEmpty'))
            : h(
                'div',
                { className: 'ch-list' },
                view.skills
                  .filter((skill) => skill.invocation.modelInvocable)
                  .map((skill) =>
                    h(
                      'div',
                      { key: skill.name, className: 'ch-list-row' },
                      h('span', { className: 'ch-mono ch-list-name' }, skill.name),
                      h('span', { className: 'ch-muted ch-list-desc' }, skill.description),
                      h('span', { className: 'ch-muted ch-mono' }, `~${formatTokens(skill.tokens)}`),
                    ),
                  ),
              ),
        ),
        h(
          'details',
          { className: 'ch-details', open: view.instructions.length > 0 },
          h('summary', null, `${t('modelInstructions')} (${view.instructions.length})`),
          h('div', { className: 'ch-note' }, t('instructionsHint')),
          view.instructions.length === 0
            ? h(Empty, null, t('noItems'))
            : view.instructions.map((section) =>
                h(
                  'div',
                  { key: section.name, className: 'ch-instruction' },
                  h(
                    'div',
                    { className: 'ch-row-title-line' },
                    h('div', { className: 'ch-mono ch-list-name' }, section.name),
                    section.provider ? h(Badge, { tone: 'info' }, section.provider) : null,
                  ),
                  h('pre', { className: 'ch-pre' }, section.text),
                ),
              ),
        ),
        h(
          'details',
          { className: 'ch-details' },
          h('summary', null, `${t('notExposedSection')} (${notExposedMcp.length + notExposedSkills.length})`),
          notExposedMcp.length === 0 && notExposedSkills.length === 0
            ? h(Empty, null, t('noItems'))
            : h(
                'div',
                { className: 'ch-list' },
                notExposedMcp.map((server) =>
                  h(
                    'div',
                    { key: `mcp:${server.id}`, className: 'ch-list-row' },
                    h('span', { className: 'ch-mono ch-list-name' }, server.name),
                    h(
                      'span',
                      { className: 'ch-muted ch-list-desc' },
                      server.enabled === false ? t('reasonDisabled') : t('reasonNotExposed'),
                    ),
                    h(Badge, null, t('mcp')),
                  ),
                ),
                notExposedSkills.map((skill) =>
                  h(
                    'div',
                    { key: `skill:${skill.name}`, className: 'ch-list-row' },
                    h('span', { className: 'ch-mono ch-list-name' }, skill.name),
                    h('span', { className: 'ch-muted ch-list-desc' }, skill.state === 'off' ? t('reasonOff') : t('reasonManual')),
                    h(Badge, { tone: skill.state === 'off' ? 'neutral' : 'warn' }, stateLabel(skill.state, t)),
                  ),
                ),
              ),
        ),
      );
    }

    /**
     * The directory view of a Session: same capabilities as the "本次会话" tab,
     * grouped by the directories the user built, with the same controls.
     *
     * Directories collapse; which ones are open is kept for the rest of the page
     * session so reopening the panel does not reset the shape.
     */
    const expandedCatalogs = new Set();

    function SessionCatalogSections({
      t,
      data,
      busy,
      onToggleMcp,
      onSkillState,
      onToggleProvider,
      onBulk,
      onCreate,
      onEdit,
      onDelete,
    }) {
      const catalogs = data?.catalogs ?? [];
      const unfiled = data?.unfiled ?? { mcp: [], skills: [], providers: [] };
      const unfiledTotal =
        (unfiled.mcp ?? []).length + (unfiled.providers ?? []).length + (unfiled.skills ?? []).length;

      // Directories are collapsed by default: this page is a directory tree, not
      // a wall of switches. Expansion is remembered for the session so reopening
      // the panel keeps the shape the user left it in.
      const [open, setOpen] = useState(() => new Set(expandedCatalogs));
      const toggle = (id) => {
        const next = new Set(open);
        if (next.has(id)) {
          next.delete(id);
          expandedCatalogs.delete(id);
        } else {
          next.add(id);
          expandedCatalogs.add(id);
        }
        setOpen(next);
      };

      const rowView = (item) => {
        if (item.kind === 'mcp') {
          const server = (data?.mcp ?? []).find((entry) => entry.id === item.id);
          return {
            badges: server
              ? [{ tone: statusTone(server.status), text: statusLabel(server.status, t) }]
              : [{ tone: 'warn', text: t('catalogMissingItem') }],
            meta: server
              ? server.transport === 'stdio'
                ? [server.command, ...(server.args ?? [])].filter(Boolean).join(' ')
                : server.url
              : null,
            error: server?.error ?? null,
            control: h(Switch, {
              checked: server?.exposed === true,
              disabled: busy || !server || server.enabled === false,
              label: item.name,
              onChange: () => onToggleMcp(server),
            }),
          };
        }
        if (item.kind === 'provider') {
          const row = (data?.providers ?? []).find((entry) => entry.providerId === item.id);
          return {
            badges: row
              ? [
                  { tone: pluginStatusTone(row.status), text: pluginStatusLabel(row.status, t) },
                  { tone: null, text: mountAtLabel(row.mountAt, t) },
                ]
              : [{ tone: 'warn', text: t('catalogMissingItem') }],
            meta: row ? row.entryId : null,
            error: row?.error ?? null,
            control: h(Switch, {
              checked: row?.desired === true,
              disabled: busy || !row || row.enabled === false,
              label: item.name,
              onChange: () => onToggleProvider(row),
            }),
          };
        }
        const skill = (data?.skills ?? []).find((entry) => entry.name === item.name);
        return {
          badges: skill ? [] : [{ tone: 'warn', text: t('catalogMissingItem') }],
          meta: skill?.description ?? null,
          error: null,
          control: h(Segmented, {
            value: skill?.state ?? 'auto',
            disabled: busy || !skill,
            onChange: (value) => onSkillState(skill, value),
            options: [
              { value: 'auto', label: t('stateAuto') },
              { value: 'manual', label: t('stateManual') },
              { value: 'off', label: t('stateOff') },
            ],
          }),
        };
      };

      const renderRow = (item) => {
        const view = rowView(item);
        return h(
          'div',
          { key: `${item.kind}:${item.id}`, className: 'ch-toggle-row' },
          h(
            'div',
            { className: 'ch-toggle-main' },
            h(
              'div',
              { className: 'ch-row-title-line' },
              h('span', { className: 'ch-row-title' }, item.name),
              view.badges.map((badge, index) => h(Badge, { key: index, tone: badge.tone }, badge.text)),
            ),
            view.meta ? h('div', { className: 'ch-row-meta ch-mono' }, view.meta) : null,
            view.error ? h('div', { className: 'ch-row-error' }, view.error) : null,
          ),
          view.control,
        );
      };

      /** One kind inside a directory, after a separator. */
      const renderGroup = (key, title, items) =>
        items.length === 0
          ? null
          : h(
              'div',
              { key, className: 'ch-catalog-group' },
              h(
                'div',
                { className: 'ch-catalog-group-head' },
                h('span', null, title),
                h('span', { className: 'ch-catalog-group-count' }, String(items.length)),
              ),
              items.map(renderRow),
            );

      const summaryOf = (group) => {
        const mcp = (group?.mcp ?? []).length;
        const providers = (group?.providers ?? []).length;
        const skills = (group?.skills ?? []).length;
        return `${mcp + providers + skills} ${t('catalogItemCount')} · ${mcp} ${t('mcp')} · ${providers} ${t('pluginCount')} · ${skills} ${t('skills')}`;
      };

      const body = (group, keyPrefix) =>
        h(
          'div',
          { className: 'ch-catalog-body' },
          mcpAndOthers(group, keyPrefix),
        );

      const mcpAndOthers = (group, keyPrefix) => {
        const blocks = [
          renderGroup(`${keyPrefix}:mcp`, t('mcp'), group?.mcp ?? []),
          renderGroup(`${keyPrefix}:provider`, t('pluginsTab'), group?.providers ?? []),
          renderGroup(`${keyPrefix}:skill`, t('skills'), group?.skills ?? []),
        ].filter(Boolean);
        return blocks.length === 0 ? h(Empty, null, t('catalogEmpty')) : blocks;
      };

      const section = (id, group, header) => {
        const isOpen = open.has(id);
        return h(
          'div',
          { key: id, className: `ch-catalog ${isOpen ? 'ch-catalog-open' : ''}` },
          h(
            'div',
            { className: 'ch-catalog-head' },
            h(
              'button',
              {
                type: 'button',
                className: 'ch-catalog-toggle',
                'aria-expanded': isOpen ? 'true' : 'false',
                onClick: () => toggle(id),
              },
              h('span', { className: 'ch-catalog-caret' }, isOpen ? '▾' : '▸'),
              h('span', { className: 'ch-row-title' }, group.name),
            ),
            h('span', { className: 'ch-muted' }, summaryOf(group)),
            header,
          ),
          isOpen ? body(group, id) : null,
        );
      };

      return h(
        'div',
        { className: 'ch-stack' },
        h(
          'div',
          { className: 'ch-toolbar' },
          h(Button, { size: 'sm', variant: 'primary', onClick: onCreate, disabled: busy }, t('catalogNew')),
          h(
            'div',
            { className: 'ch-toolbar-spacer' },
            h(
              'span',
              { className: 'ch-muted' },
              `${catalogs.length} ${t('catalogItemCount')} · ${t('catalogUnfiled')}: ${unfiledTotal}`,
            ),
            catalogs.length > 0
              ? h(
                  Button,
                  {
                    size: 'sm',
                    variant: 'ghost',
                    onClick: () => {
                      const allExpanded = open.size >= catalogs.length;
                      const next = new Set();
                      expandedCatalogs.clear();
                      if (!allExpanded) {
                        for (const catalog of catalogs) {
                          next.add(catalog.id);
                          expandedCatalogs.add(catalog.id);
                        }
                      }
                      setOpen(next);
                    },
                  },
                  open.size >= catalogs.length ? t('catalogCollapseAll') : t('catalogExpandAll'),
                )
              : null,
          ),
        ),
        catalogs.length === 0 ? h(Empty, null, t('catalogNoItems')) : null,
        catalogs.map((catalog) =>
          section(
            catalog.id,
            catalog,
            h(
              'div',
              { className: 'ch-row-actions' },
              h(
                Button,
                { size: 'sm', disabled: busy !== null, onClick: () => onBulk(catalog, true) },
                t('catalogSelectAll'),
              ),
              h(
                Button,
                { size: 'sm', disabled: busy !== null, onClick: () => onBulk(catalog, false) },
                t('catalogSelectNone'),
              ),
              h(Button, { size: 'sm', variant: 'ghost', onClick: () => onEdit(catalog) }, t('edit')),
              h(
                Button,
                { size: 'sm', variant: 'danger-ghost', onClick: () => onDelete(catalog) },
                t('delete'),
              ),
            ),
          ),
        ),
        unfiledTotal > 0
          ? section(
              '__unfiled__',
              { ...unfiled, name: t('catalogUnfiled') },
              null,
            )
          : null,
      );
    }

    function SessionPanel({ t, sessionId, onClose }) {
      const { data, loading, error, reload } = useAsync(() => call('getSession', { sessionId }), [sessionId]);
      const [tab, setTab] = useState('session');
      const [busy, setBusy] = useState(null);
      const [toast, setToast] = useState(null);
      const [catalogModal, setCatalogModal] = useState(null);

      const apply = async (patch, key) => {
        setBusy(key);
        try {
          const next = await call('saveSession', { sessionId, ...patch });
          await reload();
          setToast(t('changesSaved'));
          window.setTimeout(() => setToast(null), 1600);
          return next;
        } catch (saveError) {
          notifyError(t, saveError);
        } finally {
          setBusy(null);
        }
      };

      const toggleMcp = (server) => {
        const next = server.exposed
          ? data.state.mcp.filter((id) => id !== server.id)
          : [...data.state.mcp, server.id];
        apply({ mcp: next }, `mcp:${server.id}`);
      };

      const setSkillState = (skill, state) => {
        apply({ skills: { [skill.name]: state } }, `skill:${skill.name}`);
      };

      /**
       * Turn one capability plugin on or off for this Session.
       *
       * A `session-start` provider cannot actually change mid-session: the
       * selection is stored (so the next Session follows it) and the panel says
       * so, instead of pretending it took effect.
       */
      const toggleProvider = (row) => {
        const current = (data?.state?.plugins?.desired ?? []).map((item) => item.providerId);
        const next = row.desired
          ? current.filter((id) => id !== row.providerId)
          : [...current, row.providerId];
        apply(
          { plugins: { desired: next.map((providerId) => ({ providerId, enabled: true })) } },
          `provider:${row.providerId}`,
        );
      };

      const remountProviders = async () => {
        setBusy('provider-remount');
        try {
          await call('remountProviders', { sessionId });
          await reload();
          setToast(t('applied'));
        } catch (remountError) {
          notifyError(t, remountError);
        } finally {
          setBusy(null);
        }
      };

      // ── Capability directories ──────────────────────────────────────────
      const deleteCatalog = async (catalog) => {
        const confirmed = await askConfirm(t('catalogEdit'), catalog.name, {
          danger: true,
          confirmLabel: t('delete'),
          detail: t('catalogDeleteHint'),
        });
        if (!confirmed) return;
        try {
          await call('deleteCatalog', { id: catalog.id });
          await reload();
          setToast(t('applied'));
        } catch (deleteError) {
          notifyError(t, deleteError);
        }
      };

      /** Turn every member of one directory on or off for this Session. */
      const bulkCatalog = async (catalog, enabled) => {
        const mcp = new Set(data.state.mcp);
        const skills = { ...(data.state.skills ?? {}) };
        const providers = new Set((data.state.plugins?.desired ?? []).map((item) => item.providerId));
        for (const item of catalogRows(catalog)) {
          if (item.present === false) continue;
          if (item.kind === 'mcp') {
            if (enabled) mcp.add(item.id);
            else mcp.delete(item.id);
          } else if (item.kind === 'skill') {
            skills[item.name] = enabled ? 'auto' : 'off';
          } else if (enabled) providers.add(item.id);
          else providers.delete(item.id);
        }
        await apply(
          {
            mcp: [...mcp],
            skills,
            plugins: {
              desired: [...providers].map((providerId) => ({ providerId, enabled: true })),
            },
          },
          `catalog:${catalog.id}`,
        );
      };

      const selectPreset = async (value) => {
        const presetId = value === '__default__' ? null : value;
        const confirmed = await askConfirm(t('presetSelect'), t('applyPresetConfirm'), {
          detail: t('overwriteHint'),
        });
        if (!confirmed) return;
        await apply({ presetId }, 'preset-select');
      };

      /** Write the Session's current selection back into the preset it follows. */
      const updatePreset = async () => {
        const confirmed = await askConfirm(
          t('updatePreset'),
          presetLabel(data.preset, t),
          { detail: t('updatePresetConfirm') },
        );
        if (!confirmed) return;
        setBusy('preset');
        try {
          await call('savePreset', {
            mode: 'update',
            preset: {
              id: data.preset.id,
              name: data.preset.name,
              mcp: data.state.mcp,
              skills: Object.fromEntries((data.skills ?? []).map((skill) => [skill.name, skill.state])),
              plugins: data.state.plugins,
            },
          });
          await reload();
          setToast(t('presetSaved'));
        } catch (saveError) {
          notifyError(t, saveError);
        } finally {
          setBusy(null);
        }
      };

      const saveAsPreset = async () => {
        const name = await askText(
          t('savePresetPrompt'),
          null,
          `${t('preset')} ${new Date().toLocaleDateString()}`,
        );
        if (!name) return;
        setBusy('preset');
        try {
          const value = await call('savePreset', {
            mode: 'create',
            preset: {
              name,
              base: data.preset?.id ?? null,
              mcp: data.state.mcp,
              skills: Object.fromEntries((data.skills ?? []).map((skill) => [skill.name, skill.state])),
              plugins: data.state.plugins,
            },
          });
          // Follow the preset we just captured, so the Session keeps a nameable
          // provenance instead of drifting as an anonymous copy.
          await call('saveSession', { sessionId, presetId: value.preset.id });
          await reload();
          setToast(t('presetSaved'));
        } catch (saveError) {
          notifyError(t, saveError);
        } finally {
          setBusy(null);
        }
      };

      const setWorkspaceDefault = async () => {
        setBusy('workspace');
        try {
          await call('setWorkspaceDefault', { cwd: data.cwd, presetId: data.preset.id });
          await reload();
          setToast(t('workspaceDefaultSaved'));
        } catch (saveError) {
          notifyError(t, saveError);
        } finally {
          setBusy(null);
        }
      };

      /**
       * Pull in what the default preset has and this Session does not. This is
       * a manual tweak, so it deliberately leaves the Session dirty.
       */
      const syncFromDefault = async () => {
        const mcp = new Set(data.state.mcp);
        for (const id of data.preset?.drift?.mcp ?? []) mcp.add(id);
        const skills = { ...data.state.skills };
        for (const name of data.preset?.drift?.skills ?? []) skills[name] = 'auto';
        const providers = new Set((data.state.plugins?.desired ?? []).map((item) => item.providerId));
        for (const providerId of data.preset?.drift?.plugins ?? []) providers.add(providerId);
        await apply(
          {
            mcp: [...mcp],
            skills,
            plugins: {
              desired: [...providers].map((providerId) => ({ providerId, enabled: true })),
            },
          },
          'sync',
        );
      };

      if (loading && !data) {
        return h(
          Modal,
          { title: t('sessionTitle'), subtitle: t('sessionSubtitle'), onClose, t },
          h('div', { className: 'ch-loading' }, h(Spinner), t('loading')),
        );
      }
      if (error && !data) {
        return h(
          Modal,
          { title: t('sessionTitle'), subtitle: t('sessionSubtitle'), onClose, t },
          h(ErrorBox, { error, onRetry: reload, t }),
        );
      }

      const exposedMcp = data?.mcp?.filter((server) => server.exposed) ?? [];
      const modelSkills = data?.skills?.filter((skill) => skill.invocation.modelInvocable) ?? [];
      const presets = data?.presets ?? [];
      const presetInfo = data?.preset ?? null;
      const presetSkillMap = new Map((presetInfo?.skills ?? []).map((item) => [item.name, item]));
      const driftCount =
        (presetInfo?.drift?.mcp?.length ?? 0) +
        (presetInfo?.drift?.skills?.length ?? 0) +
        (presetInfo?.drift?.plugins?.length ?? 0);
      const missingCount =
        (presetInfo?.missing?.mcp?.length ?? 0) +
        (presetInfo?.missing?.skills?.length ?? 0) +
        (presetInfo?.missing?.providers?.length ?? 0);
      const workspaceDefaultPreset = presets.find((preset) => preset.id === presetInfo?.workspaceDefaultId);
      const presetValue = presetInfo?.followDefault
        ? '__default__'
        : data?.state?.presetId ?? '__default__';

      return h(
        Modal,
        {
          title: t('sessionTitle'),
          subtitle: t('sessionSubtitle'),
          onClose,
          t,
          wide: true,
          footer: h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'ch-footer-left' },
              h('span', { className: 'ch-muted' }, `${exposedMcp.length} MCP · ${modelSkills.length} Skills · ~${formatTokens(data?.estimates?.total)} ${t('tokens')}`),
            ),
            // Session-level actions only. Writing a preset is a different act
            // with a different owner, so it lives in the preset bar below.
            h(Button, { size: 'sm', onClick: reload, disabled: busy !== null }, t('refresh')),
            h(Button, { size: 'sm', variant: 'primary', onClick: onClose }, t('close')),
          ),
        },
        h(
          'div',
          { className: 'ch-session-head' },
          h(
            'label',
            { className: 'ch-inline-field' },
            h('span', { className: 'ch-field-label' }, t('presetSelect')),
            h(
              'select',
              {
                className: 'ch-input ch-input-sm',
                value: presetValue,
                disabled: busy !== null,
                onChange: (event) => selectPreset(event.target.value),
              },
              h(
                'option',
                { value: '__default__' },
                `${t('followDefault')} · ${
                  workspaceDefaultPreset?.isDefault
                    ? t('defaultPreset')
                    : workspaceDefaultPreset?.name ?? t('defaultPreset')
                }`,
              ),
              presets
                .filter((preset) => !preset.isDefault)
                .map((preset) => h('option', { key: preset.id, value: preset.id }, preset.name)),
              h('option', { value: 'default' }, t('defaultPreset')),
            ),
          ),
          h(
            'span',
            { className: `ch-live ${data?.live ? 'ch-live-on' : ''}` },
            data?.live ? t('live') : t('notLive'),
          ),
        ),
        presetInfo
          ? h(
              'div',
              { className: 'ch-provenance' },
              h('span', { className: 'ch-muted' }, `${t('appliedFrom')} ·`),
              h(Badge, { tone: 'info' }, presetLabel(presetInfo, t)),
              presetInfo.followDefault ? h(Badge, null, t('followDefault')) : null,
              presetInfo.dirty ? h(Badge, { tone: 'warn' }, t('dirtyLabel')) : null,
              missingCount > 0
                ? h(Badge, { tone: 'warn' }, `${t('missingTitle')}: ${missingCount}`)
                : null,
            )
          : null,
        // Preset actions live in their own bar, above the tabs: they change the
        // preset, not this Session, and mixing them into the footer made the
        // two feel like one entangled operation.
        h(
          'div',
          { className: 'ch-preset-bar' },
          h(
            'div',
            { className: 'ch-preset-bar-main' },
            h('span', { className: 'ch-field-label' }, t('presetActions')),
            h('div', { className: 'ch-row-meta' }, t('presetActionsHint')),
          ),
          h(
            'div',
            { className: 'ch-preset-bar-actions' },
            h(Button, { size: 'sm', onClick: saveAsPreset, disabled: busy !== null }, t('saveAsPreset')),
            presetInfo && !presetInfo.followDefault
              ? h(Button, { size: 'sm', onClick: updatePreset, disabled: busy !== null }, t('updatePreset'))
              : null,
            presetInfo && !presetInfo.followDefault
              ? h(
                  Button,
                  { size: 'sm', variant: 'ghost', onClick: setWorkspaceDefault, disabled: busy !== null },
                  t('workspaceDefault'),
                )
              : null,
          ),
        ),
        h(Tabs, {
          value: tab,
          onChange: setTab,
          items: [
            { id: 'session', label: t('session') },
            { id: 'catalogs', label: t('catalogsTab'), count: data?.catalogs?.length ?? 0 },
            { id: 'model', label: t('modelView') },
          ],
        }),
        h(
          'div',
          { className: 'ch-session-body' },
          tab === 'session'
            ? h(
                'div',
                { className: 'ch-stack' },
                driftCount > 0
                  ? h(
                      'div',
                      { className: 'ch-drift' },
                      h(
                        'div',
                        { className: 'ch-drift-main' },
                        h('div', { className: 'ch-drift-title' }, `${t('driftTitle')} ${driftCount}`),
                        h('div', { className: 'ch-note' }, t('driftHint')),
                        h(
                          'div',
                          { className: 'ch-row-meta ch-mono' },
                          [...(presetInfo?.drift?.mcp ?? []), ...(presetInfo?.drift?.skills ?? []), ...(presetInfo?.drift?.plugins ?? [])].join(', '),
                        ),
                      ),
                      h(
                        Button,
                        { size: 'sm', variant: 'ghost', disabled: busy !== null, onClick: syncFromDefault },
                        t('syncFromDefault'),
                      ),
                    )
                  : null,
                missingCount > 0
                  ? h(
                      'div',
                      { className: 'ch-note' },
                      `${t('missingTitle')}: ${(presetInfo?.missing?.mcp ?? []).length} ${t('missingMcp')} · ${(presetInfo?.missing?.skills ?? []).length} ${t('missingSkill')} · ${(presetInfo?.missing?.providers ?? []).length} ${t('pluginsTab')}`,
                    )
                  : null,
                h(
                  'section',
                  { className: 'ch-section' },
                  h(
                    'div',
                    { className: 'ch-section-head' },
                    h('div', { className: 'ch-section-title' }, t('mcp')),
                    h('span', { className: 'ch-muted' }, `${exposedMcp.length}/${data?.mcp?.length ?? 0}`),
                  ),
                  data?.mcp?.length
                    ? data.mcp.map((server) =>
                        h(
                          'div',
                          { key: server.id, className: 'ch-toggle-row' },
                          h(
                            'div',
                            { className: 'ch-toggle-main' },
                            h(
                              'div',
                              { className: 'ch-row-title-line' },
                              h('span', { className: 'ch-row-title' }, server.name),
                              h(Badge, { tone: statusTone(server.status) }, statusLabel(server.status, t)),
                              server.enabled === false ? h(Badge, null, t('disabled')) : null,
                              server.exposed ? h(Badge, { tone: 'info' }, `${server.tools} ${t('toolCount')}`) : null,
                            ),
                            h(
                              'div',
                              { className: 'ch-row-meta ch-mono' },
                              server.transport === 'stdio'
                                ? [server.command, ...server.args].filter(Boolean).join(' ')
                                : server.url,
                            ),
                            server.error ? h('div', { className: 'ch-row-error' }, server.error) : null,
                          ),
                          h(
                            'div',
                            { className: 'ch-toggle-actions' },
                            server.status === 'failed'
                              ? h(
                                  Button,
                                  {
                                    size: 'sm',
                                    variant: 'ghost',
                                    disabled: busy !== null,
                                    onClick: async () => {
                                      setBusy(`retry:${server.id}`);
                                      try {
                                        await call('retryMcp', { sessionId, id: server.id });
                                        await reload();
                                      } catch (retryError) {
                                        notifyError(t, retryError);
                                      } finally {
                                        setBusy(null);
                                      }
                                    },
                                  },
                                  t('retry'),
                                )
                              : null,
                            h(Switch, {
                              checked: server.exposed,
                              disabled: busy !== null || server.enabled === false,
                              label: server.name,
                              onChange: () => toggleMcp(server),
                            }),
                          ),
                        ),
                      )
                    : h(Empty, null, t('emptyMcp')),
                ),
                h(
                  'section',
                  { className: 'ch-section' },
                  h(
                    'div',
                    { className: 'ch-section-head' },
                    h('div', { className: 'ch-section-title' }, t('pluginsTab')),
                    h(
                      'span',
                      { className: 'ch-muted' },
                      `${(data?.providers ?? []).filter((row) => row.status === 'mounted').length}/${(data?.providers ?? []).length}`,
                    ),
                    data?.live
                      ? h(
                          Button,
                          { size: 'sm', variant: 'ghost', disabled: busy !== null, onClick: remountProviders },
                          t('pluginRemount'),
                        )
                      : null,
                  ),
                  (data?.providers ?? []).length
                    ? data.providers.map((row) =>
                        h(
                          'div',
                          { key: row.providerId, className: 'ch-toggle-row' },
                          h(
                            'div',
                            { className: 'ch-toggle-main' },
                            h(
                              'div',
                              { className: 'ch-row-title-line' },
                              h('span', { className: 'ch-row-title' }, row.name),
                              h(Badge, { tone: pluginStatusTone(row.status) }, pluginStatusLabel(row.status, t)),
                              h(Badge, null, mountAtLabel(row.mountAt, t)),
                              row.desired ? null : h(Badge, null, t('pluginFromPreset')),
                              row.contributions?.tools?.length
                                ? h(
                                    'span',
                                    { className: 'ch-muted ch-mono' },
                                    `${row.contributions.tools.length} ${t('toolCount')}`,
                                  )
                                : null,
                              row.contributions?.sections?.length
                                ? h(
                                    'span',
                                    { className: 'ch-muted ch-mono' },
                                    row.contributions.sections.join(', '),
                                  )
                                : null,
                            ),
                            h(
                              'div',
                              { className: 'ch-row-meta ch-mono' },
                              `${row.entryId} · ${row.packageName}`,
                            ),
                            row.error ? h('div', { className: 'ch-row-error' }, row.error) : null,
                            // A plugin that owns a process-wide resource cannot be
                            // per-Session; say what to do about it.
                            row.issue?.kind === 'global-resource'
                              ? h('div', { className: 'ch-row-meta' }, t('pluginGlobalResourceHint'))
                              : null,
                            row.status === 'mounted' &&
                            (row.contributions?.tools?.length ?? 0) === 0 &&
                            (row.contributions?.sections?.length ?? 0) === 0
                              ? h('div', { className: 'ch-row-meta' }, t('pluginNoContributions'))
                              : null,
                            row.mountAt === 'session-start' && data?.live
                              ? h('div', { className: 'ch-row-meta' }, t('pluginMountStartHint'))
                              : null,
                          ),
                          h(
                            'div',
                            { className: 'ch-toggle-actions' },
                            h(Switch, {
                              checked: row.desired,
                              disabled: busy !== null || row.enabled === false,
                              label: row.name,
                              onChange: () => toggleProvider(row),
                            }),
                          ),
                        ),
                      )
                    : h(Empty, null, t('pluginNoCandidates')),
                  (data?.missingProviders ?? []).length > 0
                    ? h(
                        'div',
                        { className: 'ch-note' },
                        `${t('pluginMissing')}: ${data.missingProviders
                          .map((item) => item.providerId)
                          .join(', ')}`,
                      )
                    : null,
                ),
                h(
                  'section',
                  { className: 'ch-section' },
                  h(
                    'div',
                    { className: 'ch-section-head' },
                    h('div', { className: 'ch-section-title' }, t('skills')),
                    h('span', { className: 'ch-muted' }, `${modelSkills.length}/${data?.skills?.length ?? 0}`),
                  ),
                  data?.skillsPolicy && data.skillsPolicy.ok === false
                    ? h(
                        'div',
                        { className: 'ch-note ch-note-warn' },
                        `${t('policyLeak')} · ${
                          (data.skillsPolicy.leaked ?? []).join(', ') || data.skillsPolicy.reason || ''
                        }`,
                      )
                    : null,
                  data?.skills?.length
                    ? data.skills.map((skill) =>
                        h(
                          'div',
                          { key: skill.name, className: 'ch-toggle-row' },
                          h(
                            'div',
                            { className: 'ch-toggle-main' },
                            h(
                              'div',
                              { className: 'ch-row-title-line' },
                              h('span', { className: 'ch-row-title' }, skill.name),
                              h(Badge, { tone: skill.state === 'auto' ? 'success' : skill.state === 'manual' ? 'warn' : 'neutral' }, stateLabel(skill.state, t)),
                              presetSkillMap.get(skill.name)?.included === false
                                ? h(Badge, null, t('notInPreset'))
                                : null,
                              h('span', { className: 'ch-muted ch-mono' }, `~${formatTokens(skill.tokens)} ${t('tokens')}`),
                            ),
                            h('div', { className: 'ch-row-description' }, skill.description),
                            h('div', { className: 'ch-row-meta' }, sourceLabel(skill.source, t)),
                          ),
                          h(Segmented, {
                            value: skill.state,
                            disabled: busy !== null,
                            onChange: (value) => setSkillState(skill, value),
                            options: [
                              { value: 'auto', label: t('stateAuto') },
                              { value: 'manual', label: t('stateManual') },
                              { value: 'off', label: t('stateOff') },
                            ],
                          }),
                        ),
                      )
                    : h(Empty, null, t('emptySkills')),
                ),
              )
            : tab === 'catalogs'
              ? h(SessionCatalogSections, {
                  t,
                  data,
                  busy,
                  onToggleMcp: toggleMcp,
                  onSkillState: setSkillState,
                  onToggleProvider: toggleProvider,
                  onBulk: bulkCatalog,
                  onCreate: () => setCatalogModal({ initial: null }),
                  onEdit: (catalog) => setCatalogModal({ initial: catalog }),
                  onDelete: deleteCatalog,
                })
              : h(ModelView, { view: data, t }),
        ),
        toast ? h('div', { className: 'ch-toast' }, toast) : null,
        catalogModal
          ? h(CatalogEditor, {
              t,
              initial: catalogModal.initial,
              library: {
                mcp: data?.mcpDefinitions ?? data?.mcp ?? [],
                skills: data?.skills ?? [],
                providers: data?.providers ?? [],
              },
              onClose: () => setCatalogModal(null),
              onSaved: async () => {
                setCatalogModal(null);
                await reload();
                setToast(t('applied'));
              },
            })
          : null,
      );
    }

    /**
     * The always-mounted host: the Session panel plus the dialog layer.
     *
     * The dialog layer lives here, after the panel in DOM order, so a
     * confirmation always paints above the panel that asked for it. It is also
     * why destructive actions no longer depend on native dialogs, which the
     * desktop shell can suppress.
     */
    function PanelHost({ t }) {
      const store = usePanel();
      return h(
        React.Fragment,
        null,
        store.sessionId
          ? h(SessionPanel, {
              t,
              sessionId: store.sessionId,
              onClose: () => store.close(),
            })
          : null,
        h(DialogHost, { t }),
      );
    }

    function CapabilityChip({ t, sessionId }) {
      const { data, error, reload } = useAsync(() => call('getSession', { sessionId }), [sessionId]);
      const store = usePanel();
      useEffect(() => {
        if (!store.sessionId) reload();
      }, [store.sessionId, reload]);
      const mcpCount = data?.mcp?.filter((server) => server.exposed).length ?? 0;
      const skillCount = data?.skills?.filter((skill) => skill.invocation.modelInvocable).length ?? 0;
      return h(
        'button',
        {
          type: 'button',
          className: `ch-chip${error ? ' ch-chip-error' : ''}`,
          title: error ? String(error.message ?? error) : t('sessionTitle'),
          onClick: () => store.open(sessionId),
        },
        h('span', { className: 'ch-chip-icon' }, '◈'),
        h('span', null, t('chip')),
        h('span', { className: 'ch-chip-count' }, error ? '!' : `${mcpCount}·${skillCount}`),
      );
    }

    function HeaderAction({ t, sessionId }) {
      const store = usePanel();
      return h(
        'button',
        {
          type: 'button',
          className: 'ch-header-action',
          title: t('sessionTitle'),
          onClick: () => store.open(sessionId),
        },
        h('span', { className: 'ch-chip-icon' }, '◈'),
        h('span', null, t('chip')),
      );
    }

    function Icon() {
      return h(
        'svg',
        { viewBox: '0 0 20 20', width: 16, height: 16, 'aria-hidden': true, fill: 'none' },
        h('rect', { x: 3, y: 4, width: 14, height: 4.5, rx: 2.25, fill: 'currentColor' }),
        h('rect', { x: 3, y: 10, width: 14, height: 4.5, rx: 2.25, fill: 'currentColor', opacity: 0.65 }),
        h('rect', { x: 3, y: 16, width: 8, height: 2, rx: 1, fill: 'currentColor', opacity: 0.4 }),
      );
    }

    const css = `
      .ch-page { display: flex; flex-direction: column; gap: 16px; padding: 2px 0 28px; color: var(--dsw-alias-label-primary); }
      .ch-page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
      .ch-page-title { font-size: 15px; line-height: 22px; font-weight: 600; }
      .ch-page-subtitle { margin-top: 4px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; max-width: 640px; }
      .ch-page-actions { display: flex; gap: 8px; flex: none; }
      .ch-stat-line { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .ch-dot-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--dsw-alias-label-secondary); opacity: .5; }
      .ch-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--dsw-alias-border-l1); overflow-x: auto; }
      .ch-tab { flex: none; }
      .ch-tab { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 28px; padding: 0 10px; border-bottom: 2px solid transparent; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
      .ch-tab:hover { color: var(--dsw-alias-label-primary); }
      .ch-tab-active { color: var(--dsw-alias-label-primary); border-bottom-color: var(--dsw-alias-brand-primary); }
      .ch-tab-count { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 18px; text-align: center; }
      .ch-tab-body, .ch-tab-body > * { min-height: 0; }
      .ch-stack { display: flex; flex-direction: column; gap: 10px; }
      .ch-row { display: flex; align-items: flex-start; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .ch-row:last-child { border-bottom: 0; }
      .ch-row-main { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 4px; }
      .ch-row-title-line { display: flex; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap; }
      .ch-row-title { font-size: 13px; line-height: 20px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ch-row-description { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
      .ch-row-meta { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ch-row-error { color: var(--dsw-alias-state-error-primary); font-size: 11px; line-height: 16px; }
      .ch-row-actions { display: flex; gap: 4px; flex: none; }
      .ch-badge { display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border-radius: 9px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 18px; white-space: nowrap; }
      .ch-badge-success { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent); color: var(--dsw-alias-state-success-primary); }
      .ch-badge-warn { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 14%, transparent); color: var(--dsw-alias-state-warn-primary); }
      .ch-badge-error { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent); color: var(--dsw-alias-state-error-primary); }
      .ch-badge-info { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); color: var(--dsw-alias-brand-primary); }
      .ch-btn { appearance: none; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); border-radius: 6px; font: inherit; font-size: 12px; line-height: 18px; padding: 4px 10px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; }
      .ch-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
      .ch-btn:disabled { opacity: .45; cursor: default; }
      .ch-btn-primary { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); color: #fff; }
      .ch-btn-primary:hover:not(:disabled) { filter: brightness(1.06); background: var(--dsw-alias-brand-primary); }
      .ch-btn-ghost { border-color: transparent; background: transparent; color: var(--dsw-alias-label-secondary); }
      .ch-btn-ghost:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .ch-btn-danger-ghost { border-color: transparent; background: transparent; color: var(--dsw-alias-state-error-primary); }
      .ch-btn-danger-ghost:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); }
      .ch-btn-sm { padding: 2px 8px; font-size: 11px; line-height: 16px; }
      .ch-input { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 18px; padding: 5px 8px; outline: none; }
      .ch-input:focus { border-color: var(--dsw-alias-brand-primary); }
      .ch-input-sm { width: auto; min-width: 150px; padding: 3px 8px; }
      .ch-textarea { resize: vertical; min-height: 60px; }
      .ch-textarea-lg { min-height: 180px; }
      .ch-form { display: flex; flex-direction: column; gap: 12px; }
      .ch-field { display: flex; flex-direction: column; gap: 4px; }
      .ch-field-label { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 16px; }
      .ch-field-hint { color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 15px; opacity: .8; }
      .ch-inline-field { display: flex; align-items: center; gap: 8px; }
      .ch-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .ch-muted { color: var(--dsw-alias-label-secondary); }
      .ch-empty { padding: 24px 12px; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; border: 1px dashed var(--dsw-alias-border-l1); border-radius: 8px; }
      .ch-loading { display: flex; align-items: center; gap: 8px; padding: 32px 0; color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .ch-spinner { width: 13px; height: 13px; border-radius: 50%; border: 2px solid var(--dsw-alias-border-l2); border-top-color: var(--dsw-alias-brand-primary); display: inline-block; animation: ch-spin .8s linear infinite; }
      @keyframes ch-spin { to { transform: rotate(360deg); } }
      .ch-errorbox { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); border-radius: 6px; padding: 8px 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .ch-error-text { color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 18px; }
      .ch-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; padding: 24px; }
      .ch-modal { width: min(720px, 100%); max-height: min(82vh, 760px); display: flex; flex-direction: column; background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; box-shadow: 0 24px 64px rgba(0,0,0,.28); overflow: hidden; }
      .ch-modal-wide { width: min(920px, 100%); }
      .ch-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 16px 18px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .ch-modal-heading { min-width: 0; }
      .ch-modal-title { font-size: 14px; line-height: 20px; font-weight: 600; }
      .ch-modal-subtitle { margin-top: 3px; color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; }
      .ch-icon-btn { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); width: 24px; height: 24px; border-radius: 6px; font-size: 18px; line-height: 24px; cursor: pointer; flex: none; }
      .ch-icon-btn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .ch-modal-body { padding: 16px 18px; overflow: auto; min-height: 0; }
      .ch-modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 18px; border-top: 1px solid var(--dsw-alias-border-l1); flex-wrap: wrap; }
      .ch-footer-left { margin-right: auto; display: flex; align-items: center; gap: 8px; font-size: 11px; }
      .ch-section { border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 0 12px; }
      /* A directory is a tree node: collapsible header, kinds separated inside. */
      .ch-catalog { border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); }
      .ch-catalog-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 8px 10px; }
      .ch-catalog-toggle { display: inline-flex; align-items: center; gap: 6px; border: 0; background: none; padding: 0; cursor: pointer; color: inherit; font: inherit; text-align: left; }
      .ch-catalog-caret { display: inline-block; width: 10px; color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 1; }
      .ch-catalog-head .ch-row-actions { margin-left: auto; display: flex; gap: 6px; flex-wrap: wrap; align-self: center; }
      .ch-catalog-body { border-top: 1px solid var(--dsw-alias-border-l1); padding: 2px 10px 8px; }
      .ch-catalog-group { padding-top: 8px; }
      .ch-catalog-group + .ch-catalog-group { margin-top: 6px; border-top: 1px dashed var(--dsw-alias-border-l1); }
      .ch-catalog-group-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; font-size: 11px; line-height: 16px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
      .ch-catalog-group-count { font-weight: 400; }
      .ch-toolbar-spacer { margin-left: auto; display: flex; align-items: center; gap: 8px; }
      .ch-section-head { display: flex; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .ch-section-title { font-size: 12px; line-height: 18px; font-weight: 600; }
      .ch-section-head .ch-muted { font-size: 11px; }
      .ch-toggle-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .ch-toggle-row:last-child { border-bottom: 0; }
      .ch-toggle-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
      .ch-toggle-actions { display: flex; align-items: center; gap: 6px; flex: none; }
      .ch-switch { width: 34px; height: 20px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); padding: 1px; cursor: pointer; position: relative; transition: background .15s ease, border-color .15s ease; }
      .ch-switch-knob { display: block; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-label-secondary); transition: transform .15s ease, background .15s ease; }
      .ch-switch-on { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
      .ch-switch-on .ch-switch-knob { transform: translateX(14px); background: #fff; }
      .ch-switch:disabled { opacity: .45; cursor: default; }
      .ch-segmented { display: inline-flex; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; padding: 1px; background: var(--dsw-alias-bg-base); flex: none; }
      .ch-segment { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 10px; line-height: 16px; padding: 1px 7px; border-radius: 4px; cursor: pointer; }
      .ch-segment-active { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .ch-segment:disabled { opacity: .45; cursor: default; }
      .ch-chip { appearance: none; border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-secondary); border-radius: 6px; font: inherit; font-size: 11px; line-height: 20px; padding: 1px 7px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; }
      .ch-chip:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .ch-chip-error { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 50%, var(--dsw-alias-border-l1)); color: var(--dsw-alias-state-error-primary); }
      .ch-chip-icon { font-size: 11px; color: var(--dsw-alias-brand-primary); }
      .ch-chip-count { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; opacity: .8; }
      .ch-header-action { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11px; line-height: 22px; padding: 0 6px; border-radius: 5px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; }
      .ch-header-action:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .ch-live { font-size: 10px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
      .ch-live-on { color: var(--dsw-alias-state-success-primary); }
      .ch-session-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
      .ch-provenance { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: -2px 0 10px; font-size: 11px; line-height: 16px; }
      .ch-preset-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 0 0 10px; padding: 8px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-l1); }
      .ch-preset-bar-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .ch-preset-bar-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .ch-drift { display: flex; align-items: flex-start; gap: 12px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent); border-radius: 8px; padding: 10px 12px; }
      .ch-drift-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
      .ch-drift-title { font-size: 12px; line-height: 18px; font-weight: 600; }
      .ch-session-body { margin-top: 12px; }
      .ch-note { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; }
      .ch-note-warn { color: var(--dsw-alias-state-warning-primary); }
      .ch-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .ch-check-line { display: inline-flex; align-items: center; gap: 6px; color: var(--dsw-alias-label-secondary); font-size: 11px; }
      .ch-result { border-radius: 6px; padding: 8px 10px; font-size: 11px; line-height: 17px; }
      .ch-result-ok { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent); color: var(--dsw-alias-state-success-primary); }
      .ch-result-warn { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 10%, transparent); color: var(--dsw-alias-state-warn-primary); }
      .ch-import-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); cursor: pointer; }
      .ch-import-row:last-child { border-bottom: 0; }
      .ch-import-row input { margin-top: 2px; }
      .ch-model-view { gap: 12px; }
      .ch-estimate-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .ch-estimate { border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 10px 12px; }
      .ch-estimate-label { color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 15px; text-transform: uppercase; letter-spacing: .04em; }
      .ch-estimate-value { font-size: 18px; line-height: 26px; font-weight: 600; }
      .ch-estimate-hint { color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 15px; }
      .ch-details { border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 8px 12px; }
      .ch-details summary { cursor: pointer; font-size: 12px; line-height: 20px; font-weight: 600; }
      .ch-list { display: flex; flex-direction: column; margin-top: 6px; }
      .ch-list-row { display: flex; align-items: baseline; gap: 10px; padding: 5px 0; border-top: 1px solid var(--dsw-alias-border-l1); min-width: 0; }
      .ch-list-name { font-size: 11px; color: var(--dsw-alias-label-primary); flex: none; }
      .ch-list-desc { font-size: 11px; line-height: 17px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
      .ch-instruction { padding: 6px 0; border-top: 1px solid var(--dsw-alias-border-l1); }
      .ch-pre { margin: 4px 0 0; padding: 8px; border-radius: 6px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 15px; white-space: pre-wrap; word-break: break-word; max-height: 180px; overflow: auto; }
      .ch-toast { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 7px 12px; font-size: 12px; box-shadow: 0 10px 28px rgba(0,0,0,.18); z-index: 1100; }
      @media (max-width: 720px) {
        .ch-page-head { flex-direction: column; }
        .ch-estimate-grid { grid-template-columns: 1fr; }
        .ch-row { flex-direction: column; }
        .ch-row-actions { align-self: flex-end; }
        .ch-toggle-row { flex-wrap: wrap; }
        .ch-toggle-actions { margin-left: auto; }
        .ch-modal { max-height: 92vh; }
      }
    `;

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(
          () =>
            ctx.locale.register(NS, {
              zh,
              en,
            }),
          'capability-hub: locale',
        );

        const t = ctx.locale.bind(NS);
        const Settings = (props) => h(SettingsPage, { ...props, t });
        const Panel = (props) => h(PanelHost, { ...props, t });
        const Chip = (props) => h(CapabilityChip, { ...props, t });
        const Header = (props) => h(HeaderAction, { ...props, t });
        const SettingsIcon = () => h(Icon);

        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            { name: 'shell.overlay', id: 'capability-hub-panel', order: 60 },
            Panel,
          ),
        );
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'capabilities',
              order: 18,
              label: () => t('title'),
            },
            Settings,
          ),
        );
        ctx.slots.inject('settings.section.icon', () =>
          ctx.slots.register(
            { name: 'settings.section.icon', id: 'capabilities', order: 18 },
            SettingsIcon,
          ),
        );
        ctx.slots.inject('conversation.input.left', () =>
          ctx.slots.register(
            { name: 'conversation.input.left', id: 'capability-hub-chip', order: 40 },
            Chip,
          ),
        );
        ctx.slots.inject('conversation.session.header.actions', () =>
          ctx.slots.register(
            { name: 'conversation.session.header.actions', id: 'capability-hub-action', order: 30 },
            Header,
          ),
        );

        ctx.effect(() => {
          const style = document.createElement('style');
          style.dataset.plugin = 'capability-hub';
          style.textContent = css;
          document.head.appendChild(style);
          return () => style.remove();
        }, 'capability-hub: styles');
      },
    };
  },
});
