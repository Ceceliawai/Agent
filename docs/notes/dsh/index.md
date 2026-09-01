---
title: DeepSeek Harness 代码粗读
description: 从 Cordis 插件运行时出发，理解 DeepSeek Harness 如何组织 Agent、工具、上下文与 Session Trace。
date: 2026-09-01
tags:
  - DSH
  - Agent Harness
outline: [2, 3]
---

# DeepSeek Harness 代码粗读

**Everything is a plugin.**

DeepSeek Harness（下文简称 DSH）不是一个只负责“调用模型，再执行工具”的 Agent Demo。它更像一套 Agent 运行底座：模型适配、工具注册、Session Log、Agent Loop、Web UI 与 CLI 都以插件的方式装进同一套运行时。

这组笔记不会逐行翻译源码，而是围绕一个问题展开：**一个可长期运行、可以恢复、也能持续扩展的 Agent Harness，应该怎样组织自己的业务流程？**

## 1. 整体架构

从外部看，用户只是在和 Agent 对话；从内部看，一次任务会穿过四层结构：

```text
产品入口（Web / CLI / SDK）
        ↓
Agent Runtime（Inbox / Turn / Step）
        ↓
能力插件（LLM / Tools / Compaction）
        ↓
事实底座（Session Event Log / Persistence / Query）
```

最上层决定用户怎样提交任务；Agent Runtime 负责推进任务；模型、工具和压缩插件参与具体执行；最下层把执行过程中发生的事实持续记录下来。DSH 的核心价值，不在于其中某一个模块特别复杂，而在于它让这些模块能够独立扩展，又遵守同一套运行契约。

::: tip 一条贯穿全文的原则
凡是会进入模型上下文、影响模型判断的信息，都应当能够从 Session Log 中重新构造。这样，恢复、回放、压缩与审计看到的才是同一段历史。
:::

## 2. 阅读路线

左侧边栏按照系统从“装配”到“运行”，再到“留存”的顺序组织：

1. [Cordis 插件运行时](./cordis)：先理解 DSH 为什么可以把能力做成插件。
2. [Agent 生命周期](./agent-lifecycle)：再看一个 Agent 与 Session 如何创建、组装和销毁。
3. [Agent Loop](./agent-loop)：理解 Inbox、Turn、Step 和模型请求如何推进。
4. [工具调用](./tool-execution)：追踪一次 Tool Call 从模型输出到结果入账的完整链路。
5. [上下文压缩](./compaction)：理解上下文接近上限时，系统如何在不丢失原始事实的前提下继续工作。
6. [Session 与 Trace](./session-trace)：最后看执行事实怎样持久化、恢复、查询和对外观测。

## 3. 粗读进度与后续路线

当前专题已经完成 Agent 主干链路的第一轮粗读，后续会沿着“能力如何接入运行时、边界如何被强制、状态如何持续”继续扩展。这里的进度按能力 seam（能力边界）记录；同一专题下的 package 仍然保持各自职责。

### 已完成

| 能力 | 对应 package | 当前覆盖内容 |
| --- | --- | --- |
| 插件运行时 | `vendor/cordis`、`packages/core`、`packages/extensions/cordis-host-runner` | 插件注册、上下文、作用域与能力装配 |
| Agent 生命周期 | `packages/core/agent`、`packages/core/session` | Agent、Session 的创建、运行与销毁 |
| Agent Loop | `packages/core/agent-loop` | Inbox、Turn、Step 与模型请求推进 |
| 工具调用 | `packages/core/tools`、`packages/client/ui-tool` | 工具注册、调用、结果入账与展示 |
| 上下文压缩 | `packages/compaction`、`packages/context` | 上下文裁剪、压缩触发与历史保留 |
| Session 与 Trace | `packages/core/session`、`packages/session-query` | 事件日志、恢复、查询与执行观测 |

### 重要但尚未详细学习

以下能力都很重要，但目前还没有展开详细阅读。它们按主题分组，便于后续逐步补充；同一组中的能力仍然是独立的 package。

#### 执行环境与安全边界

FS、Sandbox 和 Shell 共同构成 Agent 的代码执行与文件操作链路，但并不是同一个 package：

| 能力 | 对应 package | 计划关注的问题 |
| --- | --- | --- |
| 文件系统 FS | `packages/fs` | 文件目标抽象、读写编辑、版本守卫与观察策略 |
| 进程沙箱 Sandbox | `packages/sandbox` | workspace 边界、隔离模式、强制执行与 fail-closed |
| Shell / Subprocess | `packages/shell`、`packages/subprocess` | 命令执行、后台进程、超时取消与输出归因 |
| 能力组合 | `packages/fs/fs-sandbox`、`packages/shell/bash-sandbox` | FS 写入边界与 Shell 进程边界如何分别接入同一策略 |

#### 任务编排与能力扩展

| 能力 | 对应 package | 计划关注的问题 |
| --- | --- | --- |
| 用户审批与权限 | `packages/interaction/user-approval`、`packages/interaction/permission-presets` | 高风险操作如何请求确认、提权与重试 |
| Skills | `packages/skill` | Skill 发现、作用域合并、缓存失效与按需加载 |
| Goal | `packages/goal` | 目标状态、持久化、暂停阻塞与继续执行 |
| Plan | `packages/plan` | 计划模式、提示词指引、用户批准与退出 |
| Subagent | `packages/subagent` | 委派、父子关系、深度限制、取消与可继续会话 |
| Workflow | `packages/workflow` | 多 Agent 编排、脚本执行与结果汇总 |

## 4. 先建立三个边界

### 4.1 核心流程与扩展策略

Agent Loop 只维护稳定的执行骨架。权限审批、上下文注入、压缩和观测等策略，通过事件挂在骨架的关键节点上。新增行为时，优先选择已有扩展点，而不是不断修改 Loop。

### 4.2 运行状态与权威事实

内存中的 Agent 状态用于高效执行，Session Event Log 才是可恢复的事实来源。进程重启后，Inbox、对话表层和查询视图都可以由日志重建。

### 4.3 模型表层与完整历史

模型每一步看到的上下文只是 Session 历史的一种投影。压缩可以替换模型表层，却不会删除原始事件。这个区分让 DSH 同时获得“上下文可控”和“事实可追溯”两种能力。

::: info 专题目标
读完这组笔记，应当能够从业务视角回答四个问题：Agent 如何被装配并推进任务；工具为何不能被模型直接执行；上下文压缩为什么不会破坏历史；Session Log 与 Telemetry 各自解决什么问题。
:::
