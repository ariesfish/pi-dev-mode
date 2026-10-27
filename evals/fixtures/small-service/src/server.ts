import express from "express";
import { accountsRouter } from "./routes/accounts";

export const app = express();
app.use(express.json());
app.use("/accounts", accountsRouter);

if (process.env.NODE_ENV !== "test") app.listen(8080, () => console.log("accounts-api on :8080"));
