import User from '../models/User';
import { Plan, PlanLimits, getLimits } from '../config/plans';

export async function getUserPlan(uid: string): Promise<Plan> {
  const user = await User.findOne({ uid }, { plan: 1 }).lean();
  return (user?.plan as Plan) ?? 'free';
}

export async function getUserLimits(uid: string): Promise<PlanLimits> {
  return getLimits(await getUserPlan(uid));
}
