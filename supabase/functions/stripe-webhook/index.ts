import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") as string;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Simple HMAC verification without Stripe SDK
async function verifyStripeSignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );

    // Extract timestamp and signature from header
    const parts = signature.split(",");
    let timestamp = "";
    let sig = "";

    for (const part of parts) {
        const [key, value] = part.split("=");
        if (key === "t") timestamp = value;
        if (key === "v1") sig = value;
    }

    // Construct the signed payload
    const signedPayload = `${timestamp}.${payload}`;

    // Convert signature from hex to bytes
    const signatureBytes = new Uint8Array(
        sig.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );

    return await crypto.subtle.verify(
        "HMAC",
        key,
        signatureBytes,
        encoder.encode(signedPayload)
    );
}

// Helper function to update estimate
async function updateEstimate(estimateId: string, paymentIntentId: string) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
        .from("estimates")
        .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            payment_intent_id: paymentIntentId,
        })
        .eq("id", estimateId)
        .select();

    if (error) {
        console.error("Error updating estimate:", error);
        throw error;
    }

    console.log(`Estimate ${estimateId} marked as paid:`, data);
    return data;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const signature = req.headers.get("stripe-signature");

        if (!signature) {
            return new Response(
                JSON.stringify({ error: "No signature provided" }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const body = await req.text();

        // Verify signature
        const isValid = await verifyStripeSignature(
            body,
            signature,
            webhookSecret
        );

        if (!isValid) {
            console.error("Invalid signature");
            return new Response(
                JSON.stringify({ error: "Invalid signature" }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Parse the event
        const event = JSON.parse(body);

        console.log("Received event:", event.type);

        // Handle payment_intent.succeeded event
        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;
            const estimateId = paymentIntent.metadata?.estimateId; // Use camelCase

            console.log("Payment intent succeeded:", paymentIntent.id);
            console.log("Estimate ID from metadata:", estimateId);

            if (estimateId) {
                await updateEstimate(estimateId, paymentIntent.id);
            } else {
                console.log("No estimateId in payment intent metadata");
            }
        }

        // Handle checkout.session.completed event
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const estimateId = session.metadata?.estimateId; // Use camelCase

            console.log("Checkout session completed:", session.id);
            console.log("Estimate ID from metadata:", estimateId);

            if (estimateId) {
                const paymentIntentId =
                    typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : session.payment_intent?.id || session.id;

                await updateEstimate(estimateId, paymentIntentId);
            } else {
                console.log("No estimateId in session metadata");
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Webhook error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
