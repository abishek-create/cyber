import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, fullName?: string, phone?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid));
    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db.insert(users)
      .values({
        uid,
        email,
        fullName: fullName || email.split('@')[0],
        phone: phone || '',
        role: email.includes('admin') ? 'admin' : 'user',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(fullName ? { fullName } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to get or create user:', error);
    throw new Error('Database user lookup failed', { cause: error });
  }
}
