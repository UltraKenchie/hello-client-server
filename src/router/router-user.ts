import { Router } from "express";
import {
    findUsers,
    login,
    createUser,
    updateProfile,
    deleteUser,
    findUserById
} from "../controllers/user-controller";
import passport from "passport";

const router: Router = Router();

router.get("/", passport.authenticate("jwt"), findUsers);
router.get("/:id", passport.authenticate("jwt"), findUserById);

router.post("/", passport.authenticate("jwt"), createUser);
router.post("/login", login);

router.put("/:id", passport.authenticate("jwt"), updateProfile);

router.delete("/:id", passport.authenticate("jwt"), deleteUser);

export default router;
