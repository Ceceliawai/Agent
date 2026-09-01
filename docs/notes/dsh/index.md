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

## 3. 先建立三个边界

### 3.1 核心流程与扩展策略

Agent Loop 只维护稳定的执行骨架。权限审批、上下文注入、压缩和观测等策略，通过事件挂在骨架的关键节点上。新增行为时，优先选择已有扩展点，而不是不断修改 Loop。

### 3.2 运行状态与权威事实

内存中的 Agent 状态用于高效执行，Session Event Log 才是可恢复的事实来源。进程重启后，Inbox、对话表层和查询视图都可以由日志重建。

### 3.3 模型表层与完整历史

模型每一步看到的上下文只是 Session 历史的一种投影。压缩可以替换模型表层，却不会删除原始事件。这个区分让 DSH 同时获得“上下文可控”和“事实可追溯”两种能力。

::: info 专题目标
读完这组笔记，应当能够从业务视角回答四个问题：Agent 如何被装配并推进任务；工具为何不能被模型直接执行；上下文压缩为什么不会破坏历史；Session Log 与 Telemetry 各自解决什么问题。
:::
