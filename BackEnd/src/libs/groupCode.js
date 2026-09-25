import crypto from "crypto";

export const generateGroupCode = () => {
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `NT-${random}`;
}