export interface RequestClient {
    organizationName: string;
    organizationImage: string;
    contactName: string;
    contactImage: string;
    contactEmail: string;
    contactPhoneNumber: string;
    website: string;
    status: boolean;
    assigned?: string | null;
}
