import { handleAuth } from "@/lib/demo-auth.mjs";

export async function POST(request: Request) {
  return handleAuth(request, "register");
}
