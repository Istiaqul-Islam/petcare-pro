// src/lib/env.ts
import { getCloudflareContext } from "./cf-context";

/**
 * Robustly get environment variables in both local and Cloudflare Edge runtimes
 */
export function getEnv(): any {
    // 1. Try Cloudflare Request Context
    try {
        const cfCtx = getCloudflareContext();
        if (cfCtx?.env && Object.keys(cfCtx.env).length > 0) {
            return cfCtx.env;
        }
    } catch (e) { }

    // 2. Try globalThis (common in some Cloudflare environments)
    const g = globalThis as any;
    if (g.__env__) return g.__env__;
    if (g.env) return g.env;

    // 3. Fallback to process.env (local development)
    if (typeof process !== "undefined" && process.env) {
        return process.env;
    }

    return {};
}

/**
 * Check if the current environment is production (running on Cloudflare)
 */
export function isProduction(): boolean {
    const env = getEnv();

    // Check for standard production environment indicators
    const isCloudflare =
        env.CF_PAGES === "1" ||
        (typeof process !== "undefined" && (process as any).env?.NEXT_RUNTIME === "edge");

    return env.NODE_ENV === "production" || isCloudflare;
}

/**
 * Get a specific environment variable
 */
export function getEnvVar(name: string, defaultValue?: string): string | undefined {
    const env = getEnv();
    return env[name] || defaultValue;
}
