import {
  findCreditByOrderNo,
  getUserValidCredits,
  insertCredit,
} from "@/models/credit";
import { credits as creditsTable } from "@/db/schema";
import { getIsoTimestr } from "@/lib/time";
import { getSnowId } from "@/lib/hash";
import { Order } from "@/types/order";
import { UserCredits } from "@/types/user";
import { getFirstPaidOrderByUserUuid } from "@/models/order";

export enum CreditsTransType {
  NewUser = "new_user", // initial credits for new user
  OrderPay = "order_pay", // user pay for credits
  SystemAdd = "system_add", // system add credits
  Ping = "ping", // cost for ping api
  IconGeneration = "icon_generation", // cost for icon generation
}

export enum CreditsAmount {
  NewUserGet = 10,
  PingCost = 1,
}

export async function getUserCredits(user_uuid: string): Promise<UserCredits> {
  let user_credits: UserCredits = {
    left_credits: 0,
  };

  try {
    const first_paid_order = await getFirstPaidOrderByUserUuid(user_uuid);
    if (first_paid_order) {
      user_credits.is_recharged = true;
    }

    const credits = await getUserValidCredits(user_uuid);
    if (credits) {
      credits.forEach((v) => {
        user_credits.left_credits += v.credits || 0;
      });
    }

    if (user_credits.left_credits < 0) {
      user_credits.left_credits = 0;
    }

    if (user_credits.left_credits > 0) {
      user_credits.is_pro = true;
    }

    return user_credits;
  } catch (e) {
    console.log("get user credits failed: ", e);
    return user_credits;
  }
}

export async function decreaseCredits({
  user_uuid,
  trans_type,
  credits,
}: {
  user_uuid: string;
  trans_type: CreditsTransType;
  credits: number;
}) {
  const MAX_RETRIES = 3;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      let order_no = "";
      let expired_at = "";
      let left_credits = 0;

      const userCredits = await getUserValidCredits(user_uuid);
      if (userCredits) {
        for (let i = 0, l = userCredits.length; i < l; i++) {
          const credit = userCredits[i];
          left_credits += credit.credits;

          // credit enough for cost
          if (left_credits >= credits) {
            order_no = credit.order_no || "";
            expired_at = credit.expired_at?.toISOString() || "";
            break;
          }

          // look for next credit
        }
      }

      const new_credit: typeof creditsTable.$inferInsert = {
        trans_no: getSnowId(),
        created_at: new Date(getIsoTimestr()),
        expired_at: new Date(expired_at),
        user_uuid: user_uuid,
        trans_type: trans_type,
        credits: 0 - credits,
        order_no: order_no,
      };
      
      await insertCredit(new_credit);
      
      // 成功则跳出循环
      break;
      
    } catch (e: any) {
      console.log(`decrease credits failed (attempt ${retryCount + 1}):`, e);
      
      // 检查是否是唯一约束冲突
      if (e.cause?.code === '23505' && e.cause?.constraint_name === 'credits_trans_no_unique') {
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          // 短暂延迟后重试，避免立即冲突
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
          console.log(`Retrying decrease credits (${retryCount}/${MAX_RETRIES})`);
          continue;
        }
      }
      
      // 非唯一约束错误或达到最大重试次数，直接抛出
      throw e;
    }
  }
}

export async function increaseCredits({
  user_uuid,
  trans_type,
  credits,
  expired_at,
  order_no,
}: {
  user_uuid: string;
  trans_type: string;
  credits: number;
  expired_at?: string;
  order_no?: string;
}) {
  const MAX_RETRIES = 3;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      const new_credit: typeof creditsTable.$inferInsert = {
        trans_no: getSnowId(),
        created_at: new Date(getIsoTimestr()),
        user_uuid: user_uuid,
        trans_type: trans_type,
        credits: credits,
        order_no: order_no || "",
        expired_at: expired_at ? new Date(expired_at) : null,
      };
      
      await insertCredit(new_credit);
      
      // 成功则跳出循环
      break;
      
    } catch (e: any) {
      console.log(`increase credits failed (attempt ${retryCount + 1}):`, e);
      
      // 检查是否是唯一约束冲突
      if (e.cause?.code === '23505' && e.cause?.constraint_name === 'credits_trans_no_unique') {
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          // 短暂延迟后重试，避免立即冲突
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
          console.log(`Retrying increase credits (${retryCount}/${MAX_RETRIES})`);
          continue;
        }
      }
      
      // 非唯一约束错误或达到最大重试次数，直接抛出
      throw e;
    }
  }
}

export async function updateCreditForOrder(order: Order) {
  try {
    const credit = await findCreditByOrderNo(order.order_no);
    if (credit) {
      // order already increased credit
      return;
    }

    await increaseCredits({
      user_uuid: order.user_uuid,
      trans_type: CreditsTransType.OrderPay,
      credits: order.credits,
      expired_at: order.expired_at,
      order_no: order.order_no,
    });
  } catch (e) {
    console.log("update credit for order failed: ", e);
    throw e;
  }
}
