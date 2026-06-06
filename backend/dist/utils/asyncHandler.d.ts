import { Request, Response, NextFunction, RequestHandler } from 'express';
type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export declare const asyncHandler: (fn: AsyncFn) => RequestHandler;
export {};
//# sourceMappingURL=asyncHandler.d.ts.map