import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { estimateId } = await req.json();

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sendgridKey = Deno.env.get("SENDGRID_API_KEY")!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch estimate with relations
        const { data: estimate, error } = await supabase
            .from("estimates")
            .select(
                `
        *,
        companies (*),
        clients (*)
      `
            )
            .eq("id", estimateId)
            .single();

        if (error) throw error;

        const company = estimate.companies;
        const client = estimate.clients;

        if (!client.email) {
            throw new Error("Client has no email address");
        }

        // create public view URL
        const publicUrl = `https://estimate-viewer.vercel.app/estimate/${estimateId}`;

        // send email via SendGrid
        const emailData = {
            personalizations: [
                {
                    to: [{ email: client.email, name: client.name }],
                    subject: `Estimate #${estimate.estimate_number} from ${company.name}`,
                },
            ],
            from: {
                email: "sanyahhunter@gmail.com",
                name: company.name,
            },
            content: [
                {
                    type: "text/html",
                    value: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Estimate from ${company.name}</h2>
      <p>Hi ${client.name},</p>
      <p>Please review your estimate for the upcoming project.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Estimate #${estimate.estimate_number}</h3>
        <p style="font-size: 24px; font-weight: bold; color: #2563eb; margin: 10px 0;">
          $${estimate.total.toFixed(2)}
        </p>
        ${
            estimate.deposit_amount > 0
                ? `
          <p style="color: #059669;">
            Deposit Required: $${estimate.deposit_amount.toFixed(2)}
          </p>
        `
                : ""
        }
      </div>

      <a href="${publicUrl}" 
         target="_blank"
         rel="noopener noreferrer"
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View & Accept Estimate
      </a>

      ${
          estimate.pdf_url
              ? `
        <p style="margin-top: 20px;">
          <a href="${estimate.pdf_url}" target="_blank" style="color: #2563eb;">Download PDF</a>
        </p>
      `
              : ""
      }

      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${publicUrl}" style="color: #2563eb;">${publicUrl}</a>
      </p>

      <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
        If you have any questions, please contact us at ${company.email || company.phone}
      </p>
    </div>
  `,
                },
            ],
        };

        const sendgridResponse = await fetch(
            "https://api.sendgrid.com/v3/mail/send",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${sendgridKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(emailData),
            }
        );

        if (!sendgridResponse.ok) {
            const error = await sendgridResponse.text();
            throw new Error(`SendGrid error: ${error}`);
        }

        // update estimate status
        await supabase
            .from("estimates")
            .update({ status: "sent" })
            .eq("id", estimateId);

        return new Response(
            JSON.stringify({
                success: true,
                message: "Email sent successfully",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
