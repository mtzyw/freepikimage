-- 修复积分记录的有效期问题
-- 将所有 expired_at 为 null 且 trans_type 为 'system_add' 的记录设置1年有效期

UPDATE credits 
SET expired_at = NOW() + INTERVAL '1 year'
WHERE expired_at IS NULL 
  AND trans_type = 'system_add';

-- 查看修复后的结果
SELECT trans_no, trans_type, credits, expired_at, created_at
FROM credits 
WHERE user_uuid = 'b31fa9b8-535c-47de-a245-1953e845794b'
ORDER BY created_at DESC;