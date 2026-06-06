import { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number) => void;
export declare const sendPaginated: <T>(res: Response, data: T[], total: number, page: number, limit: number) => void;
//# sourceMappingURL=response.d.ts.map