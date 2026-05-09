// src/lib/env.ts
import { getCloudflareContext } from "./cf-context";

/**
 * Robustly get environment variables in both local and Cloudflare Edge runtimes
 */
export function getEnv(): any {
    const g = globalThis as any;

    // 1. Try Cloudflare Context (next-on-pages standard)
    try {
        const cfCtx = getCloudflareContext();
        if (cfCtx?.env && Object.keys(cfCtx.env).length > 0) {
            return cfCtx.env;
        }
    } catch (e) { }

    // 2. Try standard process.env (Next.js polyfill)
    if (typeof process !== "undefined" && process.env && Object.keys(process.env).length > 0) {
        return process.env;
    }

    // 3. Try globalThis properties (Edge runtime)
    if (g.process?.env) return g.process.env;
    if (g.__env__) return g.__env__;
    if (g.env) return g.env;

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
