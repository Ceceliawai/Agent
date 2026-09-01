---
title: Session 与 Trace 留存
description: 从 Session Event Log 出发，理解 DSH 的持久化、投影、查询和 Telemetry。
date: 2026-09-01
tags:
  - DSH
  - Session
  - Trace
outline: [2, 4]
---

# Session 与 Trace 留存

前面 Agent Loop 和工具调用里反复提到了 Session Log。这里把它单独拿出来，是因为“Trace 留存”并不是把控制台日志保存下来这么简单。

在 DSH 中，需要区分几个东西：

1. Session Event Log：权威的事实流；
2. Persistence：把事实流可靠地落盘；
3. Projection / Query：从事实流派生出页面和查询需要的状态；
4. Telemetry：可选的、经过脱敏的外部观测副本。

## 1. Session Event Log

Session Log 是一条只追加的事件序列。Agent 运行过程中发生的关键事实，都会按顺序写进来：

- Turn 和 Step 的开始、结束；
- 用户消息；
- 模型请求；
- Assistant 的流式分片和最终消息；
- Tool Call 和 Tool Result；
- 上下文替换和压缩过程。

这些事件都有连续的序号，所以系统不只是知道“发生了什么”，还知道“它们按照什么顺序发生”。

### 1.1 为什么它是权威事实

内存里的 Agent 状态主要是为了让当前进程快速运行，Session Log 才是恢复和回放的事实来源。

进程重启以后，系统可以从这条事件流中重新得到：

- 之前已经完成的对话；
- 哪些工具已经调用、结果是什么；
- 当前 Turn 和 Step 进行到哪里；
- Inbox 中还有哪些未消费消息；
- Model Surface 当前应该展示哪些内容。

所以，Session Log 不是 Agent 的“调试输出”，而是 Agent 运行过程本身的一部分。

::: info Model-visible means logged
如果某一项信息会进入模型请求并影响模型判断，那么它就应该能够从 Session Log 中重新构造。否则恢复之后的模型，看到的世界可能和中断前不一样。
:::

### 1.2 为什么要保留 Assistant Chunk

Assistant 的原始 Chunk 不只是为了最后拼出一段文本。

- UI 可以按照接近真实的方式回放模型输出；
- Trace 可以看到模型是在什么时候开始输出的；
- 排查流式请求中断时，可以知道已经收到哪些内容；
- 最终消息和原始分片可以互相校验。

最终消息适合对话展示，原始分片适合 UI fidelity、回放和 Trace。它们都是同一条事实流，只是粒度不同。

## 2. Persistence：把日志落盘

Session Log 需要有一个持久化后端，否则进程退出以后，事实也就跟着消失了。

DSH 的 JSONL Backend 可以理解为：每个 Session 有一份只追加的日志文件，事件一条一条写进去，也可以选择使用 Zstandard 压缩。

### 2.1 为什么采用只追加

只追加的好处是，每条事件都有清晰的物理顺序，不需要在运行过程中反复更新旧记录。

这和 Session 的业务语义是匹配的：已经发生的事实不应该被悄悄改写，新的状态通过新的事件表达。

### 2.2 进程崩溃后怎么恢复

恢复时，系统会检查日志末尾的物理记录：

- 如果只是最后一条记录写了一半，就丢弃这条撕裂记录；
- 如果一个 Turn 已经记录了主要事实，但缺少结果或结束事件，就补齐缺失的终止语义；
- 已经完整写入的旧事件不会被回滚。

也就是说，进程停止会被解释成一次可以处理的中断，而不是让整段 Session 失效。

## 3. Projection 与 Query

只追加日志适合保存事实，但页面不可能每次都从第一条事件开始阅读。因此系统还需要从事件流派生出更容易使用的状态。

### 3.1 Session Projection

Projection 会按顺序折叠事件，得到 UI 或其他业务需要的当前状态，比如：

- 当前对话表层；
- Turn 和 Step 的状态；
- 工具执行结果；
- Agent 当前是否仍在运行。

它是从日志计算出来的，不是另一份可以随便修改的真相。需要新的展示方式时，可以从同一条事件流重新投影。

### 3.2 Session Query

Query 建立在事件和投影之上，用来检索某个 Session 的历史和状态。例如查看某次 Turn 的工具调用，或者查询一个 Agent 在什么时候进入了 stopping。

Projection 解决“当前状态怎样展示”，Query 解决“从历史中怎样查”。两者都不会反过来修改权威 Session Log。

```text
Session Event Log
├── Model Surface：下一次模型看到的消息
├── UI Projection：页面展示的当前状态
├── Transcript / Replay：可读记录与过程回放
└── Session Query：检索与分析
```

## 4. Telemetry

Telemetry 是可选的外部观测副本，用来把执行过程发送给监控或分析系统。但它不是 Session Log，也不能替代 Session Log。

### 4.1 和 Session Log 的区别

| 维度 | Session Event Log | Telemetry |
| --- | --- | --- |
| 定位 | 权威业务事实 | 可选观测副本 |
| 是否参与恢复 | 是 | 否 |
| 是否进入模型历史 | 可以被派生为 Model Surface | 不进入 |
| 完整性要求 | 持续写入、顺序明确 | Best-effort |
| 内容处理 | 保留权威事实 | 导出前可以脱敏 |

如果外部 Telemetry 系统暂时不可用，Agent 的业务执行不应该被阻塞；但本地 Session Log 仍然要继续承担恢复和审计职责。

### 4.2 Telemetry 如何脱敏

Telemetry 发送前，会经过 `session-telemetry/record` Waterfall。插件可以在这里删除敏感字段、替换内容，或者只保留事件的摘要信息。

这里有一个边界：

- 脱敏只修改准备发送出去的副本；
- 权威 Session Log 不会因为 Telemetry 脱敏而被改写；
- 导出副本不能重新进入模型上下文。

为了控制数据量，每个 Step 还可以只导出第一条 `assistant/chunk`。接收端则应该使用 `(session.id, event.seq)` 去重，因为 Best-effort 投递可能发生重试。

## 5. Trace 留存的完整闭环

把前面的内容串起来，完整链路就是：

```text
业务执行产生 SessionEvent
→ Session Log 形成权威时间线
→ Persistence 将时间线落盘
→ Projection / Query 派生可读视图
→ Telemetry 发送脱敏观测副本
```

这样就不会把几个概念混在一起：

- 恢复和审计依赖权威 Session Log；
- 文件和页面展示依赖 Projection；
- 历史检索依赖 Query；
- 外部监控依赖 Telemetry 副本。

::: tip 章节小结
DSH 先把 Agent 执行过程建模成一条可追加、可恢复的 Session 事实流，再从这条事实流派生模型上下文、UI 状态、查询结果和外部 Trace。这样每一层都知道自己负责什么，也不会因为某个展示或监控系统出问题而破坏真正的会话历史。
:::
