import { compareSync, genSaltSync, hashSync } from "bcrypt";
import { environment } from "../environment/environment";

export const encrypt = (password: string): string => {
    const salt = genSaltSync(environment.saltRounds);
    return hashSync(password, salt);
};

export const decrpyt = (password: string, hash = ""): boolean => {
    return compareSync(password, hash);
};
