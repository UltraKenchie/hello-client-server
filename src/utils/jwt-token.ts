import jwt from "jsonwebtoken";
import { environment } from "../environment/environment";

export interface TokenInterface {
    id?: string;
    email: string;
    name?: string;
    role?: "user" | "admin";
}

export function createToken(tokenInterface: TokenInterface): string {
    const token = jwt.sign(
        {
            id: tokenInterface.id,
            email: tokenInterface.email,
            name: tokenInterface.name,
            role: tokenInterface.role
        },
        environment.jwtSecret,
        {
            expiresIn: environment.jwtExpiresIn ?? "30d"
        }
    );
    return token;
}

export function verifyToken(token: string): TokenInterface {
    const isVerified = jwt.verify(token, environment.jwtSecret);
    return isVerified as TokenInterface;
}
