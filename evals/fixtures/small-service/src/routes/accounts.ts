import { Router } from "express";
import { getAccount, listAccounts } from "../services/accounts";

export const accountsRouter = Router();

accountsRouter.get("/", async (_req, res) => {
  res.json(await listAccounts());
});

accountsRouter.get("/:id", async (req, res) => {
  const account = await getAccount(req.params.id);
  if (!account) return res.status(404).json({ error: "not found" });
  res.json(account);
});
