import { headers } from "next/headers";

export async function getClientIp(fallbackIp?: string): Promise<string> {
  try {
    const h = await headers();

    const ip =
      h.get("cf-connecting-ip") || // Cloudflare IP
      h.get("x-real-ip") || // Vercel or other reverse proxies
      (h.get("x-forwarded-for") || "127.0.0.1").split(",")[0]; // Standard header

    return ip;
  } catch (error) {
    // 在 NextAuth callbacks 中 headers() 不可用
    // 返回fallback IP或默认值
    console.warn("getClientIp: headers() not available in this context, using fallback");
    return fallbackIp || "127.0.0.1";
  }
}

// 普通函数版本，用于非Server Action context
export function getClientIpFromRequest(request?: Request): string {
  if (!request) {
    return "127.0.0.1";
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  return (
    cfConnectingIp ||
    realIp ||
    (forwarded ? forwarded.split(",")[0] : "127.0.0.1")
  );
}
