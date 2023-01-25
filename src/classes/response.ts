import { Meta } from "../interfaces/meta";

export class ResponseClass<T> {
    public status: number;
    public message: string;
    public body: T | null;
    public meta?: Meta;

    public constructor(body?: T, options?: { status?: number; message?: string; meta?: Meta }) {
        this.status = options?.status ?? 200;
        this.message = options?.message ?? "success";
        this.meta = options?.meta;
        this.body = body ?? null;
    }

    public toUnauthorized(message = "Unauthorized"): void {
        this.status = 401;
        this.message = message;
    }

    public toNotFound(message = "Not Found"): void {
        this.status = 404;
        this.message = message;
    }

    public toServerError(message = "Server Error"): void {
        this.status = 500;
        this.message = message;
    }
}
