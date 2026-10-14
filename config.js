/* trakks: fixed configuration. Deployment links live here, so nobody has to paste them in the app. */
/* demo mode is switched on from the sign-in screen and uses sample data only */
const DEMO=(()=>{try{return localStorage.getItem('trakks_demo')==='1'}catch(e){return false}})();
const LINKS = {
  upload: 'https://docs.google.com/spreadsheets/d/1eBCyRvBkeyU-FuGSXACUGPyFWe52euhDc8RSAjA3Khc/edit?gid=936638371#gid=936638371',
  brain: 'https://fs-brain-app-p3ez.vercel.app/',
  google: 'https://ads.google.com/aw/overview?ocid=358452948&euid=6531930192&__u=7221293008&uscid=358452948&__c=3251692852&authuser=0&workspaceId=0&subid=all-en-awhp-g-aw-c-home-signin-bgc!o2-s500g500%7Cib:6653296821%7Cib:9279461727%7Cib:7966379274%7C-ahpm-0000000179-0000000001',
  niktin: 'https://neo-antonio.github.io/niktin/niktin.html',
  legacy: 'https://datastudio.google.com/u/0/reporting/afb09aaa-73a9-4971-8306-ddc8e12e9b4b/page/KViwF/edit'
};

/* ads = ad-level script, perf = daily account performance script (both are Apps Script web app /exec URLs) */
const BRANDS = [
  {
    id: 'fsph', name: 'FlowerStore PH', short: 'FSPH', icon: 'flower',
    request: 'https://trello.com/b/EFLqIr3y/ph-fs-graphics',   /* Trello board for creative requests */
    ads: 'https://script.google.com/macros/s/AKfycbx6gCnH03xEHZpye-6kcba-ZFIinI2uSFzpfbdqX9HWA_z0cQpB3pqApMGrFscFywRW3w/exec',
    perf: 'https://script.google.com/macros/s/AKfycbyVLQq4B3suwv18i1W-tGb6u09HzCL4IQTGWVdvks9an3XO-t33o0ISVoBXORKlVhfY/exec',
    meta: {
      manager: 'https://adsmanager.facebook.com/adsmanager/manage/ads?act=2507660309485461&business_id=609991442720762&global_scope_id=609991442720762&column_preset=3977757712521312&date=2023-05-26_2026-06-27%2Cmaximum&insights_date=2023-05-26_2026-06-27%2Cmaximum&filter_set=ADGROUP_DELIVERY_STATUS-STRING_SET%1EIN%1E[%22active%22]&quick_view_id=3924353981195019',
      reports: 'https://adsmanager.facebook.com/adsmanager/reporting/view?act=2507660309485461&ads_manager_write_regions=true&business_id=609991442720762&selected_report_id=120251040193820091'
    }
  },
  {
    id: 'poph', name: 'Potico PH', short: 'POPH', icon: 'gift',
    request: 'https://trello.com/b/Sq22AHOI/ph-potico-graphics',   /* Trello board for creative requests */
    ads: 'https://script.google.com/macros/s/AKfycbzGUDsbi8LHmsflfFskxpPau_PO3rf3-y3zTq3GTnIt8C3q9-IiyU2SJFW08cA33-2A/exec',
    perf: 'https://script.google.com/macros/s/AKfycbw0g7YzOoNPrN1jBpPqF5fRb_-NSrQxu82FAIrrLTaulqqLjGSXqS8pGvsyzQq93MQO/exec',
    meta: {
      manager: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns?global_scope_id=609991442720762&business_id=609991442720762&act=863938515363792&redirect_session_id=21b5f4d6-1d3e-4919-b789-fcee353fb54a#',
      reports: 'https://adsmanager.facebook.com/adsmanager/reporting/view?act=863938515363792&ads_manager_write_regions=true&business_id=609991442720762&event_source=SANITIZE_METRICS&global_scope_id=609991442720762&selected_report_id=120243132243880318'
    }
  },
  {
    id: 'posg', name: 'Potico SG', short: 'POSG', icon: 'gift',
    request: 'https://trello.com/b/LVnDQNoW/sg-potico-graphics',   /* Trello board for creative requests */
    /* one script reads both the Meta tabs and the TikTok tabs (the sheet pulls from two sheets with IMPORTRANGE) */
    ads: 'https://script.google.com/macros/s/AKfycbxkY_ca2bA1YDPv-7qVA74ydmS4xXgON9YvdpwxKkHzfLSwaeJ2o1iPMiposR4bektZ/exec',
    perf: 'https://script.google.com/macros/s/AKfycbxPXcgSfgGxFpeAOhhJzp2PZTGWId8qGUGmIKe5XwHdMNfjfOEd5yiT5lojoRR6BOz5/exec',
    meta: {
      manager: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=733920126160080&business_id=649614180782606&nav_entry_point=mbs_sub_nav&attribution_windows=default&column_preset=3932644350365982&date=2026-04-05_2026-05-05&insights_date=2026-04-05_2026-05-05&filter_set=CAMPAIGN_GROUP_DELIVERY_STATUS-STRING_SET%1EIN%1E[%22active%22]',
      reports: 'https://adsmanager.facebook.com/adsmanager/reporting/view?act=733920126160080&ads_manager_write_regions=true&business_id=649614180782606&selected_report_id=120244489421750158'
    },
    tiktok: {
      manager: 'https://ads.tiktok.com/i18n/manage/campaign?aadvid=7642646222053965825&columns=campaign_budget%2Cad_id%2Cbudget%2Cbid%2Cschedule%2Cattribution_window%2Cattribution_statistic_type%2Cad_name%2Ccreative_id%2Cstat_cost%2Ccpc%2Ccpm%2Cshow_cnt%2Cclick_cnt%2Cctr%2Ctime_attr_convert_cnt%2Cskan_convert_cnt%2Ctime_attr_conversion_cost%2Cskan_conversion_cost%2Ctime_attr_conversion_rate%2Ctime_attr_conversion_rate_imp%2Cskan_conversion_rate%2Cskan_conversion_rate_imp%2Ctime_attr_effect_cnt%2Ctime_attr_effect_cost%2Ctime_attr_effect_rate%2Ctime_attr_deep_convert_cnt_v2%2Ctime_attr_cost_per_deep_convert_v2%2Ctime_attr_deep_convert_rate_v2%2Citem_source&st=2026-06-22&et=2026-06-29'
    }
  },
  {
    id: 'bull', name: 'Bull Audio', short: 'BA', icon: 'headphones',
    request: 'https://trello.com/b/yEcLeDJs/bull-audio',   /* Trello board for creative requests */
    ads: 'https://script.google.com/macros/s/AKfycbzMWTjuy1zuvqze4j3A66sna7J2mT3TXQgWN0xuX_tzplnvorCgMOBiCprSnctXLj7gTQ/exec',
    perf: 'https://script.google.com/macros/s/AKfycbwOHBIjSy_UZ3udLLEH_Cj3mRxBgZA3DXwaPf51oR9_hVT9B0wDR18n3YMXBx0iKwJm/exec',
    meta: {
      manager: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns?business_id=1309116030486331&nav_entry_point=mbs_sub_nav&act=607301129040033#',
      reports: 'https://adsmanager.facebook.com/adsmanager/reporting/view?act=607301129040033&ads_manager_write_regions=true&business_id=1309116030486331&event_source=AUTO_REDIRECT&selected_report_id=120247535937020523'
    }
  }
];

