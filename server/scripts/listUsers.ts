import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import User, { IUser } from '../models/User';

type Args = {
  plan?: string;
  search?: string;
  limit: number;
  sort: string;
  json: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { limit: 100, sort: '-createdAt', json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--plan') args.plan = argv[++i];
    else if (a === '--search') args.search = argv[++i];
    else if (a === '--limit') args.limit = Number(argv[++i]);
    else if (a === '--sort') args.sort = argv[++i];
  }
  return args;
}

function fmtDate(d?: Date): string {
  return d ? new Date(d).toISOString().slice(0, 10) : '-';
}

function pad(v: string, n: number): string {
  return v.length > n ? v.slice(0, n - 1) + '…' : v.padEnd(n);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set in server/.env');
    process.exit(1);
  }

  const filter: Record<string, unknown> = {};
  if (args.plan) filter.plan = args.plan;
  if (args.search) {
    const rx = new RegExp(args.search, 'i');
    filter.$or = [{ email: rx }, { displayName: rx }, { uid: args.search }];
  }

  await mongoose.connect(uri);

  const total = await User.countDocuments(filter);
  const users = await User.find(filter).sort(args.sort).limit(args.limit).lean<IUser[]>();

  if (args.json) {
    console.log(JSON.stringify(users, null, 2));
  } else {
    console.log(
      pad('EMAIL', 32) + pad('NAME', 20) + pad('PLAN', 14) + pad('FRIENDS', 9) +
      pad('REQ', 5) + pad('RENEWS', 12) + pad('BILLING', 10) + 'UID'
    );
    console.log('-'.repeat(130));
    for (const u of users) {
      console.log(
        pad(u.email ?? '-', 32) +
        pad(u.displayName ?? '-', 20) +
        pad(u.plan ?? 'free', 14) +
        pad(String(u.friends?.length ?? 0), 9) +
        pad(String(u.friendRequests?.length ?? 0), 5) +
        pad(fmtDate(u.planRenewsAt), 12) +
        pad(u.billingProvider ?? '-', 10) +
        (u.uid ?? '-')
      );
    }

    const byPlan = await User.aggregate([
      { $match: filter },
      { $group: { _id: '$plan', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    console.log('-'.repeat(130));
    console.log(`shown: ${users.length} / ${total}`);
    console.log('plans: ' + byPlan.map((p) => `${p._id ?? 'free'}=${p.count}`).join('  '));
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
