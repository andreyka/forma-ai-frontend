const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

/**
 * Response structure from the generation API.
 */
export interface GenerateResponse {
    message: string;
    code: string;
    step_url: string;
    stl_url: string;
}

/**
 * Generates a 3D model based on the provided text prompt.
 *
 * @param prompt - The text description of the model to generate.
 * @returns A promise that resolves to the generation response containing model URLs.
 * @throws Will throw an error if the API request fails.
 */
export async function generateModel(prompt: string): Promise<GenerateResponse> {
    const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate model");
    }

    const data = await response.json();

    const withBase = (path: string | null): string | null => (path ? `${API_BASE_URL}${path}` : null);

    // Prepend API base URL to relative paths
    return {
        ...data,
        step_url: withBase(data.step_url),
        stl_url: withBase(data.stl_url),
    } as GenerateResponse;
}
