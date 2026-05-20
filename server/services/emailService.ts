import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export interface MatchPlayer {
  name: string;
  email?: string;
  preferredPosition?: string;
  role?: string;   // formation role (GK, CB, ST …)
  x?: number;      // pitch x position 0–100
  y?: number;      // pitch y position 0–100
}

export interface MatchEmailPayload {
  location: string;
  date: string;
  time: string;
  leftTeam: MatchPlayer[];
  rightTeam: MatchPlayer[];
}

export interface SendResult {
  sent: string[];
  skipped: string[];
}

type RoleGroup = 'GK' | 'DEF' | 'MID' | 'ATT';

function roleGroup(role: string = ''): RoleGroup {
  const r = role.toUpperCase();
  if (/GK/.test(r)) return 'GK';
  if (/ST|LS|RS|CF|LF|RF|LW|RW/.test(r)) return 'ATT';
  if (/LB|RB|CB|LCB|RCB|CDM|SW|LWB|RWB/.test(r)) return 'DEF';
  return 'MID';
}

const GROUP_LABELS: Record<RoleGroup, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defenders',
  MID: 'Midfielders',
  ATT: 'Attackers',
};

// Build a formation-organized HTML roster for both teams
function buildPitchHtml(leftTeam: MatchPlayer[], rightTeam: MatchPlayer[]): string {
  const renderTeam = (players: MatchPlayer[], label: string, color: string) => {
    // Sort by y position (GK at bottom = high y → rendered last)
    const sorted = [...players].sort((a, b) => (a.y ?? 50) - (b.y ?? 50));
    const groups: Partial<Record<RoleGroup, MatchPlayer[]>> = {};
    for (const p of sorted) {
      const g = roleGroup(p.role ?? p.preferredPosition);
      if (!groups[g]) groups[g] = [];
      groups[g]!.push(p);
    }

    const sections: string[] = [];
    for (const g of (['ATT', 'MID', 'DEF', 'GK'] as RoleGroup[])) {
      if (!groups[g]?.length) continue;
      const rows = groups[g]!.map(p => `
        <tr>
          <td style="padding:5px 8px; color:#ffffff; font-size:12px; font-weight:700;">${p.name}</td>
          <td style="padding:5px 8px; color:${color}; font-size:11px; font-weight:600; text-align:right;">${p.role ?? p.preferredPosition ?? '—'}</td>
        </tr>`).join('');
      sections.push(`
        <tr><td colspan="2" style="padding:6px 8px 2px; font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:rgba(255,255,255,0.35);">${GROUP_LABELS[g]}</td></tr>
        ${rows}`);
    }

    return `
      <div style="flex:1; min-width:0;">
        <div style="text-align:center; font-size:13px; font-weight:900; color:${color}; letter-spacing:0.15em; text-transform:uppercase; padding:12px 8px 8px; border-bottom:1px solid ${color}44;">${label}</div>
        <table style="width:100%; border-collapse:collapse;">${sections.join('')}</table>
      </div>`;
  };

  return `
    <div style="background:linear-gradient(135deg,#1a2b42 0%,#0d1f33 100%); border:1px solid rgba(255,255,255,0.1); border-radius:12px; overflow:hidden; display:flex; gap:0;">
      ${renderTeam(leftTeam, 'Team A', '#00deec')}
      <div style="width:1px; background:rgba(255,255,255,0.12);"></div>
      ${renderTeam(rightTeam, 'Team B', '#ff9f43')}
    </div>`;
}

function buildEmailHtml(payload: MatchEmailPayload, recipientName: string): string {
  const pitchHtml = buildPitchHtml(payload.leftTeam, payload.rightTeam);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; background:#0d1f33; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">

    <!-- Header -->
    <div style="
      background: rgba(36,59,90,0.85);
      border-bottom: 2px solid #00deec;
      border-radius: 12px 12px 0 0;
      padding: 28px 32px;
      text-align: center;
    ">
      <div style="font-size: 28px; font-weight: 900; color: #00deec; letter-spacing: -0.02em; text-transform: uppercase;">
        ⚽ CardTeur
      </div>
      <div style="font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 4px; letter-spacing: 0.1em;">
        MATCH ANNOUNCEMENT
      </div>
    </div>

    <!-- Body -->
    <div style="
      background: rgba(26,43,66,0.95);
      border-radius: 0 0 12px 12px;
      padding: 28px 32px;
    ">
      <p style="color: rgba(255,255,255,0.8); font-size: 15px; margin: 0 0 24px 0;">
        Hello <strong style="color:#ffffff;">${recipientName}</strong>, you have been added to an upcoming match!
      </p>

      <!-- Match details -->
      <div style="
        background: rgba(0,222,236,0.07);
        border: 1px solid rgba(0,222,236,0.2);
        border-radius: 10px;
        padding: 20px 24px;
        margin-bottom: 28px;
      ">
        <table style="width:100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: rgba(0,222,236,0.7); font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; width: 30%;">Location</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 600;">${payload.location}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: rgba(0,222,236,0.7); font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em;">Date</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 600;">${payload.date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: rgba(0,222,236,0.7); font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em;">Time</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 600;">${payload.time}</td>
          </tr>
        </table>
      </div>

      <!-- Teams -->
      <div style="font-size: 12px; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px;">
        Squads
      </div>
      ${pitchHtml}

      <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 28px; text-align: center;">
        This announcement was sent via CardTeur. See you on the pitch!
      </p>
    </div>
  </div>
</body>
</html>`;
}

// Main exported function — sends match announcement to all players who have an email
export async function sendMatchAnnouncement(payload: MatchEmailPayload): Promise<SendResult> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const allPlayers = [...payload.leftTeam, ...payload.rightTeam];

  const sent: string[] = [];
  const skipped: string[] = [];

  for (const player of allPlayers) {
    if (!player.email || player.email.trim() === '') {
      skipped.push(player.name);
      continue;
    }

    const html = buildEmailHtml(payload, player.name);

    const { data, error } = await resend.emails.send({
      from: process.env.SMTP_FROM!,
      to: player.email,
      subject: `⚽ Match on ${payload.date} at ${payload.time} — CardTeur`,
      html,
    });

    if (error) {
      console.error(`[emailService] Failed to send to ${player.email}:`, error);
      throw new Error(JSON.stringify(error));
    }

    console.log(`[emailService] Sent to ${player.email}, id: ${data?.id}`);

    sent.push(player.email);
  }

  console.log(`[emailService] Sent: ${sent.length}, Skipped (no email): ${skipped.length}`);
  return { sent, skipped };
}
