export declare function sendEmail(to: string, subject: string, html: string): Promise<({
    error: import("resend").ErrorResponse;
    data: null;
} & {
    headers: Record<string, string> | null;
}) | ({
    data: import("resend").CreateEmailResponseSuccess;
    error: null;
} & {
    headers: Record<string, string> | null;
}) | {
    id: string;
}>;
export declare function sendWelcomeEmail(email: string, name: string, academyName: string): Promise<({
    error: import("resend").ErrorResponse;
    data: null;
} & {
    headers: Record<string, string> | null;
}) | ({
    data: import("resend").CreateEmailResponseSuccess;
    error: null;
} & {
    headers: Record<string, string> | null;
}) | {
    id: string;
}>;
//# sourceMappingURL=email.service.d.ts.map