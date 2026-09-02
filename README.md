<div align="center">
  <h1>Cecelia 的知识库</h1>
  <p><strong>学习路线 · 经验分享 · 开源架构研究</strong></p>
  <p><em>你身上的包袱都会变成星星，照亮你来时的路。</em></p>
  <p>
    <a href="https://ceceliawai.github.io/Agent/">在线阅读</a>
    ·
    <a href="https://github.com/Ceceliawai/Agent/issues">提问与反馈</a>
  </p>
</div>

---

## 这里记录什么？

这是一个持续更新的个人知识分享仓库，记录我在 Agent、LLM、AI Coding 与软件工程方向的学习过程。内容可能是一篇学习笔记、一份实践复盘，也可能是对一个开源项目的架构拆解。

我更关心“它为什么这样设计，以及这些设计还能用在哪里”，因此会尽量从问题出发，结合源码、调用链、架构图和实际实验，整理出可验证、可复用的结论。这里不是某个产品的官方文档，也不追求一次性完成；随着新的理解和实践，已有内容会继续修订。

## 内容地图

| 方向 | 当前内容 | 适合怎么读 | 状态 |
| --- | --- | --- | --- |
| **Agent 基础** | [核心概念与运行机制](./docs/notes/agent-fundamentals/index.md) | 从上下文管理开始，逐步理解工具、MCP、压缩等基础机制 | 🚧 持续更新 |
| **DSH 学习笔记** | [DeepSeek Harness：插件化 Agent 的运行与留存](./docs/notes/dsh/index.md) | 先看总览，再沿 Agent 生命周期、Agent Loop、工具调用和 Session Trace 追踪关键链路 | 🚧 持续更新 |
| **AI Coding 学习笔记** | [AI Coding 笔试方法论](./docs/notes/aicoding/index.md) | 从需求拆解开始，结合模块开发、测试联调与提交复盘阅读 | ✅ 已完成 |
| **学习路线** | 将逐步补充各主题的阶段目标、参考资料与实践记录 | 按自己的基础选择主题，不必从头线性阅读 | 🗺️ 规划中 |
| **开源架构研究** | 计划整理更多 Agent 与开发工具项目的源码阅读 | 关注模块边界、运行时、状态管理和工程取舍 | 🗺️ 规划中 |

## 已有专题

### Agent 基础

从核心概念与运行机制出发，逐步整理 Agent 的基础知识：

- [专题总览](./docs/notes/agent-fundamentals/index.md)
- [上下文管理](./docs/notes/agent-fundamentals/context-management.md)
- [RAG：从检索到生成](./docs/notes/agent-fundamentals/rag.md)

### DeepSeek Harness

从 Cordis 插件运行时出发，理解一个插件化 Agent 系统如何组织能力与状态：

- [专题总览](./docs/notes/dsh/index.md)
- [Cordis 与插件运行时](./docs/notes/dsh/cordis.md)
- [Agent 生命周期](./docs/notes/dsh/agent-lifecycle.md)
- [Agent Loop](./docs/notes/dsh/agent-loop.md)
- [工具执行](./docs/notes/dsh/tool-execution.md)
- [上下文压缩](./docs/notes/dsh/compaction.md)
- [Session Trace](./docs/notes/dsh/session-trace.md)

### AI Coding

整理 AI 协作编码过程中的方法与经验，覆盖从理解需求、拆分任务到测试和复盘的完整闭环：

- [AI Coding 笔试方法论](./docs/notes/aicoding/index.md)

## 推荐阅读方式

如果你是第一次来，可以这样开始：

1. 先浏览[在线知识库](https://ceceliawai.github.io/Agent/)，按兴趣选择一个专题；
2. 阅读专题总览中的问题、背景和章节地图，建立整体认识；
3. 再沿着架构图或调用链阅读具体章节，必要时对照关联开源项目的源码；
4. 把“能迁移到自己的项目里的设计”记下来，并通过 Issue 讨论或补充。

## 本地阅读

```bash
cd Agent
npm install
npm run docs:dev
```

然后打开终端提示的本地地址。修改 `docs/` 下的 Markdown 文件后，页面会自动刷新。

检查生产构建：

```bash
npm run docs:build
```

## 内容约定

- **学习笔记**：记录概念、问题、推理过程与暂时的结论，并标注仍待验证的部分；
- **源码研究**：优先说明整体架构和关键调用链，再深入具体实现；
- **经验分享**：尽量给出适用场景、实践步骤和失败复盘，而不只罗列工具或观点；
- **持续修订**：如果后续发现错误，会直接更新原文，并保留清晰的修改脉络。

## 反馈与共建

欢迎通过 [Issue](https://github.com/Ceceliawai/Agent/issues) 反馈错别字、失效链接或技术问题，也欢迎提交 Pull Request 补充资料、改进表达，或者分享你对某个架构问题的不同理解。

## 许可

除特别注明外，仓库中的文字内容采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans) 许可。引用或转载时请保留原作者与出处。

---

<div align="center">
  <p>如果这些记录对你有帮助，欢迎 Star，也欢迎留下你的问题和建议。</p>
</div>
