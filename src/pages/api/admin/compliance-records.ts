/**
 * GET  /api/admin/compliance-records          — list all records (filterable by type)
 * POST /api/admin/compliance-records          — add new record / CSV import
 * PUT  /api/admin/compliance-records          — update existing record
 *
 * Auth: CF JWT or DASHBOARD_SECRET
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { authenticateRequest } from '../../../lib/cf-auth';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

interface MOTRecord {
  id: string;
  vehicleReg: string;
  vehicleName: string;
  motDate: string;
  motExpiry: string;
  result: 'pass' | 'fail' | 'advisory';
  advisories: string;
  mileage: number;
  garage: string;
  notes: string;
}

interface DBSRecord {
  id: string;
  driverName: string;
  dbsNumber: string;
  issueDate: string;
  expiryDate: string;
  level: 'enhanced' | 'standard' | 'basic';
  status: 'valid' | 'expiring' | 'expired' | 'pending';
  role: string;
  notes: string;
}

interface ComplianceRecordsStore {
  lastUpdated: string;
  motRecords: MOTRecord[];
  dbsRecords: DBSRecord[];
}

const STORE_PATH = join(process.cwd(), 'src', 'data', 'compliance-records.json');

async function readStore(): Promise<ComplianceRecordsStore> {
  try {
    const raw = await readFile(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { lastUpdated: new Date().toISOString().split('T')[0], motRecords: [], dbsRecords: [] };
  }
}

async function writeStore(store: ComplianceRecordsStore): Promise<void> {
  store.lastUpdated = new Date().toISOString().split('T')[0];
  await mkdir(join(process.cwd(), 'src', 'data'), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2) + '\n', 'utf-8');
}

function generateId(): string {
  return `cr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
}

function computeStats(store: ComplianceRecordsStore) {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // MOT stats
  const motTotal = store.motRecords.length;
  const motPassed = store.motRecords.filter(r => r.result === 'pass').length;
  const motExpiringSoon = store.motRecords.filter(r => {
    const exp = new Date(r.motExpiry);
    return exp > now && exp <= in30Days;
  }).length;
  const motExpired = store.motRecords.filter(r => new Date(r.motExpiry) < now).length;
  const motPassRate = motTotal > 0 ? Math.round((motPassed / motTotal) * 100) : 0;

  // DBS stats
  const dbsTotal = store.dbsRecords.length;
  const dbsValid = store.dbsRecords.filter(r => {
    return new Date(r.expiryDate) > now;
  }).length;
  const dbsExpiringSoon = store.dbsRecords.filter(r => {
    const exp = new Date(r.expiryDate);
    return exp > now && exp <= in30Days;
  }).length;
  const dbsExpired = store.dbsRecords.filter(r => new Date(r.expiryDate) < now).length;
  const dbsComplianceRate = dbsTotal > 0 ? Math.round((dbsValid / dbsTotal) * 100) : 0;

  return {
    mot: { total: motTotal, passed: motPassed, passRate: motPassRate, expiringSoon: motExpiringSoon, expired: motExpired },
    dbs: { total: dbsTotal, valid: dbsValid, complianceRate: dbsComplianceRate, expiringSoon: dbsExpiringSoon, expired: dbsExpired },
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export const GET: APIRoute = async ({ request, url }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = await readStore();
  const type = url.searchParams.get('type'); // 'mot' | 'dbs' | null (all)
  const stats = computeStats(store);

  const data: any = { stats, lastUpdated: store.lastUpdated };

  if (!type || type === 'mot') {
    data.motRecords = store.motRecords;
  }
  if (!type || type === 'dbs') {
    data.dbsRecords = store.dbsRecords;
  }

  return new Response(JSON.stringify({ success: true, data }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = await readStore();

  // CSV import
  if (body.action === 'import-csv') {
    const { csvData, type } = body;
    if (!csvData || !type) {
      return new Response(JSON.stringify({ success: false, error: 'csvData and type required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const lines = csvData.split('\n').filter((l: string) => l.trim());
    if (lines.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'CSV must have a header row and at least one data row' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const headers = parseCSVLine(lines[0]).map((h: string) => h.toLowerCase().replace(/\s+/g, ''));
    let imported = 0;

    if (type === 'mot') {
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 3) continue;

        const record: MOTRecord = {
          id: generateId(),
          vehicleReg: cols[headers.indexOf('vehiclereg')] || cols[headers.indexOf('reg')] || cols[0] || '',
          vehicleName: cols[headers.indexOf('vehiclename')] || cols[headers.indexOf('vehicle')] || cols[1] || '',
          motDate: cols[headers.indexOf('motdate')] || cols[headers.indexOf('date')] || cols[2] || '',
          motExpiry: cols[headers.indexOf('motexpiry')] || cols[headers.indexOf('expiry')] || cols[3] || '',
          result: (cols[headers.indexOf('result')] || 'pass') as MOTRecord['result'],
          advisories: cols[headers.indexOf('advisories')] || '',
          mileage: parseInt(cols[headers.indexOf('mileage')] || '0', 10) || 0,
          garage: cols[headers.indexOf('garage')] || '',
          notes: cols[headers.indexOf('notes')] || '',
        };

        if (record.vehicleReg && record.motDate) {
          store.motRecords.push(record);
          imported++;
        }
      }
    } else if (type === 'dbs') {
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 3) continue;

        const issueDate = cols[headers.indexOf('issuedate')] || cols[headers.indexOf('date')] || cols[2] || '';
        // DBS expiry is 3 years from issue date
        let expiryDate = cols[headers.indexOf('expirydate')] || cols[headers.indexOf('expiry')] || '';
        if (!expiryDate && issueDate) {
          const d = new Date(issueDate);
          d.setFullYear(d.getFullYear() + 3);
          expiryDate = d.toISOString().split('T')[0];
        }

        const record: DBSRecord = {
          id: generateId(),
          driverName: cols[headers.indexOf('drivername')] || cols[headers.indexOf('name')] || cols[0] || '',
          dbsNumber: cols[headers.indexOf('dbsnumber')] || cols[headers.indexOf('dbs')] || cols[1] || '',
          issueDate,
          expiryDate,
          level: (cols[headers.indexOf('level')] || 'enhanced') as DBSRecord['level'],
          status: 'valid',
          role: cols[headers.indexOf('role')] || 'Driver',
          notes: cols[headers.indexOf('notes')] || '',
        };

        // Compute status from expiry
        const now = new Date();
        const exp = new Date(record.expiryDate);
        const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (exp < now) record.status = 'expired';
        else if (exp <= in30) record.status = 'expiring';
        else record.status = 'valid';

        if (record.driverName && record.dbsNumber) {
          store.dbsRecords.push(record);
          imported++;
        }
      }
    }

    await writeStore(store);
    return new Response(JSON.stringify({ success: true, data: { imported, stats: computeStats(store) } }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Add single record
  if (body.action === 'add-mot') {
    const record: MOTRecord = {
      id: generateId(),
      vehicleReg: body.vehicleReg || '',
      vehicleName: body.vehicleName || '',
      motDate: body.motDate || '',
      motExpiry: body.motExpiry || '',
      result: body.result || 'pass',
      advisories: body.advisories || '',
      mileage: body.mileage || 0,
      garage: body.garage || '',
      notes: body.notes || '',
    };

    if (!record.vehicleReg || !record.motDate) {
      return new Response(JSON.stringify({ success: false, error: 'vehicleReg and motDate required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    store.motRecords.push(record);
    await writeStore(store);
    return new Response(JSON.stringify({ success: true, data: { record, stats: computeStats(store) } }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (body.action === 'add-dbs') {
    const issueDate = body.issueDate || '';
    let expiryDate = body.expiryDate || '';
    if (!expiryDate && issueDate) {
      const d = new Date(issueDate);
      d.setFullYear(d.getFullYear() + 3);
      expiryDate = d.toISOString().split('T')[0];
    }

    const record: DBSRecord = {
      id: generateId(),
      driverName: body.driverName || '',
      dbsNumber: body.dbsNumber || '',
      issueDate,
      expiryDate,
      level: body.level || 'enhanced',
      status: 'valid',
      role: body.role || 'Driver',
      notes: body.notes || '',
    };

    const now = new Date();
    const exp = new Date(record.expiryDate);
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (exp < now) record.status = 'expired';
    else if (exp <= in30) record.status = 'expiring';
    else record.status = 'valid';

    if (!record.driverName || !record.dbsNumber) {
      return new Response(JSON.stringify({ success: false, error: 'driverName and dbsNumber required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    store.dbsRecords.push(record);
    await writeStore(store);
    return new Response(JSON.stringify({ success: true, data: { record, stats: computeStats(store) } }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
    status: 400, headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id, type } = body;
  if (!id || !type) {
    return new Response(JSON.stringify({ success: false, error: 'id and type required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = await readStore();

  if (type === 'mot') {
    const idx = store.motRecords.findIndex(r => r.id === id);
    if (idx === -1) {
      return new Response(JSON.stringify({ success: false, error: 'Record not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'delete') {
      store.motRecords.splice(idx, 1);
    } else {
      const record = store.motRecords[idx];
      if (body.vehicleReg !== undefined) record.vehicleReg = body.vehicleReg;
      if (body.vehicleName !== undefined) record.vehicleName = body.vehicleName;
      if (body.motDate !== undefined) record.motDate = body.motDate;
      if (body.motExpiry !== undefined) record.motExpiry = body.motExpiry;
      if (body.result !== undefined) record.result = body.result;
      if (body.advisories !== undefined) record.advisories = body.advisories;
      if (body.mileage !== undefined) record.mileage = body.mileage;
      if (body.garage !== undefined) record.garage = body.garage;
      if (body.notes !== undefined) record.notes = body.notes;
    }
  } else if (type === 'dbs') {
    const idx = store.dbsRecords.findIndex(r => r.id === id);
    if (idx === -1) {
      return new Response(JSON.stringify({ success: false, error: 'Record not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'delete') {
      store.dbsRecords.splice(idx, 1);
    } else {
      const record = store.dbsRecords[idx];
      if (body.driverName !== undefined) record.driverName = body.driverName;
      if (body.dbsNumber !== undefined) record.dbsNumber = body.dbsNumber;
      if (body.issueDate !== undefined) record.issueDate = body.issueDate;
      if (body.expiryDate !== undefined) {
        record.expiryDate = body.expiryDate;
      } else if (body.issueDate !== undefined) {
        const d = new Date(body.issueDate);
        d.setFullYear(d.getFullYear() + 3);
        record.expiryDate = d.toISOString().split('T')[0];
      }
      if (body.level !== undefined) record.level = body.level;
      if (body.role !== undefined) record.role = body.role;
      if (body.notes !== undefined) record.notes = body.notes;

      // Recompute status
      const now = new Date();
      const exp = new Date(record.expiryDate);
      const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (exp < now) record.status = 'expired';
      else if (exp <= in30) record.status = 'expiring';
      else record.status = 'valid';
    }
  }

  await writeStore(store);
  return new Response(JSON.stringify({ success: true, data: { stats: computeStats(store) } }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
