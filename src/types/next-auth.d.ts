import "next-auth";
import { DefaultSession } from "next-auth";
import { User as UserType } from "@/types/user";

declare module "next-auth" {
  interface JWT {
    user?: {
      uuid?: string;
      nickname?: string;
      avatar_url?: string;
      created_at?: string;
    };
  }

  interface Session {
    user: {
      uuid?: string;
      nickname?: string;
      avatar_url?: string;
      created_at?: string;
    } & DefaultSession["user"];
  }

  interface User {
    userInfo?: UserType; // 添加用户信息字段，用于在callbacks间传递数据
  }
}
