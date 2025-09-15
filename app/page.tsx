"use client"

import AuthGuard from "@/components/auth/AuthGuard"
import NavigationBar from "@/components/navigation/NavigationBar"
import SyncStatus from "@/components/system/SyncStatus"
import ProjectGrid from "@/components/project/ProjectGrid"

export default function Home() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavigationBar variant="title" title="Done and Done" />
        <SyncStatus />
        <ProjectGrid />
      </div>
    </AuthGuard>
  )
}
