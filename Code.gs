/**
 * trakks backend (Google Apps Script)
 * Setup: open your POSG Ads Tracker sheet > Extensions > Apps Script > paste this file.
 * Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
 * Set TOKEN below, then paste the /exec URL and the same token into trakks > Settings.
 */
const TOKEN = 'change-me';
const TABS = ['TOF Meta', 'MOF Meta', 'BOF Meta', 'TOF TikTok'];
const NUM = ['Spent','Purchases','Conv. Value','CPO','CIR','CPM','Frequency','CTR (%)','LPVr (%)','Warm','Cost/Warm','Days Active','ThumbS (2s)','HoldR (6s)'];
const DRIVE_FOLDER_ID = '1Z91Rs7r1KoP_01mm8mo03RTzVn9sWjEl'; // uploaded images and videos are saved here
const META_SHEET = 'trakks_meta';     // key | name | embed
const POINT_SHEET = 'trakks_points';  // id | key | date | ts | source | values(JSON)
const TZ = Session.getScriptTimeZone();

function doGet(e) { return handle_(e.parameter || {}); }
function doPost(e) { return handle_(JSON.parse(e.postData.contents || '{}')); }

function handle_(p) {
  if (p.token !== TOKEN) return out_({ error: 'Bad token' });
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    switch (p.action) {
      case 'getAds': return out_({ ads: readAds_(), meta: readMeta_(), points: readPoints_() });
      case 'rename': upsertMeta_(p.key, 'name', p.name); return out_({ ok: true });
      case 'embed': upsertMeta_(p.key, 'embed', p.embed); return out_({ ok: true });
      case 'addPoint': return out_({ ok: true, id: addPoint_(p.key, p.date, p.values, 'manual') });
      case 'deletePoint': deletePoint_(p.id); return out_({ ok: true });
      case 'uploadMedia': return out_(uploadMedia_(p));
      case 'snapshotAll': return out_({ ok: true, count: snapshotAll_(p.date, p.activeOnly !== false) });
      default: return out_({ error: 'Unknown action' });
    }
  } catch (err) {
    return out_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(name, headers) {
  let sh = ss_().getSheetByName(name);
  if (!sh) { sh = ss_().insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); }
  return sh;
}
function today_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }

// ---- ads (read straight from your tracker tabs; nothing there is modified) ----
function readAds_() {
  const ads = [];
  TABS.forEach(tab => {
    const sh = ss_().getSheetByName(tab);
    if (!sh) return;
    const v = sh.getDataRange().getValues();
    const head = v[0].map(String);
    for (let r = 1; r < v.length; r++) {
      const row = v[r];
      if (!row[0] && !row[1]) continue;
      const ad = { __tab: tab, __key: tab + '|' + (row[1] || ('row' + r)) };
      head.forEach((h, i) => {
        let x = row[i];
        if (!h || x === '' || x === null) return;
        if (x instanceof Date) x = Utilities.formatDate(x, TZ, 'yyyy-MM-dd');
        ad[h] = x;
      });
      ads.push(ad);
    }
  });
  return ads;
}

// ---- meta: renamed ads + previews ----
function readMeta_() {
  const sh = sheet_(META_SHEET, ['key', 'name', 'embed']);
  const m = {};
  sh.getDataRange().getValues().slice(1).forEach(r => { if (r[0]) m[r[0]] = { name: r[1], embed: r[2] }; });
  return m;
}
function upsertMeta_(key, field, value) {
  const sh = sheet_(META_SHEET, ['key', 'name', 'embed']);
  const col = field === 'name' ? 2 : 3;
  const keys = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(r => r[0]);
  let i = keys.indexOf(key);
  if (i < 0) { sh.appendRow([key, '', '']); i = sh.getLastRow() - 1; }
  sh.getRange(i + 1, col).setValue(value || '');
}

// ---- points ----
function readPoints_() {
  const sh = sheet_(POINT_SHEET, ['id', 'key', 'date', 'ts', 'source', 'values']);
  const pts = {};
  sh.getDataRange().getValues().slice(1).forEach(r => {
    if (!r[0]) return;
    const d = r[2] instanceof Date ? Utilities.formatDate(r[2], TZ, 'yyyy-MM-dd') : String(r[2]);
    (pts[r[1]] = pts[r[1]] || []).push({ id: r[0], date: d, ts: r[3], source: r[4], v: JSON.parse(r[5] || '{}') });
  });
  return pts;
}
function pick_(ad) { const v = {}; NUM.forEach(k => { if (typeof ad[k] === 'number') v[k] = ad[k]; }); return v; }
function addPoint_(key, date, values, source) {
  const id = Utilities.getUuid();
  sheet_(POINT_SHEET, ['id', 'key', 'date', 'ts', 'source', 'values'])
    .appendRow([id, key, date || today_(), Date.now(), source, JSON.stringify(values || {})]);
  return id;
}
function deletePoint_(id) {
  const sh = sheet_(POINT_SHEET, ['id', 'key', 'date', 'ts', 'source', 'values']);
  const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(r => r[0]);
  const i = ids.indexOf(id);
  if (i > 0) sh.deleteRow(i + 1);
}

// Saves today's point for every ad. Running it twice on the same day replaces the earlier auto point.
function snapshotAll_(date, activeOnly) {
  date = date || today_();
  const sh = sheet_(POINT_SHEET, ['id', 'key', 'date', 'ts', 'source', 'values']);
  const ads = readAds_().filter(a => !activeOnly || a.Status === 'Active');
  const keys = {}; ads.forEach(a => keys[a.__key] = true);
  const data = sh.getDataRange().getValues();
  for (let r = data.length - 1; r >= 1; r--) {
    const d = data[r][2] instanceof Date ? Utilities.formatDate(data[r][2], TZ, 'yyyy-MM-dd') : String(data[r][2]);
    if (data[r][4] === 'auto' && d === date && keys[data[r][1]]) sh.deleteRow(r + 1);
  }
  const rows = ads.map(a => [Utilities.getUuid(), a.__key, date, Date.now(), 'auto', JSON.stringify(pick_(a))]);
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 6).setValues(rows);
  return rows.length;
}

// Optional: run once to save points automatically every day around 11pm.
function installDailyTrigger() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'dailySnapshot').forEach(ScriptApp.deleteTrigger);
  ScriptApp.newTrigger('dailySnapshot').timeBased().everyDays(1).atHour(23).create();
}
function dailySnapshot() { snapshotAll_(today_(), true); }

// ---- media uploads: saves to your Drive folder and uses the file as the ad's preview ----
// Note: the first time you deploy this, Google asks you to authorize Drive access.
function uploadMedia_(p) {
  if (!p.data || !p.key) throw new Error('Missing file');
  const stamp = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmm');
  const blob = Utilities.newBlob(Utilities.base64Decode(p.data), p.mime || 'application/octet-stream', stamp + '_' + String(p.name || 'upload').replace(/[\\/:*?"<>|]/g, '_'));
  const file = DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (e) { try { file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (e2) { /* inherits folder sharing */ } }
  const url = 'https://drive.google.com/file/d/' + file.getId() + '/preview';
  upsertMeta_(p.key, 'embed', url);
  return { ok: true, id: file.getId(), url: url };
}
