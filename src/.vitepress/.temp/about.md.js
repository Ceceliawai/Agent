import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"关于","description":"关于 Cecelia 的知识库","frontmatter":{"title":"关于","description":"关于 Cecelia 的知识库"},"headers":[],"relativePath":"about.md","filePath":"about.md","lastUpdated":1788281304000}');
const _sfc_main = { name: "about.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="关于" tabindex="-1">关于 <a class="header-anchor" href="#关于" aria-label="Permalink to &quot;关于&quot;">​</a></h1><p>这里用于整理我在 Agent、LLM 与软件工程方向的学习笔记。</p><p>笔记以问题为入口，尽量给出明确的概念边界、执行流程和可验证的结论。内容会持续修订，源文件与修改历史均保存在 GitHub。</p><h2 id="联系与反馈" tabindex="-1">联系与反馈 <a class="header-anchor" href="#联系与反馈" aria-label="Permalink to &quot;联系与反馈&quot;">​</a></h2><ul><li>GitHub：<a href="https://github.com/Ceceliawai" target="_blank" rel="noreferrer">Ceceliawai</a></li><li>B 站：<a href="https://space.bilibili.com/354885275?spm_id_from=333.1007.0.0" target="_blank" rel="noreferrer">Cecelia</a></li><li>内容仓库：<a href="https://github.com/Ceceliawai/Agent" target="_blank" rel="noreferrer">Ceceliawai/Agent</a></li></ul><p>发现错误或希望讨论某篇内容时，可以直接在仓库中提交 Issue。</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("about.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const about = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  about as default
};