/* Backend picker (Google Sheets behind each script) */
const AD_SHEETS = [
  ['FlowerStore Ads', 'https://docs.google.com/spreadsheets/d/1ryAH7XVih2bRPDsqm_SEfQzIHr_JJmnpSwmpoD8EITw/edit?gid=526084167#gid=526084167'],
  ['Potico.ph Ads', 'https://docs.google.com/spreadsheets/d/1t-3SIE2a6fB7vCEayauPCssjcadsWOH0F7KZwQebotc/edit?gid=526084167#gid=526084167'],
  ['Potico.sg Ads (Meta)', 'https://docs.google.com/spreadsheets/d/1fMk8YmVYoy26JyIAcopv3faML_oFato9sDtD8DpxVV0/edit?usp=drive_web&ouid=117058151046762825816'],
  ['Potico.sg Ads (TikTok)', 'https://docs.google.com/spreadsheets/d/1bkMCFF26aloz_kUsDGhUOjoHFVEp_bSuFnJtmZy5fjg/edit?gid=1779908252#gid=1779908252'],
  ['Bull Audio Ads', 'https://docs.google.com/spreadsheets/d/19uoJpbDZ0D1uKynpG_4f8lnH8jaYQezReehxB8kU0CA/edit']
];
const DAILY_SHEETS = [
  ['FlowerStore PH Daily', 'https://docs.google.com/spreadsheets/d/1iy1cXgVWtmKTQiAGFF1BoBHIWtToPlUaHCWJnnFFB6M/edit?gid=0#gid=0'],
  ['Potico PH Daily', 'https://docs.google.com/spreadsheets/d/1xg4BgjZl-BbkVwPrT-IAhbSxp5ho9uHi0mC8PmSWfXs/edit?gid=1058683330#gid=1058683330'],
  ['Potico SG Daily', 'https://docs.google.com/spreadsheets/d/1omO9-MJZwk8tRKu_zRubBmEQO1Dvzvj_EZ3jiUjmDTU/edit?gid=1159985543#gid=1159985543'],
  ['Bull Audio Daily', 'https://docs.google.com/spreadsheets/d/1Hcy4-8Gr8lVu_fyaXnB5cu6G2IDDCdUzYGuCA6xSrUs/edit?gid=1058683330#gid=1058683330']
];

/* Uploaded images and videos are saved to Drive by this script (the Potico SG daily script has Drive access) */
const UPLOAD_URL = BRANDS.find(b => b.id === 'posg').perf;

/* Demo mode: every outside link goes to a public landing page, so no real account, sheet or board is exposed */
if(DEMO){
  const META='https://www.facebook.com/business/tools/ads-manager',TT='https://ads.tiktok.com/business/en/solutions/ads-manager',SHEETS='https://docs.google.com/spreadsheets',TRELLO='https://trello.com/';
  LINKS.upload=SHEETS;LINKS.brain='https://claude.ai/';LINKS.google='https://ads.google.com/';LINKS.legacy='https://lookerstudio.google.com/';
  BRANDS.forEach(b=>{b.meta.manager=META;b.meta.reports=META;if(b.tiktok)b.tiktok.manager=TT;b.request=TRELLO});
  AD_SHEETS.forEach(x=>x[1]=SHEETS);DAILY_SHEETS.forEach(x=>x[1]=SHEETS);
}
