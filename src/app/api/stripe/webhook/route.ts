import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Stripe } from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (userId) {
        await (supabase.from("perfiles") as any)
          .update({ rol: "premium" })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      if (customer.email) {
        // Find user by email and downgrade
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email === customer.email);
        if (user) {
          await (supabase.from("perfiles") as any)
            .update({ rol: "usuario" })
            .eq("id", user.id);
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
      if (customer.email) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email === customer.email);
        if (user) {
          await (supabase.from("perfiles") as any)
            .update({ rol: "usuario" })
            .eq("id", user.id);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
