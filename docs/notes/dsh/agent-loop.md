---
title: Agent Loop
description: 从 Inbox、Turn 和 Step 理解 DSH 如何接受输入、请求模型、执行工具并收敛。
date: 2026-09-01
tags:
  - DSH
  - Agent Loop
outline: [2, 4]
---

<script setup>
import { withBase } from 'vitepress'
</script>

# Agent Loop

在前面已经看了 Agent 是怎么创建出来的。创建完成之后，真正负责让 Agent 动起来的，就是 Agent Loop。

它依赖的服务主要有：`agents`、`sessions`、`llm`、`tools`、`systemPrompt`。

Agent Loop 做的事情可以概括为：接受输入、打开 Turn、不断执行 Step，直到这项任务收敛。

## 1. 接受输入

Agent 的 Inbox 里有两类队列：

- `next-turn`：等待开启新 Turn 的消息；
- `next-step`：等待在最近一个 Step 边界加入的 Steering 或上下文消息。

外部提交输入时，主要有三种方式：

- `followup()`：放入 `next-turn`，开启新的 Turn；
- `steer()`：放入 `next-step`，介入最近的 Step；
- `inject()`：放入 `next-step`，但不主动唤醒 Agent。

### 1.1 followup()：提交下一项独立任务

它表达的是：“当前任务完成后，请再处理这条消息。”

- Agent 空闲时：消息写入 `next-turn`，并立即唤醒 Driver；
- Agent 运行时：消息留在 `next-turn`，不会插入当前 Turn；
- 多条 Followup 按 FIFO 排队，每条消息分别成为一个 Turn 的普通输入；
- 每个 Turn 最多领取一条 `next-turn` 消息，但同一批中可以附带若干 `next-step` 消息。

因此，`followup()` 不是“追加到当前对话步骤”，而是提交一个新的工作单元。

### 1.2 steer()：调整当前执行方向

`steer()` 表达的是：“在最近可用的下一次模型调用中考虑这条指令。”

- Agent 正在运行时：进入 `next-step`，在当前 Turn 的下一个 Step 被领取；
- Agent 空闲时：虽然进入 `next-step`，但也会唤醒 Driver 并开启一个 Turn；
- 如果当前 Step 已经完成领取，它不会修改正在构造或发送的请求，只能等待更晚的 Step。

典型场景是：模型正在调用工具时，用户发送“不要继续原方案，改用另一种方法”。工具完成后，Driver 发现 `next-step` 中有 Steering，于是当前 Turn 再执行一个 Step。

### 1.3 inject()：静默补充上下文

`inject()` 表达的是：“把这个事实提供给模型，但仅凭这个事实不值得启动 Agent。”

例如：

- 文件监听器报告文件发生变化；
- 后台任务提供进度；
- 插件注入运行环境或 Session 上下文。

它和 `steer()` 都进入 `next-step`，区别在于是否唤醒：

- Agent 运行中：在最近的后续 Step 被领取；
- Agent 空闲时：只保存，不创建 Turn，也不调用模型；
- 后续有 Followup 或 Steer 唤醒 Driver 时，再一起进入模型上下文。

### 1.4 两类队列的边界

`next-turn` 是任务边界：

- 保存尚未开始的普通任务；
- 按 FIFO 排队；
- 每个新 Turn 只取一条；
- 不会因为当前 Turn 还有后续 Step 而被提前取走。

`next-step` 是请求边界：

- 保存应该进入最近一次后续模型请求的信息；
- 一次领取当前已有的全部内容；
- 可以加入当前 Turn；
- 本身不保证开启新 Turn，是否唤醒由调用方式决定。

Driver 在 Turn 的第一个 Step 调用：

```text
claim('next-turn')
= 全部 next-step + 一条 next-turn
```

后续 Step 调用：

```text
claim('next-step')
= 全部 next-step
```

::: info 为什么要分成两类
如果 Followup 和 Steering 共用一个队列，用户在当前任务中的临时调整，就可能被错误地当成下一个独立任务；反过来，新的任务也可能被当前 Turn 提前消费。两个队列分别对应任务边界和请求边界，Agent 才能同时支持排队和介入。
:::

