import { Router } from "express";
import { environment } from "../environment/environment";
import RouterUser from "./router-user";
import RouterClient from "./router-client";

const rootRouter: Router = Router();

rootRouter.use("/user", RouterUser);
rootRouter.use("/client", RouterClient);

rootRouter.get("/", (_req, res) => {
    res.send(`API Running on ${environment.name}`);
});

export default rootRouter;
