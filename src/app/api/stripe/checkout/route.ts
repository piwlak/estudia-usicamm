import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const planKey = body.plan as keyof typeof PLANS;

  if (!PLANS[planKey]) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }

  const plan = PLANS[planKey];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: user.email,
    metadata: {
      user_id: user.id,
      plan: planKey,
    },
    line_items: [
      {
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: {
            name: `Estudia USICAMM — ${plan.name}`,
            description: "Acceso premium a todas las herramientas de estudio",
          },
          unit_amount: plan.price * 100,
          recurring: {
            interval: plan.interval,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/premium/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/premium`,
  });

  return NextResponse.json({ url: session.url });
}
