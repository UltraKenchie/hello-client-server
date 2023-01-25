import { Router } from "express";
import passport from "passport";
import {
    createClient,
    findClients,
    findClientById,
    updateClient,
    deleteClient
} from "../controllers/client-controller";

const router: Router = Router();

router.get("/", passport.authenticate("jwt"), findClients);
router.get("/:id", passport.authenticate("jwt"), findClientById);

router.post("/", passport.authenticate("jwt"), createClient);

router.put("/:id", passport.authenticate("jwt"), updateClient);

router.delete("/:id", passport.authenticate("jwt"), deleteClient);

export default router;
