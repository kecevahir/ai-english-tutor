"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { createLearnerAccount } from "@/lib/database/repositories/userRepository";
import { withBasePath } from "@/lib/basePath";

export type AuthFormState = {
  error?: string;
  ok?: boolean;
};

export async function logoutAction() {
  await signOut({ redirectTo: withBasePath("/login") });
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return { error: "Kullanıcı adı ve şifre gerekli." };
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: withBasePath("/dashboard"),
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Kullanıcı adı veya şifre hatalı." };
    }
    throw err;
  }
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("displayName") || "").trim();

  try {
    await createLearnerAccount({ username, password, displayName });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Kayıt başarısız.",
    };
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: withBasePath("/assessment"),
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error: "Hesap oluştu ama giriş yapılamadı. Giriş sayfasını dene.",
      };
    }
    throw err;
  }
}
