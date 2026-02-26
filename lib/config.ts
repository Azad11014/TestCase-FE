export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
export const API_ENDPOINTS = {
    UPLOAD_BRD: `${BACKEND_URL}/api/v1/frd/upload`,
    GENERATE_TC: `${BACKEND_URL}/api/v1/testcase/gen-tc`,
    DATA: {
        TENANTS: `${BACKEND_URL}/api/v1/data/tenants`,
        TENANT_DOCS: (tenant: string) => `${BACKEND_URL}/api/v1/data/tenants/${tenant}/documents`,
        TENANT_FRDS: (tenant: string) => `${BACKEND_URL}/api/v1/data/tenants/${tenant}/frds`,
        TENANT_TC: (tenant: string) => `${BACKEND_URL}/api/v1/data/tenants/${tenant}/testcases`,
        CONTENT: `${BACKEND_URL}/api/v1/data/content`,
    }
};
