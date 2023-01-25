import { model, Model, Schema, Document, Types, FilterQuery, Aggregate } from "mongoose";
import { UserInterface, UserDocument } from "./user";
import { Image } from "../interfaces/image";

const mongoosePaginate = require("mongoose-paginate-v2");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

import { PaginateOptions, PaginateResult } from "../interfaces/mongoose";
import { from, Observable } from "rxjs";

export interface ClientInterface {
    id: string;
    organizationName: string;
    organizationImage: Image | null;
    contactName: string;
    contactImage: Image | null;
    contactEmail: string;
    contactPhoneNumber: string;
    website: string;
    status: boolean;
    assigned: Types.ObjectId | UserInterface;
}

interface ClientBaseDocument extends ClientInterface, Document {
    id: string;
}

export interface ClientDocument extends ClientBaseDocument {
    assigned: UserDocument["_id"];
}

export interface ClientPopulatedDocument extends ClientBaseDocument {
    assigned: UserInterface;
}

export interface ClientModel extends Model<ClientDocument> {
    findOneById: (id?: string) => Observable<ClientPopulatedDocument | null>;
    paginate: (
        query?: FilterQuery<ClientDocument>,
        options?: PaginateOptions
    ) => Promise<PaginateResult<ClientPopulatedDocument>>;
    aggregatePaginate: (
        query?: Aggregate<ClientDocument[]>,
        options?: PaginateOptions
    ) => Promise<PaginateResult<ClientDocument>>;
    aggregateSearch: (
        search?: {
            id?: string;
            organizationName?: string;
            contactName?: string;
            assignedId?: string;
        },
        options?: {
            exclude?: string[];
            limit?: number;
        }
    ) => Aggregate<ClientPopulatedDocument[]>;
}

const clientSchema = new Schema<ClientDocument, ClientModel>(
    {
        organizationName: {
            type: String,
            required: true
        },
        organizationImage: {
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
        contactName: {
            type: String,
            unique: true
        },
        contactImage: {
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
        contactEmail: {
            type: String,
            required: true
        },
        website: {
            type: String
        },
        contactPhoneNumber: {
            type: String
        },
        assigned: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        status: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

clientSchema.plugin(mongoosePaginate);
clientSchema.plugin(mongooseAggregatePaginate);

clientSchema.set("toJSON", { virtuals: true });

clientSchema.pre<ClientDocument>("save", function (next) {
    this.contactEmail = this.contactEmail.toLowerCase();
    next();
});

clientSchema.statics.findOneById = function (
    this: Model<ClientDocument>,
    id?: string
): Observable<ClientPopulatedDocument | null> {
    return from(this.findOne({ id }));
};

clientSchema.statics.aggregateSearch = function (
    this: Model<ClientDocument>,
    search?: {
        id?: string;
        organizationName?: string;
        contactName?: string;
        assigned?: string;
    },
    options?: {
        exclude?: string[];
        limit?: number;
    }
): Aggregate<ClientPopulatedDocument[]> {
    const match: {
        [key: string]: { $regex: string; $options: string } | boolean | string | Types.ObjectId;
    } = {
        "assigned.active": true
    };
    if (search?.assigned) {
        match["assigned._id"] = new Types.ObjectId(search.assigned);
    }
    if (search?.organizationName) {
        match.organizationImage = { $regex: search.organizationName, $options: "i" };
    }
    if (search?.contactName) {
        match.contactName = { $regex: search.contactName, $options: "i" };
    }
    if (search?.id) {
        match._id = new Types.ObjectId(search.id);
    }

    const initialExclusions: { [key: string]: number } = {
        "assigned.createdAt": 0,
        "assigned.updatedAt": 0,
        "assigned.active": 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "assigned.__v": 0
    };

    const exclusions: { [key: string]: number } = {};

    options?.exclude?.forEach((exclude) => {
        exclusions[exclude] = 0;
    });

    const projections = Object.assign(initialExclusions, exclusions);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipelines: any[] = [
        {
            $lookup: {
                from: "users",
                localField: "assigned",
                foreignField: "_id",
                as: "assigned"
            }
        },
        {
            $unwind: { path: "$assigned" }
        },
        {
            $match: match
        },
        {
            $project: projections
        }
    ];
    if (options?.limit) {
        pipelines.push({ $limit: options.limit });
    }
    return this.aggregate(pipelines);
};

export const client = model<ClientDocument, ClientModel>("Client", clientSchema);
