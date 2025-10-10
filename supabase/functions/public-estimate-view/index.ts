import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    const url = new URL(req.url);
    const estimateId = url.searchParams.get("id");

    if (!estimateId) {
        return new Response("Missing estimate ID", { status: 400 });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: estimate, error } = await supabase
            .from("estimates")
            .select(
                `
        *,
        companies (*),
        clients (*),
        estimate_items (*)
      `
            )
            .eq("id", estimateId)
            .single();

        if (error) throw error;

        // return pdf url if it exists, if not generate html view
        if (estimate.pdf_url) {
            return Response.redirect(estimate.pdf_url);
        }

        // simple html view
        return new Response(
            `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Estimate #${estimate.estimate_number}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h1>Estimate #${estimate.estimate_number}</h1>
          <p>View functionality coming soon!</p>
          <p>Total: $${estimate.total}</p>
        </body>
        </html>
      `,
            { headers: { "Content-Type": "text/html" } }
        );
    } catch (error: any) {
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
});
