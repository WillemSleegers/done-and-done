'use client'

import { useState } from 'react'
import { User, LogOut, Settings } from 'lucide-react'
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
        className="flex items-center gap-2 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
      >
        <User size={20} />
        <span className="hidden sm:inline text-sm">
          {user.email?.split('@')[0] || 'User'}
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
          <div className="absolute right-0 top-full mt-1 w-48 bg-popover rounded-lg shadow-lg border border-border z-20">
            <div className="p-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {user.user_metadata?.full_name || 'User'}
              </p>
            </div>
            
            <div className="py-1">
              <button
                onClick={() => setShowDropdown(false)}
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
              >
                <Settings size={16} />
                Settings
              </button>
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