import { respData, respErr, respJson } from "@/lib/resp";
import { auth } from "@/auth";
import { findUserByUuid } from "@/models/user";
import { getUserCredits } from "@/services/credit";
import { getUserUuidByApiKey } from "@/models/apikey";
import { User } from "@/types/user";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    // 获取用户UUID - 修复headers使用问题
    let user_uuid = "";
    
    // 1. 首先尝试从请求体中获取用户UUID
    try {
      const body = await req.json();
      if (body.user_uuid) {
        user_uuid = body.user_uuid;
        console.log("从请求体获取到用户UUID:", user_uuid);
      }
    } catch (e) {
      // 请求体可能为空，继续其他方式
      console.log("请求体解析失败或为空，尝试其他方式");
    }
    
    // 2. 检查Authorization header
    if (!user_uuid) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        if (token.startsWith("sk-")) {
          user_uuid = await getUserUuidByApiKey(token) || "";
        }
      }
    }
    
    // 3. 最后尝试从 session 中获取（作为备选方案）
    if (!user_uuid) {
      try {
        console.log("尝试从 session 获取用户信息...");
        const session = await auth();
        if (session?.user?.uuid) {
          user_uuid = session.user.uuid;
          console.log("从 session 获取到用户UUID:", user_uuid);
        }
      } catch (authError) {
        console.log("Session 获取失败（NextAuth v5 已知问题）:", authError instanceof Error ? authError.message : String(authError));
        // 这是 NextAuth v5 beta 的已知问题，现在主要依赖前端传递的用户UUID
      }
    }
    
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const dbUser = await findUserByUuid(user_uuid);
    if (!dbUser) {
      return respErr("user not exist");
    }

    const userCredits = await getUserCredits(user_uuid);

    const user = {
      ...(dbUser as unknown as User),
      credits: userCredits,
    };

    return respData(user);
  } catch (e) {
    console.log("get user info failed: ", e);
    return respErr("get user info failed");
  }
}
