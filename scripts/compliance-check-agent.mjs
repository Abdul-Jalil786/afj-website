#!/usr/bin/env node

/**
 * Compliance Check Agent
 *
 * Daily 7:00 UTC — NO AI calls. Pure date logic.
 * Reads compliance-records.json, checks MOT and DBS expiry dates,
 * creates notifications for items expiring within 30 days.
 * Weekly dedup: only creates a notification if one hasn't been sent
 * for the same record in the last 7 days.
 *
 * Usage:
 *   node scripts/compliance-check-agent.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  saveReport,
  updateHistory,
  gradeFromIssues,
  createNotification,
  SITE_URL,
} from './agent-utils.mjs';

const ROOT = process.cwd();
const RECORDS_PATH = join(ROOT, 'src', 'data', 'compliance-records.json');
const DEDUP_PATH = join(ROOT, 'src', 'data', 'reports', 'compliance-dedup.json');

console.log('=== Compliance Check Agent ===');
console.log(`Time: ${new Date().toISOString()}`);

// ── Load records ──
let records;
try {
  records = JSON.parse(readFileSync(RECORDS_PATH, 'utf-8'));
} catch {
  console.log('No compliance-records.json found — nothing to check');
  const report = {
    generatedAt: new Date().toISOString(),
    grade: 'A',
    motChecked: 0,
    dbsChecked: 0,
    motExpiring: 0,
    motExpired: 0,
    dbsExpiring: 0,
    dbsExpired: 0,
    alerts: [],
    summary: 'No compliance records to check',
  };
  saveReport('compliance-check-report.json', report);
  updateHistory('compliance', 'A', 'No records to check');
  process.exit(0);
}

// ── Load dedup state ──
let dedup = {};
try {
  if (existsSync(DEDUP_PATH)) {
    dedup = JSON.parse(readFileSync(DEDUP_PATH, 'utf-8'));
  }
} catch {
  dedup = {};
}

const now = new Date();
const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

const alerts = [];
let critical = 0;
let high = 0;
let medium = 0;
let low = 0;

function wasNotifiedRecently(recordId) {
  const lastNotified = dedup[recordId];
  if (!lastNotified) return false;
  return new Date(lastNotified) > weekAgo;
}

function markNotified(recordId) {
  dedup[recordId] = now.toISOString();
}

// ── Check MOT records ──
const motRecords = records.motRecords || [];
let motExpiring = 0;
let motExpired = 0;

for (const mot of motRecords) {
  const expiry = new Date(mot.motExpiry);

  if (expiry < now) {
    motExpired++;
    critical++;
    alerts.push({
      type: 'mot-expired',
      severity: 'critical',
      vehicle: mot.vehicleReg,
      vehicleName: mot.vehicleName,
      expiry: mot.motExpiry,
      message: `MOT EXPIRED for ${mot.vehicleReg} (${mot.vehicleName}) — expired ${mot.motExpiry}`,
    });

    if (!wasNotifiedRecently(`mot-expired-${mot.id}`)) {
      createNotification({
        type: 'compliance-expiry',
        title: `MOT expired: ${mot.vehicleReg}`,
        summary: `The MOT for ${mot.vehicleReg} (${mot.vehicleName}) expired on ${mot.motExpiry}. This vehicle must not be used until a valid MOT is obtained.`,
        actionUrl: '/admin/compliance-records',
        priority: 'high',
      });
      markNotified(`mot-expired-${mot.id}`);
    }
  } else if (expiry <= in7Days) {
    motExpiring++;
    high++;
    alerts.push({
      type: 'mot-expiring-7d',
      severity: 'high',
      vehicle: mot.vehicleReg,
      vehicleName: mot.vehicleName,
      expiry: mot.motExpiry,
      message: `MOT expires within 7 days: ${mot.vehicleReg} (${mot.vehicleName}) — ${mot.motExpiry}`,
    });

    if (!wasNotifiedRecently(`mot-7d-${mot.id}`)) {
      createNotification({
        type: 'compliance-expiry',
        title: `MOT expires in 7 days: ${mot.vehicleReg}`,
        summary: `The MOT for ${mot.vehicleReg} (${mot.vehicleName}) expires on ${mot.motExpiry}. Book an MOT test urgently.`,
        actionUrl: '/admin/compliance-records',
        priority: 'high',
      });
      markNotified(`mot-7d-${mot.id}`);
    }
  } else if (expiry <= in14Days) {
    motExpiring++;
    medium++;
    alerts.push({
      type: 'mot-expiring-14d',
      severity: 'medium',
      vehicle: mot.vehicleReg,
      vehicleName: mot.vehicleName,
      expiry: mot.motExpiry,
      message: `MOT expires within 14 days: ${mot.vehicleReg} (${mot.vehicleName}) — ${mot.motExpiry}`,
    });

    if (!wasNotifiedRecently(`mot-14d-${mot.id}`)) {
      createNotification({
        type: 'compliance-expiry',
        title: `MOT expires in 14 days: ${mot.vehicleReg}`,
        summary: `The MOT for ${mot.vehicleReg} (${mot.vehicleName}) expires on ${mot.motExpiry}. Please schedule an MOT test.`,
        actionUrl: '/admin/compliance-records',
        priority: 'medium',
      });
      markNotified(`mot-14d-${mot.id}`);
    }
  } else if (expiry <= in30Days) {
    motExpiring++;
    low++;
    alerts.push({
      type: 'mot-expiring-30d',
      severity: 'low',
      vehicle: mot.vehicleReg,
      vehicleName: mot.vehicleName,
      expiry: mot.motExpiry,
      message: `MOT expires within 30 days: ${mot.vehicleReg} (${mot.vehicleName}) — ${mot.motExpiry}`,
    });
  }
}

// ── Check DBS records ──
const dbsRecords = records.dbsRecords || [];
let dbsExpiring = 0;
let dbsExpired = 0;

for (const dbs of dbsRecords) {
  const expiry = new Date(dbs.expiryDate);

  if (expiry < now) {
    dbsExpired++;
    critical++;
    alerts.push({
      type: 'dbs-expired',
      severity: 'critical',
      driver: dbs.driverName,
      expiry: dbs.expiryDate,
      message: `DBS EXPIRED for ${dbs.driverName} — expired ${dbs.expiryDate}`,
    });

    if (!wasNotifiedRecently(`dbs-expired-${dbs.id}`)) {
      createNotification({
        type: 'compliance-expiry',
        title: `DBS expired: ${dbs.driverName}`,
        summary: `The DBS certificate for ${dbs.driverName} (${dbs.dbsNumber}) expired on ${dbs.expiryDate}. This driver must not work until a new DBS check is completed.`,
        actionUrl: '/admin/compliance-records',
        priority: 'high',
      });
      markNotified(`dbs-expired-${dbs.id}`);
    }
  } else if (expiry <= in30Days) {
    dbsExpiring++;
    medium++;
    alerts.push({
      type: 'dbs-expiring-30d',
      severity: 'medium',
      driver: dbs.driverName,
      expiry: dbs.expiryDate,
      message: `DBS expires within 30 days: ${dbs.driverName} — ${dbs.expiryDate}`,
    });

    if (!wasNotifiedRecently(`dbs-30d-${dbs.id}`)) {
      createNotification({
        type: 'compliance-expiry',
        title: `DBS expires soon: ${dbs.driverName}`,
        summary: `The DBS certificate for ${dbs.driverName} (${dbs.dbsNumber}) expires on ${dbs.expiryDate}. Please initiate a DBS renewal.`,
        actionUrl: '/admin/compliance-records',
        priority: 'medium',
      });
      markNotified(`dbs-30d-${dbs.id}`);
    }
  }
}

// ── Update DBS record statuses in the store ──
let statusUpdated = false;
for (const dbs of dbsRecords) {
  const expiry = new Date(dbs.expiryDate);
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  let newStatus = 'valid';
  if (expiry < now) newStatus = 'expired';
  else if (expiry <= in30) newStatus = 'expiring';

  if (dbs.status !== newStatus) {
    dbs.status = newStatus;
    statusUpdated = true;
  }
}

if (statusUpdated) {
  try {
    writeFileSync(RECORDS_PATH, JSON.stringify(records, null, 2) + '\n', 'utf-8');
    console.log('Updated DBS record statuses');
  } catch (err) {
    console.error('Failed to update record statuses:', err.message);
  }
}

// ── Save dedup state ──
// Clean up old dedup entries (older than 30 days)
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
for (const key of Object.keys(dedup)) {
  if (new Date(dedup[key]) < thirtyDaysAgo) {
    delete dedup[key];
  }
}
try {
  writeFileSync(DEDUP_PATH, JSON.stringify(dedup, null, 2) + '\n', 'utf-8');
} catch (err) {
  console.error('Failed to save dedup state:', err.message);
}

// ── Grade ──
const grade = gradeFromIssues(critical, high, medium, low);

// ── Summary ──
const summary = alerts.length === 0
  ? `All ${motRecords.length} MOT and ${dbsRecords.length} DBS records are compliant`
  : `${alerts.length} compliance alerts: ${motExpired} MOT expired, ${motExpiring} MOT expiring, ${dbsExpired} DBS expired, ${dbsExpiring} DBS expiring`;

console.log(`\nGrade: ${grade}`);
console.log(summary);
alerts.forEach(a => console.log(`  [${a.severity.toUpperCase()}] ${a.message}`));

// ── Save report ──
const report = {
  generatedAt: new Date().toISOString(),
  grade,
  motChecked: motRecords.length,
  dbsChecked: dbsRecords.length,
  motExpiring,
  motExpired,
  dbsExpiring,
  dbsExpired,
  alertCount: alerts.length,
  alerts,
  summary,
};

saveReport('compliance-check-report.json', report);
updateHistory('compliance', grade, summary);

console.log('\n=== Compliance Check Complete ===');
