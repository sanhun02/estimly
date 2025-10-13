import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
    const url = new URL(req.url);
    const estimateId = url.searchParams.get("id");

    if (!estimateId) {
        return new Response("Missing estimate ID", {
            status: 400,
        });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

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

        if (error) {
            console.error("Database error:", error);
            throw error;
        }

        const html = generatePublicEstimateHTML(estimate);
        return new Response(html, {
            status: 200,
            headers: {
                "content-type": "text/html; charset=utf-8",
            },
        });
    } catch (error: any) {
        console.error("Function error:", error);
        return new Response(`Error loading estimate: ${error.message}`, {
            status: 500,
        });
    }
});

function generatePublicEstimateHTML(estimate: any): string {
    const company = estimate.companies;
    const client = estimate.clients;
    const items = estimate.estimate_items;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Estimate #${estimate.estimate_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding: 20px;
          background: #f9fafb;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .estimate-number {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
        }
        h1 { color: #111827; margin-bottom: 20px; }
        .total {
          font-size: 36px;
          font-weight: bold;
          color: #2563eb;
          margin: 20px 0;
        }
        .accept-button {
          display: inline-block;
          background: #2563eb;
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 20px;
        }
        .accept-button:hover {
          background: #1d4ed8;
        }
        table {
          width: 100%;
          margin: 30px 0;
          border-collapse: collapse;
        }
        th {
          background: #f9fafb;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #e5e7eb;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #f3f4f6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${company.name}</h1>
          <div class="estimate-number">#${estimate.estimate_number}</div>
        </div>

        <h2>Estimate for ${client.name}</h2>
        <div class="total">${formatCurrency(estimate.total)}</div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items
                .map(
                    (item: any) => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align: right;">
                  ${formatCurrency((item.quantity ?? 0) * (item.unit_price ?? 0) + (item.labor_hours ?? 0) * (item.labor_rate ?? 0))}
                </td>
              </tr>
            `
                )
                .join("")}
          </tbody>
        </table>

        ${
            estimate.deposit_amount > 0
                ? `
          <p><strong>Deposit Required:</strong> ${formatCurrency(estimate.deposit_amount)} (${estimate.deposit_percent}%)</p>
        `
                : ""
        }

        <div style="text-align: center; margin-top: 40px;">
          <a href="#" class="accept-button" onclick="alert('Accept functionality coming soon!'); return false;">
            Accept & Sign Estimate
          </a>
        </div>

        ${estimate.notes ? `<div style="margin-top: 30px;"><strong>Notes:</strong><p>${estimate.notes}</p></div>` : ""}
        ${estimate.terms ? `<div style="margin-top: 20px;"><strong>Terms:</strong><p>${estimate.terms}</p></div>` : ""}
      </div>
    </body>
    </html>
  `;
}
