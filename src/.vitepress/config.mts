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
    ['meta', { name: 'theme-color', content: '#ffffff' }]
  ],
  themeConfig: {
    siteTitle: 'Cecelia Notes',
    nav: [
      { text: '首页', link: '/' },
      { text: 'Agent', link: '/notes/agents/agent-loop' },
      { text: '关于', link: '/about' }
    ],
    sidebar: {
      '/notes/': [
        {
          text: 'Agent',
          items: [
            { text: 'Agent Loop：从感知到行动', link: '/notes/agents/agent-loop' }
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
