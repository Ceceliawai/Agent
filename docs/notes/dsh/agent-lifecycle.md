---
title: Agent 生命周期
description: 从创建入口开始，理解 Session、Agent Runtime、Agent Scope 的组装和销毁过程。
date: 2026-09-01
tags:
  - DSH
  - Agent
outline: [2, 4]
---

# Agent 生命周期

在学习了 Cordis 框架本身之后，就可以开始看 DSH 里比较重要的包了。这里先从 Agent 是怎么创建出来的开始。

需要先说明一点：创建 Agent 并不等于立刻调用模型。创建阶段主要是在准备 Session、构造运行时、组装 Agent Scope，最后再把这个 Agent 发布出去。

## 1. 创建入口

外部通过 `ctx.agents.create(options)` 创建 Agent。这里的 `ctx.agents` 是公共接口，它不直接实现创建，而是把请求转发给注册的 AgentFactory。

```ts
const handle = await ctx.agents.create({
  sessionId,
  meta,
  seed,
  agentOptions,
  setup,
  signal,
})
```

这里主要做的是接口与实现的分离。外部只依赖 `ctx.agents` 这个能力，不需要知道底层具体由哪个插件负责创建 Agent。

## 2. 准备 Session

::: info 阶段目标
准备 Session 的作用，是为 Agent 建立会话身份和不可变档案，检查 ID 是否冲突，并可选地导入一段用于 fork、回放或恢复的初始历史。系统会验证并冻结这些数据，确保它们可以安全地参与后续运行和持久化，但此时 Session 尚未注册，对其他组件不可见。
:::

### 2.1 分配会话身份

首先需要生成一个 Session ID：

- 调用方传入了，就直接使用；
- 没有传入，就创建一个新的 ID；
- 之后还要检查这个 ID 是否已经存在。

这里的查重只是第一次检查。真正发布 Session 时还会再检查一次，因为准备 Session 和最终发布之间可能经过异步 Setup，这段时间里可能有另一个 Agent 使用了同样的 ID。

### 2.2 记录并校验会话档案

Session 档案可以理解为这次会话的基础信息，比如：

- ID 和创建时间；
- 当前工作目录；
- 持久化数据版本；
- 父 Session；
- 有多少历史从其他 Session 继承；
- 是否为 Subagent，以及当前委派深度；
- 使用哪套工具和提示词配置。

这些档案不是随便保存下来就可以了，还需要进行校验：

- 档案中的 ID 要和 Session ID 一致，并且不能重复；
- `cwd` 必须是绝对路径；
- `createdAt` 等字段必须符合规定的类型和范围；
- 字段之间的关系要合理。

### 2.3 校验 Seed 历史

Seed 历史可以理解为：创建 Session 时预先放进去的一段已有会话历史。

```text
【普通 Agent】
Session 日志：空

【Fork Agent】
父 Session：
用户问题 → 模型回答 → 工具调用 → 模型回答

子 Session：
[继承上述历史] → 开始产生自己的新内容
```

系统会检查：

- 所有事件都必须能完整序列化为 JSON；
- 事件序号必须严格为 0、1、2……，不能重复或断裂；
- 每条事件必须具有合法的事件类型和基本字段；
- 用户消息、模型消息和请求记录必须符合当前格式；
- 消息在会话可见历史中的插入、替换关系必须有效；
- 不能使用当前版本已经废弃的历史格式。

如果这里校验失败，就直接拒绝创建 Session，而不是等到后面请求模型或者持久化时再失败。

### 2.4 复制并冻结历史

即使调用方传入的是一个可修改的 Seed 数组，Session 也不能直接持有它。否则调用方可能在 Agent 创建之后继续修改这个数组，相当于从外部改写 Session 历史。

所以这里的处理顺序是：

```text
验证 Seed
→ 复制 Seed
→ 深度冻结
→ 放入 Session
```

这样 Session 得到的是一份不能被外部篡改的历史快照。

## 3. 构造 Agent Runtime

::: info 阶段目标
构造 Agent Runtime 的作用，是将准备好的 Session 绑定到一个可执行的 Agent 上，并为它建立消息队列、运行状态、私有作用域和事件路由。构造完成后，Agent 已经具备运行所需的基础设施，但尚未注册、尚未处理消息，也没有调用模型。
:::

### 3.1 绑定 Agent 身份和 Session

Agent Runtime 会保存：

