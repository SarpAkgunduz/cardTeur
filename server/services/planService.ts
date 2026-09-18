import User from '../models/User';
import { Plan, PlanLimits, getLimits } from '../config/plans';

export async function getUserPlan(uid: string): Promise<Plan> {
  const user = await User.findOne({ uid }, { plan: 1, lifetimePlan: 1 }).lean();
  // A manually granted lifetimePlan always wins — it's how a permanent,
  // billing-independent plan grant is enforced everywhere limits are checked.
  return (user?.lifetimePlan as Plan) ?? (user?.plan as Plan) ?? 'free';
}

export async function getUserLimits(uid: string): Promise<PlanLimits> {
  return getLimits(await getUserPlan(uid));
}
