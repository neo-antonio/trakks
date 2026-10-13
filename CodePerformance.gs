/**
 * trakks – Meta Performance backend (Google Apps Script)
 * Setup: open POSG_Daily_Meta_Ads_Tracker > Extensions > Apps Script > paste this file.
 * Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
 * Use the same TOKEN as the ads script, then paste this /exec URL into trakks > Settings > Meta Performance URL.
 * Reads the TOF, MOF, BOF and TOTAL tabs (one row per day, with Funnel and Brand columns). Nothing is edited.
 */
const TOKEN = 'change-me';
const DRIVE_FOLDER_ID = '1Z91Rs7r1KoP_01mm8mo03RTzVn9sWjEl'; // uploaded images and videos are saved here
const TABS = ['TOF', 'MOF', 'BOF', 'TOTAL'];
const FIELDS = ['Date', 'Funnel', 'Brand', 'Spent', 'Impressions', 'Reach', 'Clicks', 'Orders', 'New Customer',
  'App Install', 'In-app Order', 'Web Order', 'Conv. Value', 'LPV', 'Existing CX', 'Add to Cart', 'Checkout'];
const TZ = Session.getScriptTimeZone();

function doGet(e) {
  const p = e.parameter || {};
  if (p.token !== TOKEN) return out_({ error: 'Bad token' });
  try {
    if (p.action === 'getPerformance') return out_({ fields: FIELDS, rows: readRows_() });
    return out_({ error: 'Unknown action' });
  } catch (err) {
    return out_({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents || '{}');
    if (p.token !== TOKEN) return out_({ error: 'Bad token' });
    if (p.action === 'uploadMedia') return out_(uploadMedia_(p));
    return out_({ error: 'Unknown action' });
  } catch (err) {
    return out_({ error: String(err) });
  }
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function readRows_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), rows = [];
  TABS.forEach(tab => {
    const sh = ss.getSheetByName(tab);
    if (!sh) return;
    const v = sh.getDataRange().getValues();
    const head = v[0].map(h => String(h).trim());
    const idx = FIELDS.map(f => head.indexOf(f));
    for (let r = 1; r < v.length; r++) {
      const d = v[r][idx[0]];
      if (!(d instanceof Date)) continue;                       // skips blank / non-date rows
      rows.push(FIELDS.map((f, j) => {
        const x = idx[j] < 0 ? '' : v[r][idx[j]];
        if (f === 'Date') return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
        if (f === 'Funnel') return x || tab;
        if (f === 'Brand') return x || '';
        return x === '' || x === null ? 0 : Number(x) || 0;
      }));
    }
  });
  return rows;
}

// ---- media uploads: saves to your Drive folder and returns a preview link for trakks to attach to the ad ----
function uploadMedia_(p) {
  if (!p.data) throw new Error('Missing file');
  const stamp = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmm');
  const blob = Utilities.newBlob(Utilities.base64Decode(p.data), p.mime || 'application/octet-stream',
    stamp + '_' + String(p.name || 'upload').replace(/[\\/:*?"<>|]/g, '_'));
  let file;
  try { file = DriveApp.getFolderById(DRIVE_FOLDER_ID).createFile(blob); }
  catch (e) { throw new Error('The script cannot write to the Drive folder. Run testDrive once in the Apps Script editor, approve access, then redeploy as a new version. (' + e.message + ')'); }
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (e) { try { file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (e2) { /* inherits folder sharing */ } }
  return { ok: true, id: file.getId(), url: 'https://drive.google.com/file/d/' + file.getId() + '/preview' };
}

// Run this ONCE from the Apps Script editor (select testDrive > Run) and approve access.
// Afterwards: Deploy > Manage deployments > Edit > Version: New version > Deploy.
function testDrive() {
  const f = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  f.createFile('trakks-test.txt', 'ok').setTrashed(true);
  Logger.log('Drive folder OK: ' + f.getName());
}
