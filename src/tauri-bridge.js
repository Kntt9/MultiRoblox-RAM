/**
 * Reimplements the exact `window.api` surface the old Electron preload.js
 * exposed, on top of Tauri's invoke/listen, so renderer.js needed zero
 * call-site changes when the app moved off Electron.
 * @typedef {Object} ApiSurface
 * @property {() => Promise<void>} loadAccounts
 * @property {(account: any) => Promise<any>} addAccount
 * @property {(id: string) => Promise<any>} removeAccount
 * @property {(id: string) => Promise<any>} restoreAccount
 * @property {(id: string) => Promise<any>} purgeAccount
 * @property {() => Promise<any>} emptyTrash
 * @property {(id: string, data: any) => Promise<any>} updateAccount
 * @property {(ids: string[]) => Promise<any>} reorderAccounts
 * @property {() => Promise<any>} loadPackages
 * @property {(packages: any[]) => Promise<any>} savePackages
 * @property {() => Promise<any>} openLogin
 * @property {(username: string, password: string) => Promise<any>} openSignup
 * @property {(cookie: string) => Promise<any>} openAccountInBrowser
 * @property {() => Promise<any>} cancelLogin
 * @property {(cookie: string) => Promise<any>} validateCookie
 * @property {(percent: number) => Promise<any>} setRobloxVolume
 * @property {() => Promise<any>} killAllRoblox
 * @property {(id: string) => Promise<any>} killOneRoblox
 * @property {() => Promise<number>} getRunningCount
 * @property {() => Promise<string[]>} getWatchedIds
 * @property {() => Promise<any>} syncInstances
 * @property {() => Promise<any>} trimRobloxMemory
 * @property {(id: string) => Promise<any>} trimAccountMemory
 * @property {(id: string, priority: string) => Promise<any>} setAccountPriority
 * @property {(cb: Function) => void} onAllRobloxClosed
 * @property {(id: string, cookie: string, target: string|null) => Promise<any>} launchRoblox
 * @property {(id: string) => Promise<any>} cancelLaunch
 * @property {(url: string) => Promise<any>} openExternal
 * @property {() => Promise<string>} getAppVersion
 * @property {(id: string) => Promise<any>} trackingCapturePreview
 * @property {(id: string, username: string, webhookUrl: string, regions: string[]) => Promise<any>} trackingCaptureAndSend
 * @property {(url: string) => Promise<any>} trackingValidateWebhook
 * @property {() => Promise<any>} loadSettings
 * @property {(data: any) => Promise<any>} saveSettings
 * @property {() => Promise<any>} encStatus
 * @property {(pass: string) => Promise<any>} encUnlock
 * @property {(pass: string) => Promise<any>} encSetKey
 * @property {() => Promise<any>} clearAppData
 * @property {(password: string) => Promise<any>} backupCreate
 * @property {(password: string) => Promise<any>} backupRestore
 * @property {(password: string, keep: number) => Promise<any>} backupAutoCreate
 * @property {() => Promise<any[]>} backupList
 * @property {(name: string) => Promise<any>} backupDelete
 * @property {(path: string, password: string) => Promise<any>} backupRestorePath
 * @property {() => Promise<any>} backupAutoPassword
 * @property {() => Promise<any>} multiInstanceStatus
 * @property {() => Promise<any>} antiAfkStatus
 * @property {() => Promise<any[]>} readGenHistory
 * @property {(list: any[]) => Promise<any>} writeGenHistory
 * @property {() => Promise<any>} clearGenHistory
 * @property {() => Promise<any>} readFFlags
 * @property {(flags: any) => Promise<any>} writeFFlags
 * @property {() => Promise<any>} readFpsCap
 * @property {(cap: any) => Promise<any>} writeFpsCap
 * @property {(cb: Function) => void} onChromeProgress
 * @property {(cb: Function) => void} onRobloxClosed
 * @property {(cb: Function) => void} onRobloxStarted
 * @property {(cb: Function) => void} onRobloxCount
 * @property {(cb: Function) => void} onLogEntry
 * @property {(channel: string|null) => Promise<string>} getRobloxVersion
 * @property {(placeIdOrTarget: string, cookie: string) => Promise<any>} getGameName
 * @property {(url: string) => Promise<any>} robloxGet
 * @property {(cookie: string, username: string) => Promise<any>} followUser
 * @property {(apiKey: string, quantity: number) => Promise<any>} altgenGenerate
 * @property {() => Promise<any>} checkForUpdates
 * @property {(update: any) => Promise<any>} installUpdate
 */
