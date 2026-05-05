import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export interface MatchPlayer {
  name: string;
  email?: string;
  preferredPosition?: string;
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

// Build a simple HTML pitch visualization showing both teams side by side
function buildPitchHtml(leftTeam: MatchPlayer[], rightTeam: MatchPlayer[]): string {
  const renderTeam = (players: MatchPlayer[], side: 'left' | 'right') => {
    const color = side === 'left' ? '#00deec' : '#ff6b6b';
    const items = players
      .map(
        (p) => `
        <div style="
          background: rgba(255,255,255,0.08);
          border: 1px solid ${color};
          border-radius: 6px;
          padding: 8px 14px;
          margin-bottom: 8px;
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 13px;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        ">
          <span style="font-weight: 700;">${p.name}</span>
          <span style="color: ${color}; font-size: 11px; font-weight: 600;">${p.preferredPosition ?? '—'}</span>
        </div>`,
      )
      .join('');

    const label = side === 'left' ? 'Team A' : 'Team B';
    return `
      <div style="flex: 1; padding: 16px;">
        <div style="
          text-align: center;
          font-size: 14px;
          font-weight: 900;
          color: ${color};
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 14px;
          border-bottom: 1px solid ${color}44;
          padding-bottom: 8px;
        ">${label}</div>
        ${items}
      </div>`;
  };

  return `
    <div style="
      background: linear-gradient(135deg, #1a2b42 0%, #0d1f33 100%);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      gap: 0;
    ">
      ${renderTeam(leftTeam, 'left')}
      <div style="width: 1px; background: rgba(255,255,255,0.12);"></div>
      ${renderTeam(rightTeam, 'right')}
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
