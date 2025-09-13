'use client'

import { useInitializeData } from '@/lib/hooks/useInitializeData'

export function DataInitializer() {
  useInitializeData()
  return null // This component only handles side effects
}