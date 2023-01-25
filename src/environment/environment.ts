import dotenv from "dotenv";
import { Environment } from "./environment-interface";

dotenv.config();

export const environment: Environment = {
    name: process.env.NODE_ENV as EnvironmentName,
    port: (process.env.PORT as unknown as number) || 3000,
    dbUri: process.env.DB_URI as string,
    jwtSecret: process.env.JWT_SECRET as string,
    saltRounds: +(process.env.SALT_ROUNDS as string),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN as string,
    imagekit: {
        publicKey: process.env.IMAGE_KIT_PUBLIC_KEY as string,
        privateKey: process.env.IMAGE_KIT_PRIVATE_KEY as string,
        endpoint: process.env.IMAGE_KIT_ENDPOINT as string
    }
};
