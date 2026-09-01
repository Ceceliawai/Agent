<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import GitHubStar from './components/GitHubStar.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <GitHubStar />
    </template>
  </Layout>
</template>
