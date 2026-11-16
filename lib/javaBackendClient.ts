/**
 * Learn X Java Backend Client
 * Connects the Next.js frontend to the Java Backend REST service (port 8080)
 */

export interface JavaCodeRunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  error: string | null;
}

export const JAVA_API_BASE =
  typeof window !== "undefined"
    ? "/api/java"
    : process.env.JAVA_BACKEND_URL || "http://127.0.0.1:8080";

/**
 * Check if the Java Backend Service is healthy and active
 */
export async function checkJavaBackendHealth(): Promise<{
  online: boolean;
  version?: string;
  service?: string;
}> {
  try {
    const res = await fetch(`${JAVA_API_BASE}/health`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return {
      online: data.status === "ok",
      version: data.javaVersion,
      service: data.service,
    };
  } catch {
    return { online: false };
  }
}

/**
 * Execute Java code in the Java Backend Sandbox
 */
export async function executeJavaCode(
  code: string,
  stdin: string = ""
): Promise<JavaCodeRunResult> {
  try {
    const res = await fetch(`${JAVA_API_BASE}/code/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, stdin, language: "java" }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        stdout: "",
        stderr: errText || "Failed to execute Java code",
        exitCode: res.status,
        executionTimeMs: 0,
        error: `HTTP ${res.status}`,
      };
    }
    return (await res.json()) as JavaCodeRunResult;
  } catch (err: any) {
    return {
      success: false,
      stdout: "",
      stderr: err.message || "Network error connecting to Java backend",
      exitCode: -1,
      executionTimeMs: 0,
      error: err.message || "Network error",
    };
  }
}