## 2. 唤醒 Driver

Driver 可以理解为：当前 Agent 唯一负责消费 Inbox，并连续执行 Turn 的异步任务。

唤醒 Driver 时，首先要把 Agent 从 `idle` 变成 `running`，然后再启动异步任务：

```text
如果 phase 不是 idle：直接返回
phase = running
启动 Driver
```

JavaScript 在这段同步代码中不会被另一个普通调用打断。因此，第一个唤醒者会先把 Agent 占为 `running`；后续或重入的 `wakeDriver()` 看到状态已经不是 `idle`，就直接返回。

这样同一个 Agent 不会出现两个 Driver 同时争抢 Inbox 的情况。

## 3. 执行 Turn

一个 Turn 可以包含多个 Step。每个 Step 大致对应一次模型请求，以及模型在这次请求中发起的工具调用。

下面的流程图把一次 Turn 中的事件、模型请求和工具执行放在同一条时间线上。点击阶段可以查看这个位置有哪些插件参与。

<div class="interactive-map">
  <iframe
    :src="withBase('/agent-loop-turn-map.html')"
    title="DSH Agent Loop：Turn 事件与监听器地图"
    loading="lazy"
    sandbox="allow-scripts"
    referrerpolicy="no-referrer"
  ></iframe>
</div>

<p class="interactive-map__fallback">
  如果嵌入视图无法显示，<a :href="withBase('/agent-loop-turn-map.html')" target="_blank" rel="noreferrer">在新窗口打开交互式地图</a>。
</p>

### 3.1 打开 Turn 并准备 Step

Turn 开始时，系统会生成 Turn 编号，并根据当前是第一个 Step 还是后续 Step 领取 Inbox：

- 第一个 Step：领取全部 `next-step` 和一条 `next-turn`；
- 后续 Step：只领取全部 `next-step`。

领取之后，系统会组装 Prompt、当前可见的工具 Schema 和运行时上下文，并触发 `agent/pre-step`。上下文压缩、指令注入、Session checkpoint、权限策略等插件，都可以在这个位置参与。

### 3.2 写入用户输入并派生消息

只有被当前 Step 接受的输入，才会写入 Session，并进入模型可见历史。系统不会从一个临时消息数组直接拼请求，而是从 Session Log 派生消息。

这样做的好处是：

- 模型看到的历史可以被恢复；
- UI 和模型使用同一组事实；
- 压缩或替换后的 Model Surface 可以在下一次请求中生效。

### 3.3 请求模型并处理输出

系统根据当前模型选择和 Prompt 发起 LLM 请求。流式输出会逐块记录为 Assistant 事件，最终形成可供 UI 和后续流程使用的消息。

如果模型输出中包含 Tool Call，Loop 不会直接调用函数，而是把它交给工具执行管线。工具结果写回 Session 以后，Loop 再决定是否需要下一个 Step。

## 4. 收敛

一个 Step 结束后，只要出现下面任意一种情况，当前 Turn 就会继续：

- 模型发起了工具调用，需要把工具结果交回模型；
- 新的 Steer 或 Inject 已经进入 `next-step`；
- 某个扩展逻辑明确要求继续下一步。

如果没有继续条件，Loop 就进入 stopping 阶段，完成 Step 和 Turn 的收尾，并回到 Inbox：

- 如果还有 Followup，Driver 开启下一个 Turn；
- 如果没有新的任务，Agent 回到 `idle`。

```text
模型回答
├── 没有工具调用，也没有后续输入 → turn/end → idle
├── 有工具调用 → 工具结果 → 下一个 Step
└── 有 next-step → 领取补充输入 → 下一个 Step
```

::: tip 章节小结
Agent Loop 的重点不是一个无限循环，而是对边界的区分：Followup 划分任务，Steer 和 Inject 影响请求，Turn 包住完整任务，Step 包住一次模型决策。明确这些边界后，工具、压缩和 Trace 才能在稳定的位置参与流程。
:::
