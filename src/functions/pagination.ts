export function pagination(page?: string, size?: string): { page: number; size: number } {
    return {
        page: page ? +page : 1,
        size: size ? +size : 10
    };
}
