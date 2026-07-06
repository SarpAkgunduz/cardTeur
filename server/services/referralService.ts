import crypto from 'crypto';
import Referral from '../models/Referral';
import User from '../models/User';
import { getUserLimits } from './planService';

function newCode(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

export async function getReferralOverview(uid: string) {
  const limits = await getUserLimits(uid);
  const referrals = await Referral.find({ referrerUid: uid }).sort({ createdAt: 1 }).lean();
  const slots = limits.referralSlots;
  return {
    slots,
    used: referrals.length,
    available: Math.max(0, slots - referrals.length),
    referrals,
  };
}

export async function generateReferral(uid: string) {
  const limits = await getUserLimits(uid);
  const existing = await Referral.countDocuments({ referrerUid: uid });
  if (existing >= limits.referralSlots) {
    const err = new Error('No referral slots available for your plan');
    (err as any).code = 'REFERRAL_LIMIT';
    throw err;
  }

  let code = newCode();
  while (await Referral.exists({ code })) {
    code = newCode();
  }

  return Referral.create({ referrerUid: uid, code, status: 'unused' });
}

export async function redeemReferral(code: string, referredUid: string) {
  const referral = await Referral.findOne({ code, status: 'unused' });
  if (!referral) return null;
  if (referral.referrerUid === referredUid) return null;
  referral.status = 'redeemed';
  referral.referredUid = referredUid;
  await referral.save();
  return referral;
}

export async function grantReferrerReward(referredUid: string) {
  const referral = await Referral.findOne({ referredUid, status: 'redeemed', rewardGranted: false });
  if (!referral) return null;
  referral.rewardGranted = true;
  await referral.save();
  await User.updateOne(
    { uid: referral.referrerUid },
    { $inc: { referralRewardMonths: 1 } }
  );
  return referral;
}
