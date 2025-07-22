import { z } from 'zod';
import { userSchema, userInfoSchema } from '@/lib/schemas';

export type SystemUser = z.infer<typeof userSchema>;
export type UserInfo = z.infer<typeof userInfoSchema>;
