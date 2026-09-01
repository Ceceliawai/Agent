<script setup lang="ts">
import { Star } from '@lucide/vue'
import { onMounted, ref } from 'vue'

const starCount = ref<number | null>(null)

function formatCount(count: number) {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString()
}

onMounted(async () => {
  try {
    const response = await fetch('https://api.github.com/repos/Ceceliawai/Agent')
    if (!response.ok) return

    const repository = await response.json()
    starCount.value = repository.stargazers_count
  } catch {
    // The link remains usable if GitHub rate limits the public API request.
  }
})
</script>

<template>
  <a
    class="github-star"
    href="https://github.com/Ceceliawai/Agent"
    target="_blank"
    rel="noreferrer"
    aria-label="在 GitHub 上为 Ceceliawai/Agent 点 Star"
  >
    <Star :size="15" :stroke-width="2" aria-hidden="true" />
    <span>Star</span>
    <span v-if="starCount !== null" class="github-star__count">
      {{ formatCount(starCount) }}
    </span>
  </a>
</template>
