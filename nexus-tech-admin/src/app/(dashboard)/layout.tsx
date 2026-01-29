import { Sidebar } from '@/components/ui'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen cyber-bg flex text-gray-100 font-sans">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 transition-all duration-300">
                {children}
            </main>
        </div>
    )
}