- `id`：与 Session 使用同一个 ID；
- `session`：该 Agent 产生的对话和执行事实都写入这里；
- `options`：模型、最大步数等 Agent 运行配置。

它们之间的业务关系可以理解为：

```text
一个 Agent Runtime
        ↓ 独占驱动
一个 Session
        ↓ 记录
该 Agent 的全部运行历史
```

### 3.2 建立消息收件箱 Inbox

Inbox 保存的是“已经提交给 Agent，但还没有被处理”的消息。它包含两类队列：

- `next-turn`：等待开启一个新 Turn 的消息；
- `next-step`：等待在最近一个 Step 边界加入的 Steering 或上下文消息。

构造 Inbox 时，还会从 Session 日志中恢复尚未消费的消息，避免 Agent 恢复之后丢失待处理输入。

这里需要理解一个业务规则：

- Fork 出来的子 Agent 可以继承父 Agent 已经发生的对话历史；
- 但是不能继承父 Agent 还没有处理的 Inbox 消息；
- 因此 Inbox 只恢复当前 Session 自己产生的队列变化，不恢复 Seed 中继承的父历史。

### 3.3 恢复运行进度

Agent 会从 Session 历史中找到最后一个 Turn 编号。这可以保证在 Fork、Replay 或 Resume 之后：

- Turn 编号不会重新从头开始；
- 新事件能够接在已有历史后面；
- 日志中的执行顺序保持连续。

此时 Agent 的状态会初始化为 `idle`。这里的 `idle` 只表示暂时没有正在执行的任务，并不表示 Agent 已经结束。

### 3.4 创建 Agent 私有作用域

每个 Agent 都会获得一个独立的 `agent.ctx`。后面的 Setup 可以在这个 Context 中安装当前 Agent 私有的能力。

业务目的主要有两个：

1. **隔离**：不同 Agent 可以拥有不同的工具、提示词和配置；
2. **统一销毁**：Agent 结束时，可以一次性释放这个作用域中注册的内容。

### 3.5 建立 Agent 事件路由

Agent 会建立自己的事件分发通道，用来发布：

- Inbox 消息加入、领取或丢弃；
- Agent 状态变化；
- Turn 和 Step 生命周期；
- 模型请求前后的扩展事件。

每个事件都带有明确的 Agent Scope，因此：

- 全局插件可以观察所有 Agent；
- Agent 私有插件只能观察所属 Agent；
- 多个并发 Agent 的事件不会混淆。

### 3.6 恢复动态运行上下文

Agent 还会查看 Session 中最近保留的运行上下文，例如：

- 当前工作环境信息；
- 插件动态提供的上下文；
- 已经写入模型历史的上下文快照。

它不是立刻重新生成一遍提示词，而是先记录：上一次已经告诉模型的运行上下文是什么。

以后组装请求时：

- 上下文没有变化，就不重复写入；
- 上下文发生变化，就追加新的快照；
- 旧快照被压缩或替换后，再重新记录当前值。

### 3.7 初始化运行控制状态

新构造的 Agent 初始状态可以理解为：

```text
状态：idle
当前活动：无
当前 Turn：历史中的最后一个 Turn
当前 Step：尚未开始
取消控制器：尚未创建
模型请求：尚未发生
```

只有接收到需要唤醒的消息之后，Agent 才会创建运行控制器并进入 `running`。

## 4. Agent Scope 组装

::: info 核心概念
Agent Scope 是当前 Agent 的插件组合范围。它决定当前 Agent 能看到哪些工具、提示词和配置，哪些监听器可以接收这个 Agent 的事件，以及 Agent 销毁时需要一起卸载哪些注册内容。
:::

### 4.1 组装 Agent 私有能力

创建者可以通过 Setup 给 Agent 安装私有能力：

```ts
setup: async (agentCtx) => {
  await presets.mount(agentCtx, presetId)
  installModelSelection(agentCtx, selection)
}
```

这里可以注册：

- Agent Preset；
- Persona 和 Prompt Section；
- Scoped Tools 和工具限制；
- 模型选择；
- Agent 专属监听器。

### 4.2 能力的分层可见性

Agent 最终能看到的能力，大致来自三个层级：

1. 全局注册的能力；
2. Preset Scope 注册的能力；
3. 当前 Agent Scope 注册的能力。

Agent 可以看到父级 Preset 提供的能力，Preset 中的监听器也可以接收其所属 Agent 的事件。但 Agent A 私有注册的能力，不应该被 Agent B 看到。

