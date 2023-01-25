import { model, Model, Schema, Document, FilterQuery } from "mongoose";
import { from, Observable } from "rxjs";
import { RequestLogin } from "../interfaces/requests/request-login";
import { decrpyt, encrypt } from "../utils/bcrypt";
import { map } from "rxjs/operators";
import { Image } from "../interfaces/image";
import { PaginateOptions, PaginateResult } from "../interfaces/mongoose";
const mongoosePaginate = require("mongoose-paginate-v2");

export interface UserInterface {
    id: string;
    email: string;
    name: string;
    password: string;
    avatar: Image | null;
    role: "admin" | "user";
}

interface UserBaseDocument extends UserInterface, Document {
    id: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserDocument extends UserBaseDocument {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserPopulatedDocument extends UserBaseDocument {}

export interface UserModel extends Model<UserDocument> {
    findByEmail: (email?: string) => Observable<UserPopulatedDocument | null>;
    login: (requestLogin: RequestLogin) => Observable<UserPopulatedDocument | null>;
    paginate: (
        query?: FilterQuery<UserDocument>,
        options?: PaginateOptions
    ) => Promise<PaginateResult<UserPopulatedDocument>>;
}

const userSchema = new Schema<UserDocument, UserModel>(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        avatar: {
            type: {
                id: {
                    type: String
                },
                path: {
                    type: String
                }
            },
            default: null
        },
        role: {
            type: String,
            default: "user"
        }
    },
    {
        timestamps: true
    }
);

userSchema.plugin(mongoosePaginate);

userSchema.set("toJSON", {
    virtuals: true
});

userSchema.virtual("id").get(function (this: UserDocument) {
    return this._id as unknown as string;
});

userSchema.pre("save", function () {
    if (this.isModified("password") && this.password !== undefined) {
        this.password = encrypt(this.password);
    }
});

userSchema.statics.findByEmail = function (
    this: Model<UserDocument>,
    email?: string
): Observable<UserPopulatedDocument | null> {
    return from(this.findOne({ email: { $regex: email, $options: "i" } }, "-__v -password"));
};

userSchema.statics.login = function (
    this: Model<UserDocument>,
    requestLogin: RequestLogin
): Observable<UserPopulatedDocument | null> {
    return from(this.findOne({ email: requestLogin.email })).pipe(
        map((userDocument) => {
            return requestLogin.password && decrpyt(requestLogin.password, userDocument?.password)
                ? userDocument
                : null;
        })
    );
};

export const user = model<UserDocument, UserModel>("User", userSchema);
