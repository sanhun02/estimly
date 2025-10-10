import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // handle cors
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { estimateId } = await req.json();

        // initialize supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // fetch estimate with all related data
        const { data: estimate, error: estimateError } = await supabase
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

        if (estimateError) throw estimateError;

        // generate HTML
        const html = generateEstimateHTML(estimate);

        // For MVP, we'll just save the HTML and return a URL

        // For now, store the HTML as a simple preview
        const fileName = `estimate-${estimate.estimate_number}.html`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("pdfs")
            .upload(fileName, html, {
                contentType: "text/html",
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from("pdfs").getPublicUrl(fileName);

        // update estimate with PDF URL
        await supabase
            .from("estimates")
            .update({ pdf_url: publicUrl })
            .eq("id", estimateId);

        return new Response(
            JSON.stringify({ success: true, pdfUrl: publicUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

function generateEstimateHTML(estimate: any): string {
    const company = estimate.companies;
    const client = estimate.clients;
    const items = estimate.estimate_items;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
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
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          background: #f9fafb;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .company-info h1 {
          font-size: 24px;
          color: #111827;
          margin-bottom: 8px;
        }
        .company-info p {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
        }
        .estimate-info {
          text-align: right;
        }
        .estimate-number {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 8px;
        }
        .estimate-date {
          color: #6b7280;
          font-size: 14px;
        }
        .client-section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .client-name {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }
        .client-details {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
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
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #e5e7eb;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #f3f4f6;
          color: #111827;
          font-size: 14px;
        }
        .item-description {
          font-weight: 500;
        }
        .item-details {
          color: #6b7280;
          font-size: 13px;
          margin-top: 4px;
        }
        .text-right {
          text-align: right;
        }
        .totals {
          margin-left: auto;
          width: 300px;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }
        .total-row.subtotal {
          color: #6b7280;
        }
        .total-row.tax {
          color: #6b7280;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-row.grand-total {
          font-size: 18px;
          font-weight: bold;
          color: #111827;
          padding-top: 12px;
        }
        .total-row.grand-total .amount {
          color: #2563eb;
        }
        .total-row.deposit {
          color: #059669;
          font-weight: 600;
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .notes-section {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #e5e7eb;
        }
        .notes-content {
          background: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          color: #374151;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <h1>${company.name}</h1>
            ${company.address ? `<p>${company.address}</p>` : ""}
            ${company.phone ? `<p>${company.phone}</p>` : ""}
            ${company.email ? `<p>${company.email}</p>` : ""}
          </div>
          <div class="estimate-info">
            <div class="estimate-number">#${estimate.estimate_number}</div>
            <div class="estimate-date">${formatDate(estimate.created_at)}</div>
          </div>
        </div>

        <div class="client-section">
          <div class="section-title">Bill To</div>
          <div class="client-name">${client.name}</div>
          <div class="client-details">
            ${client.email ? `<div>${client.email}</div>` : ""}
            ${client.phone ? `<div>${client.phone}</div>` : ""}
            ${client.address ? `<div>${client.address}</div>` : ""}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items
                .map((item: any) => {
                    const lineTotal =
                        item.quantity * item.unit_price +
                        item.labor_hours * item.labor_rate;
                    return `
                <tr>
                  <td>
                    <div class="item-description">${item.description}</div>
                    <div class="item-details">
                      ${item.quantity > 0 && item.unit_price > 0 ? `${item.quantity} × ${formatCurrency(item.unit_price)}` : ""}
                      ${item.labor_hours > 0 && item.labor_rate > 0 ? `${item.labor_hours} hrs × ${formatCurrency(item.labor_rate)}/hr` : ""}
                    </div>
                  </td>
                  <td class="text-right">${item.quantity || "-"}</td>
                  <td class="text-right">${item.unit_price > 0 ? formatCurrency(item.unit_price) : formatCurrency(item.labor_rate)}</td>
                  <td class="text-right">${formatCurrency(lineTotal)}</td>
                </tr>
              `;
                })
                .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row subtotal">
            <span>Subtotal</span>
            <span>${formatCurrency(estimate.subtotal)}</span>
          </div>
          <div class="total-row tax">
            <span>Tax</span>
            <span>${formatCurrency(estimate.tax)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total</span>
            <span class="amount">${formatCurrency(estimate.total)}</span>
          </div>
          ${
              estimate.deposit_amount > 0
                  ? `
            <div class="total-row deposit">
              <span>Deposit Required (${estimate.deposit_percent}%)</span>
              <span>${formatCurrency(estimate.deposit_amount)}</span>
            </div>
          `
                  : ""
          }
        </div>

        ${
            estimate.notes
                ? `
          <div class="notes-section">
            <div class="section-title">Notes</div>
            <div class="notes-content">${estimate.notes}</div>
          </div>
        `
                : ""
        }

        ${
            estimate.terms
                ? `
          <div class="notes-section">
            <div class="section-title">Terms & Conditions</div>
            <div class="notes-content">${estimate.terms}</div>
          </div>
        `
                : ""
        }

        <div class="footer">
          Created with Estimly
        </div>
      </div>
    </body>
    </html>
  `;
}
