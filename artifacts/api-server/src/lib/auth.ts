import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import { createClient } from '@supabase/supabase-js';

const SESSION_KEY = "carcare_session";

// إعداد Supabase Client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

// ملاحظة: ما عدنا نحتاج hashPassword و verifyPassword لأن سوبا بيس بتتكفل فيهم
// بس رح نخليهم كـ Empty functions إذا الكود بطلبهم في مكان تاني عشان ما يعطي Error

export function setSession(res: Response, userId: number, role: string): void {
  const sessionData = Buffer.from(JSON.stringify({ userId, role, ts: Date.now() })).toString("base64");
  res.cookie(SESSION_KEY, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
  });
}

export function clearSession(res: Response): void {
  res.clearCookie(SESSION_KEY);
}

export function getSessionData(req: Request): { userId: number; role: string } | null {
  try {
    const cookie = req.cookies?.[SESSION_KEY];
    if (!cookie) return null;
    const data = JSON.parse(Buffer.from(cookie, "base64").toString("utf-8"));
    if (!data.userId || !data.role) return null;
    return { userId: data.userId, role: data.role };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = getSessionData(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    // إحضار بيانات المستخدم من داتابيز سوبا بيس (PostgreSQL) باستخدام Drizzle
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    (req as any).user = user;
    next();
  } catch (err) {
    logger.error({ err }, "Auth middleware error");
    res.status(500).json({ error: "Internal server error" });
  }
}

export type AuthRequest = Request & { user: { id: number; email: string; name: string | null; role: string } };
