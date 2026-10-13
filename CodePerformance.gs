/**
 * trakks – Meta Performance backend (Google Apps Script)
 * Setup: open POSG_Daily_Meta_Ads_Tracker > Extensions > Apps Script > paste this file.
 * Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
 * Use the same TOKEN as the ads script, then paste this /exec URL into trakks > Settings > Meta Performance URL.
 * Reads the TOF, MOF, BOF and TOTAL tabs (one row per day, with Funnel and Brand columns). Nothing is edited.
 */
const TOKEN = 'change-me';
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
