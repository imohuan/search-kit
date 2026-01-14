/**
 * 详情页状态管理
 * 用于在路由跳转时传递详情数据
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SearchResult } from '@/types'

export const useDetailStore = defineStore('detail', () => {
  // 当前查看的搜索结果
  const currentResult = ref<SearchResult | null>(null)
  // 搜索关键词（用于高亮）
  const searchKeyword = ref('')
  // 是否精确搜索
  const isExact = ref(false)
  // 来源页面（用于返回）
  const fromRoute = ref<string>('/search')

  /**
   * 设置详情数据
   */
  function setDetail(result: SearchResult, keyword: string = '', exact: boolean = false, from: string = '/search') {
    currentResult.value = result
    searchKeyword.value = keyword
    isExact.value = exact
    fromRoute.value = from
  }

  /**
   * 清除详情数据
   */
  function clearDetail() {
    currentResult.value = null
    searchKeyword.value = ''
    isExact.value = false
  }

  return {
    currentResult,
    searchKeyword,
    isExact,
    fromRoute,
    setDetail,
    clearDetail
  }
})
