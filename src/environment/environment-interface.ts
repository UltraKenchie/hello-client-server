export interface Environment {
    name: EnvironmentName;
    port: number;
    dbUri: string;
    jwtSecret: string;
    saltRounds: number;
    jwtExpiresIn?: string;
    imagekit: {
        publicKey: string;
        privateKey: string;
        endpoint: string;
    };
}
