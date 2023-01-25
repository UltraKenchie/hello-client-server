import { connect } from "mongoose";
import { environment } from "../environment/environment";

export const connectDB = async (): Promise<void> => {
    if (!environment.dbUri) {
        console.error("ERROR: DB URI missing!");
        return;
    }

    console.log("Connecting to db..");
    try {
        const mongoURI: string = environment.dbUri;
        await connect(mongoURI);
        console.log("MongoDB Connected...");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
