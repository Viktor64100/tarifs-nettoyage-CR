import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rafraîchit la session et protège les routes de l'app.
export async function updateSession(request: NextRequest) {
  // Les routes API gèrent leur propre authentification (getUser() + 401 JSON,
  // ou signature Stripe pour le webhook). Une redirection ici casserait le
  // webhook Stripe (appelé sans cookie de session).
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/signup";
  // /reset-password reste accessible avec une session "recovery" (issue du lien mail) :
  // elle est déjà couverte par `user` non nul, donc pas besoin de la lister ici.
  const isPublic = isAuthPage || path === "/" || path === "/forgot-password";

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Gating fin d'essai : si l'abonnement n'est pas actif et que l'essai est
  // dépassé, on bloque tout sauf la page de facturation elle-même.
  if (user && !isPublic && path !== "/billing") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, trial_ends_at")
      .eq("id", user.id)
      .single();
    const trialExpired =
      !!profile && profile.plan !== "active" && new Date(profile.trial_ends_at).getTime() < Date.now();
    if (trialExpired) {
      return NextResponse.redirect(new URL("/billing", request.url));
    }
  }

  return response;
}
