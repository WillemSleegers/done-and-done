import { create } from "zustand"

import { logger } from "@/lib/logger"
import { syncService } from "@/lib/services/syncService"

import { mergeWithLocalItems, updateTodoCounts } from "./helpers"
import { createProjectSlice } from "./projectSlice"
import { createTodoSlice } from "./todoSlice"
import { type ProjectStore } from "./types"

export const useProjectStore = create<ProjectStore>()((...a) => {
  const [set, get] = a

  return {
    projects: [],
    todos: {},
    todoCounts: {},
    isLoading: true,

    fetchInitialData: async () => {
      const currentState = get()
      if (currentState.projects.length === 0) {
        set({ isLoading: true })
      }
      try {
        logger.info("Fetching initial data via sync service")
        const { projects, todos } = await syncService.fetchInitialData(
          currentState.projects,
          currentState.todos
        )

        const { mergedProjects, mergedTodos } = mergeWithLocalItems(
          projects,
          todos,
          currentState.projects,
          currentState.todos
        )

        const todoCounts = updateTodoCounts(mergedTodos)
        logger.info("Initial data loaded successfully")
        set({ projects: mergedProjects, todos: mergedTodos, todoCounts, isLoading: false })
      } catch (error) {
        logger.error("Failed to fetch initial data:", error)
        set({ isLoading: false })
      }
    },

    refreshData: async () => {
      await get().fetchInitialData()
    },

    ...createProjectSlice(...a),
    ...createTodoSlice(...a),
  }
})