### 4.3 Agent 事件隔离

注册 Handler 时，Cordis 会记住它是通过哪个 Context 注册的。通过 `agentA.ctx` 注册的 Handler，会带有“属于 Agent A”的 Scope 标记。

事件发生以后，Cordis 会：

1. 先按事件类型找到对应的 Handler；
2. 再将 Handler 的 Scope 与这次事件绑定的 Agent Scope 进行比较；
3. 属于同一个 Agent，或者属于全局 Scope 的 Handler 才会执行；
4. 其他 Agent 的 Handler 会被过滤掉。

这里比较的是事件分发器携带的 Scope，而不只是事件内容里写了哪个 Agent ID。

### 4.4 生命周期统一管理

Harness 会通过 Cordis 的插件机制，为每个 Agent 创建一个专属 Fiber，并把它作为 Agent Scope 的生命周期容器。

通过 `agent.ctx` 注册的内容，包括：

- Agent 私有插件；
- 事件监听器；
- Effect；
- 私有 Service 和工具能力；

都会归当前 Agent Scope 所有。

一次 Turn 结束并不代表 Agent 生命周期结束。Agent 只是从 `running` 回到 `idle`，Scope 以及其中的能力仍然保留，可以继续处理后续消息。

整个 Agent 生命周期由创建者控制。以下情况会触发销毁：

- 调用 `AgentHandle.dispose()`；
- 创建 Agent 的 Owner Context 被销毁；
- Agent Loop 服务关闭；
- Agent 创建过程中失败，需要回滚。

Agent 销毁时会依次进行：

1. 取消正在运行的 Turn；
2. 等待 Agent 停止当前活动；
3. Dispose Agent Scope；
4. Cordis 卸载 Agent 私有插件；
5. 删除 Agent 私有监听器；
6. 撤销 Agent 私有能力和 Effect；
7. 等待异步清理结束；
8. 从 Agent Registry 中移除 Agent；
9. 从 Session Store 中移除活跃 Session。

这里为什么要先等待 Agent 停下来，再清理 Scope？

因为正在运行的模型请求或工具调用，可能还在使用 Agent Scope 中的能力。如果先卸载工具、监听器和 Service，正在执行的 Turn 就可能访问到已经被释放的资源，Session 中也可能留下没有正常收尾的执行状态。

共享的全局能力和 Preset Scope 不归单个 Agent 所有，因此不会随着某个 Agent 一起销毁。销毁 Agent A，也不会影响 Agent B 正在使用的模型适配器、Session 服务或共享 Preset。

只有 `await AgentHandle.dispose()` 完成，才表示：

- Agent Driver 已经停止；
- Agent 私有 Scope 已经清理；
- Agent 和 Session 已经从活跃注册表移除；
- 整个 Agent 生命周期正式结束。

如果 Setup 失败，因为 Agent 还没有正式发布，系统会直接清理临时 Scope，并保证 Agent 与 Session 都不会进入活跃注册表。这可以避免系统里留下一个只创建了一半的 Agent。

## 5. 发布 Agent 并交付所有权

Setup 成功后，Session 和 Agent 已经完整构造，但此时仍然没有对外可见。发布阶段负责把它们加入注册表、发送生命周期通知，并把后续销毁权交给创建者。

发布顺序是：

1. Session 先进入 Session Store；
2. Agent 再进入 Agent Registry；
3. 发布时再次检查 ID 是否重复；
4. 最后向插件发送创建通知。

这里还区分两个动作：

- **Enter**：把对象放进注册表，让其他组件可以找到它；
- **Announce**：通知其他插件，一个完整的对象已经发布。

发布阶段会产生几类通知：

- `session/created`：一个新的活跃 Session 已经建立；
- `agent/created`：一个组装完整的 Agent 已经可以使用；
- `agent/session-start`：本次 Session 的 Agent 生命周期已经开始，插件可以在这里注入启动上下文。

需要注意，`agent/session-start` 不代表已经调用模型，只表示 Agent 已经可以接收输入。

::: tip 章节小结
整个创建过程可以理解为：先准备一份可信的 Session，再构造 Agent Runtime，然后在独立的 Agent Scope 中组装能力，最后统一发布。销毁时则沿着相反方向，先停止 Driver，再清理 Scope，最后退出活跃注册表。这样 Agent 的创建、运行和销毁都有比较明确的边界。
:::
