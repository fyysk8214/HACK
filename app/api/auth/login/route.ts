import { handleLogin } from "@/lib/demo-auth.mjs";

export async function POST(request: Request) {
  return handleLogin(request);
}
