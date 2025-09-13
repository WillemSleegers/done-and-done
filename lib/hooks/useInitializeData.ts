import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/lib/store/projectStore'

// Global flag to ensure data is only fetched once per session
let hasInitialized = false

export function useInitializeData() {
  const { fetchInitialData } = useProjectStore()
  const initRef = useRef(false)

  useEffect(() => {
    // Only initialize once globally and once per hook instance
    if (hasInitialized || initRef.current) return
    
    hasInitialized = true
    initRef.current = true
    fetchInitialData()
  }, [fetchInitialData])
}