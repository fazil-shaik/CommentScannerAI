import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export async function getOrCreateUserId(email: string, name?: string | null): Promise<number> {
  const existingUsers = await db.select().from(users).where(eq(users.email, email));
  if (existingUsers.length > 0) {
    return existingUsers[0].id;
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      name: name || email.split("@")[0],
    })
    .returning();

  return newUser.id;
}
