import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, setSession, clearSession, getSessionData } from "../lib/auth";

const router: IRouter = Router();

router.get("/auth/session", async (req, res): Promise<void> => {
  const session = getSessionData(req);
  if (!session) {
    res.json({ isAuthenticated: false });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
    if (!user) {
      res.json({ isAuthenticated: false });
      return;
    }
    res.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Session check error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, name, role } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      email,
      passwordHash,
      name: name || null,
      role: role === "garage_owner" ? "garage_owner" : "user",
    }).returning();
    setSession(res, user.id, user.role);
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    setSession(res, user.id, user.role);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res): void => {
  clearSession(res);
  res.json({ ok: true });
});

export default router;