(() => {
  const T = window.__TAURI__;
  const invoke = T.core.invoke;
  const listen = T.event.listen;
  const win = T.window.getCurrentWindow();

  /** @type {ApiSurface} */
  window.api = {
    minimize: () => win.minimize(),
    maximize: () => win.toggleMaximize(),
    close: () => win.close(),

    loadAccounts: () => invoke('accounts_load'),
    addAccount: (account) => invoke('accounts_add', { account }),
    removeAccount: (id) => invoke('accounts_remove', { id }),
    restoreAccount: (id) => invoke('accounts_restore', { id }),
    purgeAccount: (id) => invoke('accounts_purge', { id }),
    emptyTrash: () => invoke('accounts_empty_trash'),
    updateAccount: (id, data) => invoke('accounts_update', { id, data }),
    reorderAccounts: (ids) => invoke('accounts_reorder', { ids }),

    loadPackages: () => invoke('packages_load'),
    savePackages: (packages) => invoke('packages_save', { packages }),

    openLogin: () => invoke('roblox_open_login'),
    openSignup: (username, password) => invoke('open_signup', { username, password }),
    openAccountInBrowser: (cookie) => invoke('roblox_open_account_browser', { cookie }),
    cancelLogin: () => invoke('login_cancel'),
    validateCookie: (cookie) => invoke('roblox_validate_cookie', { cookie }),

    setRobloxVolume: (percent) => invoke('roblox_set_volume', { percent }),
    killAllRoblox: () => invoke('roblox_kill_all'),
    killOneRoblox: (id) => invoke('roblox_kill_one', { id }),
    getRunningCount: () => invoke('roblox_running_count'),
    getWatchedIds: () => invoke('roblox_watched_ids'),
    syncInstances: () => invoke('roblox_sync_instances'),
    trimRobloxMemory: () => invoke('roblox_trim_memory'),
    trimAccountMemory: (id) => invoke('roblox_trim_account_memory', { id }),
    setAccountPriority: (id, priority) => invoke('roblox_set_account_priority', { id, priority }),
    onAllRobloxClosed: (cb) => listen('roblox:allClosed', () => cb()),

    launchRoblox: (id, cookie, target) => invoke('roblox_launch', { id, cookie, target }),
    cancelLaunch: (id) => invoke('roblox_launch_cancel', { id }),
    openExternal: (url) => invoke('open_external', { url }),
    getAppVersion: () => invoke('app_version'),

    trackingCapturePreview: (id) => invoke('tracking_capture_preview', { id }),
    trackingCaptureAndSend: (id, username, webhookUrl, regions) => invoke('tracking_capture_and_send', { id, username, webhookUrl, regions }),
    trackingValidateWebhook: (url) => invoke('tracking_validate_webhook', { url }),

    loadSettings: () => invoke('settings_load'),
    saveSettings: (data) => invoke('settings_save', { data }),

    encStatus: () => invoke('enc_status'),
    encUnlock: (pass) => invoke('enc_unlock', { pass }),
    encSetKey: (pass) => invoke('enc_set_key', { pass }),
    clearAppData: () => invoke('clear_app_data'),

    backupCreate: (password) => invoke('backup_create', { password }),
    backupRestore: (password) => invoke('backup_restore', { password }),
    backupAutoCreate: (password, keep) => invoke('backup_auto_create', { password, keep }),
    backupList: () => invoke('backup_list'),
    backupDelete: (name) => invoke('backup_delete', { name }),
    backupRestorePath: (path, password) => invoke('backup_restore_path', { path, password }),
    backupAutoPassword: () => invoke('backup_auto_password'),

    multiInstanceStatus: () => invoke('multiinstance_status'),
    antiAfkStatus: () => invoke('antiafk_status'),

    readGenHistory: () => invoke('genhistory_read'),
    writeGenHistory: (list) => invoke('genhistory_write', { list }),
    clearGenHistory: () => invoke('genhistory_clear'),

    readFFlags: () => invoke('fflag_read'),
    writeFFlags: (flags) => invoke('fflag_write', { flags }),
    readFpsCap: () => invoke('fps_read'),
    writeFpsCap: (cap) => invoke('fps_write', { cap }),

    onChromeProgress: (cb) => listen('chrome:download-progress', (e) => cb(e.payload)),
    onRobloxClosed: (cb) => listen('roblox:closed', (e) => cb(e.payload)),
    onRobloxStarted: (cb) => listen('roblox:started', (e) => cb(e.payload)),
    onRobloxCount: (cb) => listen('roblox:count', (e) => cb(e.payload)),
    onLogEntry: (cb) => listen('log:entry', (e) => cb(e.payload)),

    getRobloxVersion: (channel) => invoke('roblox_get_version', { channel: channel || null }),
    getGameName: (placeId, cookie) => invoke('roblox_get_game_name', { placeIdOrTarget: placeId, cookie }),
    // *.roblox.com sends no CORS headers -- fetch() from the webview's real
    // https://tauri.localhost origin gets blocked (Electron's file:// origin was
    // exempt from this, which is why this needs a Rust-side detour).
    // Returns { ok, status, data } to mirror the fetch()+r.json() shape callers used.
    robloxGet: (url) => invoke('roblox_get_json', { url }),
    // api.altgen.me sends no Access-Control-Allow-Origin either -- same CORS
    // gap as robloxGet above. Returns { status, data } (data is the API's own
    // { success, message/error, data } JSON body).
    followUser: (cookie, username) => invoke('roblox_follow_user', { cookie, username }),
    altgenGenerate: (apiKey, quantity) => invoke('altgen_generate', { apiKey, quantity }),

    // Auto-update (tauri-plugin-updater). checkForUpdates resolves with the
    // update object { version, date, body, downloadUrl } or null when the app
    // is up to date; installUpdate(update) downloads and installs it (the app
    // relaunches itself on success on Windows).
    checkForUpdates: () => invoke('plugin:updater|check'),
    installUpdate: (update) => invoke('plugin:updater|download_and_install', { update }),
  };

  // Electron version showed the BrowserWindow only once the page had painted
  // (win.once('ready-to-show', ...)). Tauri's window starts hidden the same
  // way (see tauri.conf.json "visible": false) -- reveal it once the DOM is
  // actually ready instead of on window creation, so there's no white flash.
  const reveal = () => invoke('show_main_window').catch(() => {});
  if (document.readyState === 'complete' || document.readyState === 'interactive') reveal();
  else document.addEventListener('DOMContentLoaded', reveal);
})();
