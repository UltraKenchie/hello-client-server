import express from "express";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import dotenv from "dotenv";
import { connectDB } from "./utils/database";
import rootRouter from "./router/router";
import passport from "passport";
import { environment } from "./environment/environment";

if (environment.name !== "production") {
    dotenv.config();
}

const app = express();
import "./utils/passport";

connectDB();

app.set("port", environment.port || 3000);
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: false, limit: "25mb" }));
app.use(cookieParser());
app.use(
    session({
        resave: true,
        saveUninitialized: true,
        secret: environment.jwtSecret
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api", rootRouter);

const port = app.get("port") as number;
const server = app.listen(port, () => console.log(`Server started on port ${port}`));

export default server;
