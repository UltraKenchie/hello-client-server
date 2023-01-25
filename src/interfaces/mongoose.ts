import { ClientSession, Model } from "mongoose";
import { ReadPreferenceMode } from "mongodb";

interface CustomLabels {
    totalDocs?: string;
    limit?: string;
    page?: string;
    totalPages?: string;
    docs?: string;
    nextPage?: string;
    prevPage?: string;
}

interface ReadOptions {
    pref: string;
    tags?: any[];
}

interface CollationOptions {
    locale?: string;
    caseLevel?: boolean;
    caseFirst?: string;
    strength?: number;
    numericOrdering?: boolean;
    alternate?: string;
    maxVariable?: string;
    backwards?: boolean;
}
interface ModelPopulateOptions extends QueryPopulateOptions {
    /** optional, if true Mongoose will always set path to an array. Inferred from schema by default */
    justOne?: boolean;
}

interface QueryFindBaseOptions {
    /** Sets a default collation for every query and aggregation. */
    collation?: CollationOptions;
    explain?: any;
    lean?: boolean;
    populate?: string | ModelPopulateOptions;
    /** like select, it determines which fields to return */
    projection?: any;
    /** use client session for transaction */
    session?: ClientSession;
}

interface QueryFindOptions extends QueryFindBaseOptions {
    batchSize?: number;
    comment?: any;
    hint?: any;
    limit?: number;
    maxscan?: number;
    readPreference?: ReadPreferenceMode;
    skip?: number;
    snapshot?: any;
    sort?: any;
    tailable?: any;
}

interface QueryPopulateOptions {
    /** space delimited path(s) to populate */
    path: string;
    /** optional fields to select */
    select?: any;
    /** optional query conditions to match */
    match?: any;
    /** optional model to use for population */
    model?: string | Model<any>;
    /** optional query options like sort, limit, etc */
    options?: any;
    /** deep populate */
    populate?: QueryPopulateOptions | QueryPopulateOptions[];
}

export interface PaginateOptions {
    select?: object | string;
    sort?: object | string;
    customLabels?: CustomLabels;
    collation?: CollationOptions;
    populate?: object[] | string[] | object | string | QueryPopulateOptions;
    lean?: boolean;
    leanWithId?: boolean;
    offset?: number;
    page?: number;
    limit?: number;
    read?: ReadOptions;
    /* If pagination is set to `false`, it will return all docs without adding limit condition. (Default: `true`) */
    pagination?: boolean;
    projection?: any;
    options?: QueryFindOptions;
}

export interface PaginateResult<T> {
    docs: T[];
    totalDocs: number;
    limit: number;
    page?: number;
    totalPages: number;
    nextPage?: number | null;
    prevPage?: number | null;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    meta?: any;
    [customLabel: string]: T[] | number | boolean | null | undefined;
}