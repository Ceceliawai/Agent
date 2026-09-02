import { defineConfig } from 'vitepress'

export default defineConfig({
  srcDir: '../docs',
  outDir: '../dist',
  cacheDir: '../node_modules/.vitepress-cache',
  title: 'Cecelia 的知识库',
  description: '关于 Agent、LLM 与软件工程的学习笔记',
  lang: 'zh-CN',
  base: '/Agent/',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    [
      'script',
      {
        defer: '',
        src: 'https://cloud.umami.is/script.js',
        'data-website-id': '104d6d6c-8ef4-4f58-865f-dafb6cbf19bf'
      }
    ]
  ],
  themeConfig: {
    siteTitle: 'Cecelia Notes',
    nav: [
      { text: '首页', link: '/' },
      { text: '关于', link: '/about' }
    ],
    sidebar: {
      '/notes/backend-fundamentals/': [
        {
          text: '后端八股',
          items: [
            { text: '专题总览', link: '/notes/backend-fundamentals/' },
            { text: '1. 通用基础', link: '/notes/backend-fundamentals/general-concepts' },
            { text: '2. Redis', link: '/notes/backend-fundamentals/redis' }
          ]
        }
      ],
      '/notes/agent-fundamentals/': [
        {
          text: 'Agent 基础',
          items: [
            { text: '专题总览', link: '/notes/agent-fundamentals/' },
            { text: '1. 上下文管理', link: '/notes/agent-fundamentals/context-management' },
            { text: '2. RAG', link: '/notes/agent-fundamentals/rag' }
          ]
        }
      ],
      '/notes/aicoding/': [
        {
          text: 'AICoding 笔试方法论',
          items: [
            { text: '专题总览', link: '/notes/aicoding/' }
          ]
        }
      ],
      '/notes/dsh/': [
        {
          text: 'DeepSeek Harness 代码粗读',
          items: [
            { text: '总览与阅读路线', link: '/notes/dsh/' },
            { text: '1. Cordis 插件运行时', link: '/notes/dsh/cordis' },
            { text: '2. Agent 生命周期', link: '/notes/dsh/agent-lifecycle' },
            { text: '3. Agent Loop', link: '/notes/dsh/agent-loop' },
            { text: '4. 工具调用', link: '/notes/dsh/tool-execution' },
            { text: '5. 上下文压缩', link: '/notes/dsh/compaction' },
            { text: '6. Session 与 Trace', link: '/notes/dsh/session-trace' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Ceceliawai/Agent' }
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索'
          },
          modal: {
            noResultsText: '没有找到相关内容',
            resetButtonTitle: '清除查询',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    lastUpdated: {
      text: '最后更新于'
    },
    editLink: {
      pattern: 'https://github.com/Ceceliawai/Agent/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },
    footer: {
      message: '内容采用 CC BY-NC-SA 4.0 许可',
      copyright: 'Copyright © 2026 Cecelia'
    }
  }
})
