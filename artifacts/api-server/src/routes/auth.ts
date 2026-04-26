import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { supabase, setSession, clearSession, getSessionData } from "../lib/auth";

const router: IRouter = Router();

// 1. فحص الجلسة (Session Check) - يبقى كما هو لأنه يعتمد على الكوكيز الخاصة بك
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
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. التسجيل (Register) - يستخدم Supabase للـ Auth ثم يخزن في جدولك
router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, name, role } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  try {
    // التحقق من وجود المستخدم في جدولنا أولاً
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }

    // أ. تسجيل المستخدم في Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      res.status(400).json({ error: authError.message });
      return;
    }

    // ب. إضافة المستخدم لجدول PostgreSQL الخاص بنا (بدون تخزين الباسورد لأنه صار عند سوبا)
    const [user] = await db.insert(usersTable).values({
      email,
      name: name || null,
      role: role === "garage_owner" ? "garage_owner" : "user",
    }).returning();

    setSession(res, user.id, user.role);
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    res.status(500).json({ error: "Register error" });
  }
});

// 3. تسجيل الدخول (Login) - يستخدم Supabase للتحقق
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  try {
    // أ. التحقق عن طريق Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // ب. جلب بيانات المستخدم المرتبطة بالإيميل من جدولنا
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) {
      res.status(401).json({ error: "User not found in database" });
      return;
    }

    setSession(res, user.id, user.role);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    res.status(500).json({ error: "Login error" });
  }
});

// 4. تسجيل الخروج (Logout)
router.post("/auth/logout", async (req, res) => {
  await supabase.auth.signOut();
  clearSession(res);
  res.json({ ok: true });
});

export default router;
