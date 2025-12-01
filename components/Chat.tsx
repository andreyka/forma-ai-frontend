"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { generateModel } from "@/lib/api";
import ChatMessage, { Message } from "./chat/ChatMessage";
import ChatInput from "./chat/ChatInput";

/**
 * Main Chat component for interacting with the Forma AI agent.
 * Handles message history, user input, and displaying generated models.
 *
 * @returns The rendered Chat component.
 */
export default function Chat(): React.JSX.Element {
    const [loading, setLoading] = useState<boolean>(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (): void => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (userMessage: string): Promise<void> => {
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
                            <ChatMessage key={idx} message={msg} />
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
                    <ChatInput onSubmit={handleSendMessage} loading={loading} />
                </div>
            </div >
        </div >
    );
}
