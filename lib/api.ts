const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

// --- A2A Models ---

export enum TaskState {
    UNSPECIFIED = "TASK_STATE_UNSPECIFIED",
    SUBMITTED = "TASK_STATE_SUBMITTED",
    WORKING = "TASK_STATE_WORKING",
    COMPLETED = "TASK_STATE_COMPLETED",
    FAILED = "TASK_STATE_FAILED",
    CANCELLED = "TASK_STATE_CANCELLED",
    INPUT_REQUIRED = "TASK_STATE_INPUT_REQUIRED",
    REJECTED = "TASK_STATE_REJECTED",
    AUTH_REQUIRED = "TASK_STATE_AUTH_REQUIRED",
}

export enum Role {
    UNSPECIFIED = "ROLE_UNSPECIFIED",
    USER = "ROLE_USER",
    AGENT = "ROLE_AGENT",
}

export interface FilePart {
    fileWithUri?: string;
    fileWithBytes?: string; // base64 encoded
    mediaType?: string;
    name?: string;
}

export interface Part {
    text?: string;
    file?: FilePart;
    data?: Record<string, any>;
    metadata?: Record<string, any>;
}

export interface Message {
    messageId?: string;
    contextId?: string;
    taskId?: string;
    role: Role;
    parts: Part[];
    metadata?: Record<string, any>;
    extensions?: string;
    referenceTaskIds?: string;
}

export interface TaskStatus {
    state: TaskState;
    message?: Message;
    timestamp?: string;
}

export interface Artifact {
    parts: Part[];
}

export interface Task {
    id: string;
    contextId?: string;
    status: TaskStatus;
    artifacts?: Artifact;
    history: Message[];
    metadata?: Record<string, any>;
}

export interface SendMessageRequest {
    message: Message;
    configuration?: {
        acceptedOutputModes?: string[];
    };
}

export interface SendMessageResponse {
    task: Task;
}

export interface GetTaskResponse {
    task: Task;
}

// --- API Functions ---

/**
 * Sends a message to the agent to start a task.
 *
 * @param prompt - The text prompt for the agent.
 * @param contextId - Optional context ID for the conversation.
 * @returns A promise that resolves to the created task.
 */
export async function sendMessage(prompt: string, contextId?: string): Promise<Task> {
    const message: Message = {
        role: Role.USER,
        contextId: contextId || crypto.randomUUID(),
        parts: [{ text: prompt }],
    };

    const requestBody: SendMessageRequest = {
        message,
    };

    const response = await fetch(`${API_BASE_URL}/v1/message:send`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to send message");
    }

    const data: SendMessageResponse = await response.json();
    return data.task;
}

/**
 * Retrieves the current status of a task.
 *
 * @param taskId - The ID of the task to retrieve.
 * @returns A promise that resolves to the task object.
 */
export async function getTask(taskId: string): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/v1/tasks/${taskId}`, {
        method: "GET",
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to get task");
    }

    const data: GetTaskResponse = await response.json();
    return data.task;
}

/**
 * Polls a task until it reaches a terminal state (COMPLETED, FAILED, CANCELLED, REJECTED).
 *
 * @param taskId - The ID of the task to poll.
 * @param intervalMs - The polling interval in milliseconds.
 * @returns A promise that resolves to the completed task.
 */
export async function pollTask(taskId: string, intervalMs: number = 1000): Promise<Task> {
    while (true) {
        const task = await getTask(taskId);
        const state = task.status.state;

        if (
            state === TaskState.COMPLETED ||
            state === TaskState.FAILED ||
            state === TaskState.CANCELLED ||
            state === TaskState.REJECTED
        ) {
            return task;
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
}

/**
 * Helper to construct a full URL for a file path returned by the API.
 */
export function getFileUrl(path: string | undefined): string | undefined {
    if (!path) return undefined;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
