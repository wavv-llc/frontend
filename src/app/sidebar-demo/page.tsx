"use client";

import { Sidebar } from "@/components/assistant/Sidebar";

export default function SidebarDemoPage() {
    return (
        <div className="relative min-h-screen bg-slate-950">
            <Sidebar />

            {/* Main Content Area */}
            <main className="min-h-screen md:ml-[260px] p-8 transition-all duration-300">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-100 mb-4">
                        ChatGPT-Style Sidebar Demo
                    </h1>
                    <p className="text-slate-400 mb-6">
                        This is a functional clone of the ChatGPT sidebar with all the requested features, including a smooth compressed state.
                    </p>

                    <div className="space-y-6">
                        <section className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-slate-100 mb-3">Features</h2>
                            <ul className="space-y-2 text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Fixed sidebar on desktop (260px width) with dark slate theme</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span><strong>NEW:</strong> Compressed state (60px) with smooth slide animation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Tooltips on hover in compressed mode showing full chat titles</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Mobile-responsive with Sheet component (hamburger menu)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>"New Chat" button and sidebar toggle in header</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Scrollable chat history with ScrollArea component</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Grouped chats by date: "Today", "Yesterday", "Previous 7 Days", "Older"</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Hover-triggered ellipsis menu with Rename/Delete options</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Active chat highlighting with distinct background</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>User profile footer with Avatar and DropdownMenu</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Fully typed with TypeScript</span>
                                </li>
                            </ul>
                        </section>

                        <section className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-slate-100 mb-3">Components Used</h2>
                            <div className="grid grid-cols-2 gap-3 text-slate-300">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-400">•</span>
                                    <code className="text-sm">Sheet</code>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-400">•</span>
                                    <code className="text-sm">Button</code>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-400">•</span>
                                    <code className="text-sm">ScrollArea</code>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-400">•</span>
                                    <code className="text-sm">Avatar</code>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-400">•</span>
                                    <code className="text-sm">DropdownMenu</code>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-400">•</span>
                                    <code className="text-sm">Separator</code>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-400">•</span>
                                    <code className="text-sm">Tooltip</code>
                                </div>
                            </div>
                        </section>

                        <section className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-slate-100 mb-3">Try It Out</h2>
                            <ul className="space-y-2 text-slate-300">
                                <li>• <strong>Click the toggle button</strong> (top-left icon) to smoothly slide between expanded and compressed states</li>
                                <li>• In compressed mode, hover over chat icons to see tooltips with full titles</li>
                                <li>• Hover over chat items (in expanded mode) to see the ellipsis menu</li>
                                <li>• Click on different chats to see the active state change</li>
                                <li>• Click the user profile to see the dropdown menu</li>
                                <li>• Resize your browser to see the mobile responsive behavior</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
