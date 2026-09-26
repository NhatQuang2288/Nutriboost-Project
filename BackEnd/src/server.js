import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import groupRoute from "./routes/groupRoute.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/groups",groupRoute);

app.use((req, res) => {
    res.status(404).json({ message: "Khong tim thay endpoint" });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "System Error" });
});

app.listen(PORT, () => {
    console.log(`Server run success in gate ${PORT}`);
});