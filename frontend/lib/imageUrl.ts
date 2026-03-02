/**
 * Resolves a profile picture path to a full URL.
 *
 * - If the path already starts with http/https → return as-is (external URL).
 * - If it starts with /uploads/ → prepend the backend server base URL.
 * - If it starts with file:// or content:// → it's a local URI (e.g. just picked, not yet saved) → return as-is.
 * - Empty / null → return undefined so Image components hide gracefully.
 */
const SERVER_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

export function getImageUrl(path: string | null | undefined): string | undefined {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('file://') || path.startsWith('content://') || path.startsWith('data:')) return path;
    if (path.startsWith('/')) return `${SERVER_BASE}${path}`;
    return path;
}
