import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"后端八股：核心基础与高频问题","description":"系统整理计算机网络、操作系统、数据库、缓存、并发与分布式系统中的后端基础知识。","frontmatter":{"title":"后端八股：核心基础与高频问题","description":"系统整理计算机网络、操作系统、数据库、缓存、并发与分布式系统中的后端基础知识。","outline":[2,3]},"headers":[],"relativePath":"notes/backend-fundamentals/index.md","filePath":"notes/backend-fundamentals/index.md","lastUpdated":1788345156000}');
const _sfc_main = { name: "notes/backend-fundamentals/index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="后端八股-核心基础与高频问题" tabindex="-1">后端八股：核心基础与高频问题 <a class="header-anchor" href="#后端八股-核心基础与高频问题" aria-label="Permalink to &quot;后端八股：核心基础与高频问题&quot;">​</a></h1><h2 id="章节" tabindex="-1">章节 <a class="header-anchor" href="#章节" aria-label="Permalink to &quot;章节&quot;">​</a></h2><ol><li><a href="./general-concepts">通用基础</a></li><li><a href="./redis">Redis</a></li></ol><h2 id="规划方向" tabindex="-1">规划方向 <a class="header-anchor" href="#规划方向" aria-label="Permalink to &quot;规划方向&quot;">​</a></h2><ul><li>计算机网络</li><li>操作系统</li><li>数据库</li><li>并发</li><li>分布式系统</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("notes/backend-fundamentals/index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
