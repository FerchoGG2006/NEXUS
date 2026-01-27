import { Sidebar } from '@/components/ui'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    )
}
