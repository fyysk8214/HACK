export function initDatabase(): unknown;
export function handleLogin(request: Request): Promise<Response>;
export function addPracticeAccount(username: string, password: string): Promise<boolean>;
