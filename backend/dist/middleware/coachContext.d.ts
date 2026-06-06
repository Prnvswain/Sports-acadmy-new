import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const resolveCoach: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const coachOnly: (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=coachContext.d.ts.map