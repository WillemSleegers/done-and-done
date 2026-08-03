"use client"

import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"

import { DRAG_CONSTRAINTS } from "@/lib/constants"

export function useDndSensors(touchActivationDelay: number) {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: DRAG_CONSTRAINTS.POINTER_DISTANCE,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: touchActivationDelay,
        tolerance: DRAG_CONSTRAINTS.TOUCH_TOLERANCE,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
}
