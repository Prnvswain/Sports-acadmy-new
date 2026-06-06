import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from '../types';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { prisma } from '../lib/prisma';

export const resolveCoach = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== UserRole.COACH) return next();

  const coach = await prisma.coach.findFirst({
    where: { userId: req.user.userId, academyId: req.academyId! },
    select: { id: true },
  });

  if (!coach) throw new NotFoundError('Coach profile not found');
  req.coachId = coach.id;
  next();
};

export const coachOnly = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.COACH) {
    throw new ForbiddenError('Coach access only');
  }
  next();
};
