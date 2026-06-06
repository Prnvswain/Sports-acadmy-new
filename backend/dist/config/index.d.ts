export declare const config: {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpires: string;
        refreshExpires: string;
    };
    resend: {
        apiKey: string;
        fromEmail: string;
    };
};
export declare const PLAN_LIMITS: {
    readonly FREE: {
        readonly maxStudents: 50;
        readonly maxCoaches: 5;
    };
    readonly PRO: {
        readonly maxStudents: 200;
        readonly maxCoaches: 20;
    };
    readonly PLUS: {
        readonly maxStudents: 999999;
        readonly maxCoaches: 999999;
    };
};
//# sourceMappingURL=index.d.ts.map