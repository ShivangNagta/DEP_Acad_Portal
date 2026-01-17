import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export default function DashboardLayout({ title, sidebar, children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-bg text-text flex flex-col md:flex-row">

            {/* MOBILE HEADER */}
            <div className="md:hidden flex items-center justify-between p-4 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 rounded-lg hover:bg-bg active:scale-95 transition-transform"
                    >
                        <Menu size={24} />
                    </button>
                    <h2 className="font-semibold text-lg">{title}</h2>
                </div>
                <ThemeToggle />
            </div>

            {/* SIDEBAR */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 p-6
                bg-surface/85 backdrop-blur-md border-r border-border
                transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 md:block md:bg-surface md:backdrop-blur-none
            `}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-1 rounded-md hover:bg-bg text-muted"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="sidebar-content">
                    {sidebar}
                </div>
            </aside>

            {/* MOBILE OVERLAY */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden bg-black/20 backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* MAIN CONTENT */}
            <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
                <div className="hidden md:flex justify-end mb-6">
                    <ThemeToggle />
                </div>
                {children}
            </main>
        </div>
    );
}
