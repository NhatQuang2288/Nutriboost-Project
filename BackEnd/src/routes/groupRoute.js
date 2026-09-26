import express from "express";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { createGroup, getGroupMembers, getMyGroup } from "../controllers/groupController.js";


const router = express.Router();

router.post("/",protectedRoute,createGroup);
router.get("/",protectedRoute,getMyGroup);
router.get("/",protectedRoute,getGroupMembers);

export default router ;