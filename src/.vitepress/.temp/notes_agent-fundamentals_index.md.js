import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Agent 基础：核心概念与运行机制","description":"从上下文、工具调用到 MCP 与压缩，系统理解 Agent 的基本组成与运行方式。","frontmatter":{"title":"Agent 基础：核心概念与运行机制","description":"从上下文、工具调用到 MCP 与压缩，系统理解 Agent 的基本组成与运行方式。","outline":[2,3]},"headers":[],"relativePath":"notes/agent-fundamentals/index.md","filePath":"notes/agent-fundamentals/index.md","lastUpdated":1788335820000}');
const _sfc_main = { name: "notes/agent-fundamentals/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="agent-基础-核心概念与运行机制" tabindex="-1">Agent 基础：核心概念与运行机制 <a class="header-anchor" href="#agent-基础-核心概念与运行机制" aria-label="Permalink to &quot;Agent 基础：核心概念与运行机制&quot;">​</a></h1><h2 id="章节" tabindex="-1">章节 <a class="header-anchor" href="#章节" aria-label="Permalink to &quot;章节&quot;">​</a></h2><ol><li><a href="./context-management">上下文管理</a></li><li><a href="./rag">RAG：从检索到生成</a></li></ol></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("notes/agent-fundamentals/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
