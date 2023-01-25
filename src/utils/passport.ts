import passport from "passport";
import { user } from "../models/user";
import { Strategy, StrategyOptions, ExtractJwt } from "passport-jwt";
import { environment } from "../environment/environment";
import { TokenInterface } from "./jwt-token";

const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: environment.jwtSecret
};

passport.use(
    new Strategy(options, (jwtPayload: TokenInterface, done) => {
        user.findByEmail(jwtPayload.email).subscribe(
            (result) => {
                if (result) {
                    return done(null, result);
                }
                return done(null, false);
            },
            (err) => {
                return done(err, false);
            }
        );
    })
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    done(null, user);
});
