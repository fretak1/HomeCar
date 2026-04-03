import { auth } from "../lib/auth.js";
import { toNodeHandler } from "better-auth/node";
import express from "express";

const authRouter = express.Router();

authRouter.all("*", toNodeHandler(auth));

export default authRouter;
