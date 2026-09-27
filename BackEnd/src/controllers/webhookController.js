import { supabase } from "../libs/supabase.js";

export const sepayWebhook = async (req, res) => {
  try {
    const apiKey = req.headers["authorization"];
    if (apiKey !== `Apikey ${process.env.SEPAY_API_KEY}`) {
      return res.sendStatus(401);
    }

    const { content, transferAmount, transferType } = req.body;

    if (transferType !== "in") return res.sendStatus(200);

    const match = content?.match(/NUT[A-Z0-9]{10}/);
    if (!match) return res.sendStatus(200); 

    const transactionCode = match[0];

    const { data: transaction } = await supabase
      .from("transactions")
      .select("*")
      .eq("transaction_code", transactionCode)
      .maybeSingle();

    if (!transaction) return res.sendStatus(200);
    if (transaction.status !== "pending") return res.sendStatus(200); // tránh xử lý trùng (idempotency)

    if (Number(transferAmount) !== transaction.amount) {
      console.warn(`Số tiền không khớp: nhận ${transferAmount}, cần ${transaction.amount}`);
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transaction.id);
      return res.sendStatus(200);
    }

    await supabase
      .from("transactions")
      .update({ status: "success", paid_at: new Date().toISOString() })
      .eq("id", transaction.id);

    const { data: plan } = await supabase
      .from("plans")
      .select("*")
      .eq("id", transaction.plan_id)
      .single();

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    await supabase
      .from("users")
      .update({
        current_plan: plan.id,
        subscription_start: startDate.toISOString(),
        subscription_end: endDate.toISOString(),
      })
      .eq("id", transaction.user_id);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Fail sepayWebhook", error);
    return res.sendStatus(500);
  }
};