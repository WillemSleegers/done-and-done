"use client"

import type { DraggableSyntheticListeners } from "@dnd-kit/core"
import { useEffect, useRef, useState } from "react"

interface UseDragTouchActivationOptions {
  listeners: DraggableSyntheticListeners
  isDragging: boolean
  delay: number
  disabled?: boolean
  onTap: () => void
}

// Shared long-press-to-drag touch handling for dnd-kit sortable items:
// a short tap triggers onTap, holding past `delay` arms the drag listener.
export function useDragTouchActivation({
  listeners,
  isDragging,
  delay,
  disabled = false,
  onTap,
}: UseDragTouchActivationOptions) {
  const [isPressed, setIsPressed] = useState(false)

  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartEventRef = useRef<React.TouchEvent | null>(null)
  const wasTouchInteractionRef = useRef(false)

  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current)
      }
    }
  }, [])

  const armDrag = () => {
    if (listeners?.onTouchStart && touchStartEventRef.current) {
      listeners.onTouchStart(touchStartEventRef.current as React.TouchEvent<Element>)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return

    wasTouchInteractionRef.current = true
    e.preventDefault()
    touchStartEventRef.current = e

    touchTimeoutRef.current = setTimeout(armDrag, delay)
  }

  const handleTouchEnd = () => {
    if (disabled) return

    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
      if (!isDragging) {
        onTap()
      }
    }
    touchStartEventRef.current = null

    setTimeout(() => {
      wasTouchInteractionRef.current = false
    }, 100)
  }

  const handleTouchMove = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
      armDrag()
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return

    if (e.pointerType === "touch") {
      e.preventDefault()
    } else if (e.pointerType === "mouse") {
      setIsPressed(true)
      if (listeners?.onPointerDown) {
        listeners.onPointerDown(e as React.PointerEvent<Element>)
      }
    }
  }

  const clearPressed = () => setIsPressed(false)

  return {
    isPressed,
    wasTouchInteractionRef,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handlePointerDown,
    pointerUpHandlers: {
      onPointerUp: clearPressed,
      onPointerLeave: clearPressed,
      onPointerCancel: clearPressed,
    },
    noSelectStyle: {
      WebkitTapHighlightColor: "transparent",
      WebkitUserSelect: "none",
      WebkitTouchCallout: "none",
      userSelect: "none",
    } as React.CSSProperties,
  }
}
