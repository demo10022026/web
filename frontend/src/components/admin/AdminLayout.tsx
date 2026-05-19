import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">

            {/* Sidebar */}
            <AdminSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                <AdminTopbar
                    onMenuClick={() => setSidebarOpen(true)}
                />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>

            </div>
        </div>
    )
}