"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Send,
    User,
    Download,
    Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { generateModel, GenerateResponse } from "@/lib/api";

const ModelViewer = dynamic(() => import("./ModelViewer"), {
    ssr: false,
    loading: () => (
        <div className="flex h-[220px] items-center justify-center rounded-2xl border border-white/5 bg-neutral-900/40 text-xs text-neutral-400">
            Preparing 3D viewport…
        </div>
    ),
});

interface Message {
    role: "user" | "assistant";
    content: string;
    isError?: boolean;
    modelData?: GenerateResponse;
}

export default function Chat() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input;
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const data = await generateModel(userMessage);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "I've generated your 3D model! Here's a preview and download links:",
                    modelData: data
                },
            ]);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to generate model";
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Error: ${message}`, isError: true },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const hasMessages = messages.length > 0;

    return (
        <div className="flex min-h-screen w-full flex-col bg-[#0e0e0e] text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Header / Greeting Area - Only visible when no messages */}
            {!hasMessages && (
                <div className="flex flex-1 flex-col items-center justify-center px-4 transition-all duration-500 ease-in-out">
                    <h1 className="mb-12 text-5xl font-medium tracking-tight sm:text-6xl">
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
                            Hello, this is the Forma AI agent!
                        </span>
                    </h1>
                </div>
            )}

            {/* Chat History Area */}
            {hasMessages && (
                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 custom-scroll">
                    <div className="mx-auto max-w-3xl space-y-8">
                        {messages.map((msg, idx) => (
                            <article key={idx} className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div
                                    className={cn(
                                        "mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full",
                                        msg.role === "user"
                                            ? "bg-neutral-800 text-white"
                                            : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                                    )}
                                >
                                    {msg.role === "user" ? (
                                        <User className="h-5 w-5" />
                                    ) : (
                                        <Sparkles className="h-5 w-5" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-4">
                                    <div className="text-base leading-relaxed text-neutral-200">
                                        {msg.content}
                                    </div>

                                    {msg.modelData && (
                                        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 sm:p-6">
                                            <div className="h-[400px] w-full rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
                                                <ModelViewer stlUrl={msg.modelData.stl_url || null} />
                                            </div>
                                            <div className="flex gap-3">
                                                <a
                                                    href={msg.modelData.step_url}
                                                    download
                                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:bg-neutral-700"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    STEP
                                                </a>
                                                <a
                                                    href={msg.modelData.stl_url}
                                                    download
                                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-white"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    STL
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                        {loading && (
                            <div className="flex items-center gap-4 pl-12 animate-pulse">
                                <div className="h-4 w-4 rounded-full bg-blue-500/50"></div>
                                <span className="text-sm bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">Thinking...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Input Area - Fixed at bottom or centered */}
            <div className={cn(
                "w-full px-4 pb-8 transition-all duration-500 ease-in-out",
                !hasMessages ? "flex-none" : "sticky bottom-0 bg-[#0e0e0e]/80 backdrop-blur-xl pt-4"
            )}>
                <div className="mx-auto max-w-3xl">
                    <form onSubmit={handleSubmit} className="relative group">
                        <div className="relative flex flex-col gap-2 rounded-[28px] bg-[#1e1e1e] p-2 transition-colors focus-within:bg-[#2a2a2a]">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Forma AI"
                                className="w-full bg-transparent px-4 py-3 text-lg text-white placeholder:text-neutral-500 focus:outline-none"
                                disabled={loading}
                            />

                            <div className="flex items-center justify-end px-2 pb-1">
                                {input.trim() && (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition hover:bg-neutral-200 disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
}
