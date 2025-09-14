'use client'

import { useState } from 'react'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/AuthProvider'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  if (!user) return null

  const handleSignOut = async () => {
    setShowDropdown(false)
    await signOut()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-2 h-10 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
      >
        <User size={20} />
        <span className="hidden sm:inline text-sm">
          {user.email || 'User'}
        </span>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-1 w-36 bg-popover rounded-lg shadow-lg border border-border z-20">
            <div className="py-1">
              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}