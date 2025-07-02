import { respData, respErr, respJson } from "@/lib/resp";
import { auth } from "@/auth";
import { findUserByUuid } from "@/models/user";
import { getUserCredits } from "@/services/credit";
import { getUserUuidByApiKey } from "@/models/apikey";
import { User } from "@/types/user";

export async function POST(req: Request) {
  try {
    // 获取用户UUID - 修复headers使用问题
    let user_uuid = "";
    
    // 检查Authorization header
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      if (token.startsWith("sk-")) {
        user_uuid = await getUserUuidByApiKey(token) || "";
      }
    }
    
    // 如果没有API key，尝试session
    if (!user_uuid) {
      const session = await auth();
      if (session?.user?.uuid) {
        user_uuid = session.user.uuid;
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
