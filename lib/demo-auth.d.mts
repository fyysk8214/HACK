export function initDatabase(): unknown;
export function handleAuth(request: Request, action: "register" | "login"): Promise<Response>;
