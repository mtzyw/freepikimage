import { AdapterUser } from "next-auth/adapters";
import { Account, User } from "next-auth";
import { getUuid } from "@/lib/hash";
import { getIsoTimestr } from "@/lib/time";
import { saveUser } from "@/services/user";
import { User as UserType } from "@/types/user";
import { getClientIp } from "@/lib/ip";

export async function handleSignInUser(
  user: User | AdapterUser,
  account: Account,
  clientIp?: string
): Promise<UserType | null> {
  try {
    if (!user.email) {
      throw new Error("invalid signin user");
    }
    if (!account.type || !account.provider || !account.providerAccountId) {
      throw new Error("invalid signin account");
    }

    // 在 NextAuth callbacks 中使用 fallback IP
    const ip = clientIp || await getClientIp("unknown");

    const userInfo: UserType = {
      uuid: getUuid(),
      email: user.email,
      nickname: user.name || "",
      avatar_url: user.image || "",
      signin_type: account.type,
      signin_provider: account.provider,
      signin_openid: account.providerAccountId,
      created_at: new Date(),
      signin_ip: ip,
    };

    const savedUser = await saveUser(userInfo);

    return savedUser;
  } catch (e) {
    console.error("handle signin user failed:", e);
    throw e;
  }
}
