import { supabase } from "../libs/supabase.js";
import { customAlphabet } from "nanoid";

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);
const TRANSACTION_TTL = 15 * 60 * 1000; 

export const createPayment = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { planId } = req.body; 

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .maybeSingle();

    if (planError) throw planError;
    if (!plan) {
      return res.status(400).json({ message: "Gói dịch vụ không tồn tại" });
    }

    const transactionCode = `NUT${generateCode()}`; 

    const { data: transaction, error } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        amount: plan.price,              
        transaction_code: transactionCode,
        status: "pending",
        expires_at: new Date(Date.now() + TRANSACTION_TTL).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const qrUrl = buildVietQrUrl({
      amount: plan.price,
      addInfo: transactionCode,
    });

    return res.status(201).json({
      transactionCode,
      amount: plan.price,
      qrUrl,
      expiresAt: transaction.expires_at,
    });
  } catch (error) {
    console.error("Fail createPayment", error);
    return res.status(500).json({ message: "System Error" });
  }
};

function buildVietQrUrl({ amount, addInfo }) {
  const BANK_BIN = process.env.BANK_BIN;         
  const ACCOUNT_NO = process.env.BANK_ACCOUNT_NO;
  const ACCOUNT_NAME = encodeURIComponent(process.env.BANK_ACCOUNT_NAME);
  return `https://img.vietqr.io/image/${BANK_BIN}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${ACCOUNT_NAME}`;
}

export const getPaymentStatus = async (req, res) => {
  try {
    const { code } = req.params;
    const { data: transaction } = await supabase
      .from("transactions")
      .select("status, plan_id, paid_at")
      .eq("transaction_code", code)
      .maybeSingle();

    if (!transaction) return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    return res.status(200).json(transaction);
  } catch (error) {
    return res.status(500).json({ message: "System Error" });
  }
};