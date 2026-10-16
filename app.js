import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, orderBy, limit, serverTimestamp, Timestamp, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCzwy9G2zvgQIIneSGVlG24I9mlgeg3zlw",
  authDomain: "spare-part-records.firebaseapp.com",
  projectId: "spare-part-records",
  storageBucket: "spare-part-records.firebasestorage.app",
  messagingSenderId: "984845054148",
  appId: "1:984845054148:web:c38a146e722052a14e9991",
  measurementId: "G-QGD6R21XD4"
};
const configured = !firebaseConfig.apiKey.startsWith("YOUR_");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app), storage = getStorage(app), auth = getAuth(app);

// ---------- i18n: [key, English, Thai] ----------
const D = [
 ['title','Spare Part Records','บันทึกการเปลี่ยนอะไหล่'],['sub','Log parts replaced on the line','OJMT EQUIPMENT'],['theme','Theme','ธีม'],
 ['tabRec','New record','บันทึกใหม่'],['tabHis','History','ประวัติ'],
 ['s1','Replacement details','ข้อมูลการเปลี่ยน'],['machine','Machine / station','เครื่องจักร / สถานี'],['selMachine','Select a machine or station','เลือกเครื่องจักรหรือสถานี'],
 ['searchM','Search machines…','ค้นหาเครื่องจักร…'],['noMatch','No matching machine','ไม่พบเครื่องจักร'],['tech','Technician name','ชื่อช่างผู้บันทึก'],['techPh','Your name','ชื่อของคุณ'],
 ['date','Replacement date & time','วันที่และเวลาที่เปลี่ยน'],['s2','Spare parts used','รายการอะไหล่ที่เปลี่ยน'],['add','+ Add part','+ เพิ่มอะไหล่'],['part','Part','อะไหล่ที่'],['remove','Remove','ลบ'],
 ['code','Part code','รหัสอะไหล่'],['name','Part name','ชื่ออะไหล่'],['qty','Quantity','จำนวน'],['unit','Unit','หน่วย'],['serial','Serial / Lot no.','Serial / Lot No.'],['remark','Item remark','หมายเหตุรายการ'],['opt','Optional','ไม่บังคับ'],
 ['s3','Photos Parts','รูปภาพอะไหล่'],['camera','Take photo','ถ่ายรูป'],['gallery','Choose from gallery','เลือกจากแกลเลอรี'],['noPhoto','No photos attached yet.','ยังไม่มีรูปภาพ'],
 ['s4','General remarks','หมายเหตุทั่วไป'],['remarksPh','Cause of failure, follow-up needed, etc.','สาเหตุที่เสีย, สิ่งที่ต้องติดตาม ฯลฯ'],
 ['clear','Clear form','ล้างฟอร์ม'],['save','Save record','บันทึกข้อมูล'],['confirmClear','Clear everything on this form?','ล้างข้อมูลทั้งหมดในฟอร์มนี้?'],
 ['minOne','At least one part row is needed.','ต้องมีอย่างน้อย 1 แถวอะไหล่'],['fix','Please fix the highlighted fields.','กรุณาแก้ไขช่องที่มีกรอบสีแดง'],['addOne','Add at least one spare part.','กรุณาเพิ่มอะไหล่อย่างน้อย 1 รายการ'],
 ['noCfg','Firebase is not configured. Fill in firebaseConfig in the code.','ยังไม่ได้ตั้งค่า Firebase — กรอก firebaseConfig ในโค้ด'],['saved','Record {id} saved.','บันทึก {id} เรียบร้อย'],
 ['fail','Could not save: {e}. Your entries are kept — try again.','บันทึกไม่สำเร็จ: {e} ข้อมูลยังอยู่ในฟอร์ม ลองใหม่ได้'],['up','Uploading photo {i}/{n}…','กำลังอัปโหลดรูป {i}/{n}…'],['saving','Saving record…','กำลังบันทึก…'],
 ['hSearch','Search ID, machine, technician, part…','ค้นหา รหัสบันทึก / เครื่อง / ช่าง / อะไหล่'],['allM','All machines','ทุกเครื่องจักร'],['from','From','ตั้งแต่'],['to','To','ถึง'],['refresh','Refresh','รีเฟรช'],
 ['loading','Loading…','กำลังโหลด…'],['empty','No records found.','ไม่พบรายการ'],['sum','{r} records · {p} part lines','{r} รายการ · {p} แถวอะไหล่'],['by','By','โดย'],['nItems','{n} parts','{n} อะไหล่'],
 ['photos','Photos','รูปภาพ'],['rem','Remarks','หมายเหตุ'],['noExport','Nothing to export.','ไม่มีข้อมูลให้ส่งออก'],['loadFail','Could not load history: {e}','โหลดประวัติไม่สำเร็จ: {e}'],
 ['xRid','Record ID','รหัสบันทึก'],['xMachine','Machine','เครื่องจักร'],['xDate','Replacement date','วันที่เปลี่ยน'],['xBy','Recorded by','ผู้บันทึก'],['xRemark','General remarks','หมายเหตุทั่วไป'],['xImg','Image URLs','ลิงก์รูปภาพ']
];
let lang = localStorage.lang || 'th';
const extraI18n = { clearFilters: { en: 'Clear filters', th: 'ล้างตัวกรอง' } };
const t = (k, v = {}) => { const r = D.find(x => x[0] === k); let s = extraI18n[k]?.[lang] ?? (r ? r[lang === 'th' ? 2 : 1] : k); for (const a in v) s = s.replace(`{${a}}`, v[a]); return s; };
Object.assign(extraI18n, {
  edit: { en: 'Edit record', th: 'แก้ไขรายการ' }, editTitle: { en: 'Edit record', th: 'แก้ไขประวัติการเปลี่ยนอะไหล่' },
  editSave: { en: 'Save changes', th: 'บันทึกการแก้ไข' }, editCancel: { en: 'Cancel', th: 'ยกเลิก' },
  editAddPart: { en: 'Add part', th: 'เพิ่มอะไหล่' }, editSaved: { en: 'Record updated.', th: 'บันทึกการแก้ไขแล้ว' },
  editFail: { en: 'Could not update record: {e}', th: 'แก้ไขรายการไม่สำเร็จ: {e}' },
  editNeedPart: { en: 'Keep at least one part.', th: 'ต้องมีรายการอะไหล่อย่างน้อย 1 รายการ' },
  deleteRecord: { en: 'Delete record', th: 'ลบรายการ' }, confirmDelete: { en: 'Delete this record permanently?', th: 'ยืนยันลบบันทึกนี้ถาวรหรือไม่?' },
  deleteSaved: { en: 'Record and attached photos deleted.', th: 'ลบบันทึกและรูปภาพแล้ว' },
  deleteImageFail: { en: 'Record deleted, but one or more photos could not be deleted.', th: 'ลบบันทึกแล้ว แต่ลบรูปภาพบางรูปไม่สำเร็จ' },
  deleteFail: { en: 'Could not delete record: {e}', th: 'ลบรายการไม่สำเร็จ: {e}' },
  useCustomMachine: { en: 'Use custom machine: {name}', th: 'ใช้ชื่อเครื่องจักรที่กรอก: {name}' },
  audit: { en: 'Change log / Recycle bin', th: 'ประวัติการแก้ไข / ถังรายการที่ลบ' },
  auditTitle: { en: 'Record activity', th: 'ประวัติรายการ' }, auditEmpty: { en: 'No changes yet.', th: 'ยังไม่มีประวัติการเปลี่ยนแปลง' },
  restore: { en: 'Restore', th: 'กู้คืน' }, restoreConfirm: { en: 'Restore the record to this saved version?', th: 'กู้คืนรายการเป็นข้อมูลชุดนี้หรือไม่?' },
  restored: { en: 'Record restored.', th: 'กู้คืนรายการแล้ว' }, restoreFail: { en: 'Could not restore record: {e}', th: 'กู้คืนไม่สำเร็จ: {e}' },
  actionEdit: { en: 'Edited', th: 'แก้ไข' }, actionDelete: { en: 'Moved to recycle bin', th: 'ย้ายไปถังรายการที่ลบ' }, actionRestore: { en: 'Restored', th: 'กู้คืน' },
  loginTitle: { en: 'Sign in to delete', th: 'เข้าสู่ระบบเพื่อยืนยันการลบ' }, loginHint: { en: 'Deletion requires an authorized account.', th: 'ต้องใช้บัญชีที่ได้รับอนุญาตเพื่อลบรายการ' },
  email: { en: 'Email', th: 'อีเมล' }, password: { en: 'Password', th: 'รหัสผ่าน' }, login: { en: 'Sign in and continue', th: 'เข้าสู่ระบบและดำเนินการต่อ' },
  loginFail: { en: 'Sign-in failed: {e}', th: 'เข้าสู่ระบบไม่สำเร็จ: {e}' }, deleteMoved: { en: 'Record moved to recycle bin.', th: 'ย้ายรายการไปถังรายการที่ลบแล้ว' },
  duplicateConfirm: { en: 'A similar part entry already exists for this machine and date ({matches}). Save anyway?', th: 'พบรายการอะไหล่ซ้ำของเครื่องจักรและวันที่นี้ ({matches}) ต้องการบันทึกต่อหรือไม่?' },
  duplicateCheckFail: { en: 'Could not check for duplicates. Continue saving anyway?', th: 'ตรวจสอบรายการซ้ำไม่สำเร็จ ต้องการบันทึกต่อหรือไม่?' },
  confirmDelete: { en: 'Move this record to the recycle bin?', th: '\u0e22\u0e49\u0e32\u0e22\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e19\u0e35\u0e49\u0e44\u0e1b\u0e16\u0e31\u0e07\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e17\u0e35\u0e48\u0e25\u0e1a\u0e2b\u0e23\u0e37\u0e2d\u0e44\u0e21\u0e48?' },
  deleteSaved: { en: 'Record moved to recycle bin.', th: '\u0e22\u0e49\u0e32\u0e22\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e44\u0e1b\u0e16\u0e31\u0e07\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e17\u0e35\u0e48\u0e25\u0e1a\u0e41\u0e25\u0e49\u0e27' },
  deleteMoved: { en: 'Record moved to recycle bin.', th: '\u0e22\u0e49\u0e32\u0e22\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e44\u0e1b\u0e16\u0e31\u0e07\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e17\u0e35\u0e48\u0e25\u0e1a\u0e41\u0e25\u0e49\u0e27' },
  checkingDuplicates: { en: 'Checking duplicates…', th: 'กำลังตรวจสอบรายการซ้ำ…' }
});
function applyI18n(root = document) {
  root.querySelectorAll('[data-i]').forEach(e => e.textContent = t(e.dataset.i));
  root.querySelectorAll('[data-ph]').forEach(e => e.placeholder = t(e.dataset.ph));
}

// ---------- Helpers ----------
const MACHINES = ['Laser VIN Mark','Hoist Body','Hoist Rear Chassis','Hoist Front Chassis','Hoist Battery','Laser VIN Label','Sunroof','IP','Robot Glue','Conveyor Trim 1','Conveyor Trim 2','HANGER','Lifter Hanger Trim 1','Lifter Hanger Trim 2','Lifter Rear Chassis','Lifter Front Chassis','Lifter Battery','AGV','Assist Device Torque','Assist Device Tire','Filling Coolant','AC/BK','Wheel Alignment','Brake Test','Slip Slide Test','Speed Test','ADAS','ADAS V23','Rain Test','Charger Test 1','Charger Test 2'];
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');
const nowLocal = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const newRecordId = () => { const d = new Date(); return `REC-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = d => d ? d.toLocaleString(lang === 'th' ? 'th-TH-u-ca-gregory' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '';
const recordSnapshot = record => { const { _date, updated_at, ...data } = record; return data; };
function toast(msg, type = 'ok') {
  const e = document.createElement('div');
  e.className = `max-w-md rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${type === 'ok' ? 'bg-emerald-700' : 'bg-red-700'}`;
  e.textContent = msg; $('#toasts').append(e);
  setTimeout(() => e.remove(), type === 'ok' ? 4000 : 7000);
}

// ---------- Theme / language / tabs ----------
$('#themeBtn').onclick = () => { localStorage.theme = document.documentElement.classList.toggle('dark') ? 'dark' : 'light'; };
function setLang(l) {
  lang = l; localStorage.lang = l; document.documentElement.lang = l;
  $('#langBtn').textContent = l === 'th' ? 'EN' : 'TH';
  applyI18n(); renumber(); setBusy(false); fillMachineFilter(); if (records) renderHistory();
}
$('#langBtn').onclick = () => setLang(lang === 'th' ? 'en' : 'th');
function setTab(h) {
  $('#tRec').setAttribute('aria-selected', !h); $('#tHis').setAttribute('aria-selected', h);
  $('#tRec').tabIndex = h ? -1 : 0; $('#tHis').tabIndex = h ? 0 : -1;
  $('#vRec').classList.toggle('hidden', h); $('#vHis').classList.toggle('hidden', !h);
  if (h && !records) loadHistory();
}
$('#tRec').onclick = () => setTab(false); $('#tHis').onclick = () => setTab(true);
document.querySelector('[role="tablist"]').addEventListener('keydown', e => {
  const tabs = [$('#tRec'), $('#tHis')], current = tabs.indexOf(document.activeElement);
  if (current < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (current + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
  tabs[next].focus(); tabs[next].click();
});

// ---------- Machine dropdown with search ----------
let machine = '';
const mBtn = $('#mBtn'), mPanel = $('#mPanel'), mSearch = $('#mSearch'), mList = $('#mList');
function renderMachines(q = '') {
  const search = q.trim(), normalized = search.toLowerCase();
  const f = MACHINES.filter(m => m.toLowerCase().includes(normalized));
  mList.innerHTML = '';
  if (!f.length) mList.innerHTML = `<li class="px-4 py-3 text-slate-500">${t('noMatch')}</li>`;
  f.forEach(m => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option'); li.tabIndex = 0; li.textContent = m; li.className = 'opt' + (m === machine ? ' sel' : '');
    li.onclick = () => pick(m); li.onkeydown = e => { if (e.key === 'Enter') pick(m); };
    mList.append(li);
  });
  if (search && !MACHINES.some(m => m.toLowerCase() === normalized)) {
    const custom = document.createElement('li');
    custom.setAttribute('role', 'option'); custom.tabIndex = 0; custom.className = 'opt sel custom-opt';
    custom.textContent = t('useCustomMachine', { name: search });
    custom.onclick = () => pick(search); custom.onkeydown = e => { if (e.key === 'Enter') pick(search); };
    mList.append(custom);
  }
}
function togglePanel(open) {
  mPanel.classList.toggle('hidden', !open); mBtn.setAttribute('aria-expanded', open);
  if (open) { mSearch.value = ''; renderMachines(); mSearch.focus(); }
}
function pick(m) {
  machine = m; const l = $('#mLabel'); l.textContent = m; l.removeAttribute('data-i'); l.classList.remove('text-slate-500', 'dark:text-slate-400');
  mBtn.classList.remove('invalid'); togglePanel(false); mBtn.focus();
}
mBtn.onclick = () => togglePanel(mPanel.classList.contains('hidden'));
mSearch.oninput = () => renderMachines(mSearch.value);
mSearch.onkeydown = e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const exact = MACHINES.find(m => m.toLowerCase() === mSearch.value.trim().toLowerCase());
  if (exact) pick(exact);
  else (mList.querySelector('.custom-opt') || mList.querySelector('.opt'))?.click();
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') togglePanel(false); });
document.addEventListener('click', e => { if (!$('#mWrap').contains(e.target)) togglePanel(false); });

// ---------- Spare part rows ----------
const itemsEl = $('#items');
function addItem() {
  const d = document.createElement('div');
  d.className = 'card item border-l-4 border-l-red-500';
  d.innerHTML = `
    <div class="mb-3 flex items-center justify-between">
      <span class="item-title font-semibold"></span>
      <button type="button" class="rm btn btn-ghost !min-h-[36px] !px-3 text-red-600 dark:text-red-400" data-i="remove"></button>
    </div>
    <div class="grid gap-3 sm:grid-cols-6">
      <div class="sm:col-span-2"><label class="lbl" data-i="code"></label><input data-f="part_code" class="field" placeholder="BRG-6204"></div>
      <div class="sm:col-span-4"><label class="lbl" data-i="name"></label><input data-f="part_name" class="field"></div>
      <div class="sm:col-span-2"><label class="lbl"><span data-i="qty"></span> *</label><input data-f="quantity" type="number" min="1" step="any" inputmode="decimal" value="1" class="field"></div>
      <div class="sm:col-span-2"><label class="lbl" data-i="unit"></label><input data-f="unit" list="units" value="Pcs" class="field"></div>
      <div class="sm:col-span-2"><label class="lbl" data-i="serial"></label><input data-f="serial_no" class="field" data-ph="opt"></div>
      <div class="sm:col-span-6"><label class="lbl" data-i="remark"></label><input data-f="remark" class="field" data-ph="opt"></div>
    </div>`;
  d.querySelector('.rm').onclick = () => { if (itemsEl.children.length === 1) return toast(t('minOne'), 'err'); d.remove(); renumber(); };
  itemsEl.append(d); applyI18n(d); renumber(); return d;
}
function renumber() { [...itemsEl.children].forEach((el, i) => el.querySelector('.item-title').textContent = `${t('part')} ${i + 1}`); }
$('#addItem').onclick = () => addItem().querySelector('input').focus();

// ---------- Images ----------
let images = [];
function addFiles(list) { [...list].filter(f => f.type.startsWith('image/')).forEach(file => images.push({ file, url: URL.createObjectURL(file) })); renderThumbs(); }
function renderThumbs() {
  const box = $('#thumbs'); box.innerHTML = ''; $('#noImg').classList.toggle('hidden', images.length > 0);
  images.forEach((im, i) => {
    const w = document.createElement('div');
    w.className = 'relative aspect-square overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600';
    w.innerHTML = `<img src="${im.url}" alt="${i + 1}" class="h-full w-full object-cover"><button type="button" aria-label="Remove ${i + 1}" class="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-red-600">✕</button>`;
    w.querySelector('button').onclick = () => { URL.revokeObjectURL(im.url); images.splice(i, 1); renderThumbs(); };
    box.append(w);
  });
}
['camIn', 'galIn'].forEach(id => $('#' + id).onchange = e => { addFiles(e.target.files); e.target.value = ''; });
async function compress(file) {   // downscale to max 1600px JPEG; fall back to the original
  try {
    const bmp = await createImageBitmap(file), s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
    return blob && blob.size < file.size ? { blob, type: 'image/jpeg' } : { blob: file, type: file.type };
  } catch { return { blob: file, type: file.type }; }
}

// ---------- Reset / validate / submit ----------
function resetForm() {
  machine = ''; const l = $('#mLabel'); l.dataset.i = 'selMachine'; l.classList.add('text-slate-500', 'dark:text-slate-400');
  $('#tech').value = ''; $('#remarks').value = ''; $('#date').value = nowLocal();
  images.forEach(i => URL.revokeObjectURL(i.url)); images = []; renderThumbs();
  itemsEl.innerHTML = ''; addItem(); applyI18n();
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}
$('#resetBtn').onclick = () => { if (confirm(t('confirmClear'))) resetForm(); };

function collectItems() {
  const out = []; let ok = true;
  [...itemsEl.children].forEach(row => {
    const v = {}; row.querySelectorAll('[data-f]').forEach(i => { i.classList.remove('invalid'); v[i.dataset.f] = i.value.trim(); });
    if (!v.part_code && !v.part_name && !v.serial_no && !v.remark) return;   // ignore blank rows
    const qty = parseFloat(v.quantity);
    if (!v.part_code && !v.part_name) { row.querySelector('[data-f=part_name]').classList.add('invalid'); ok = false; }
    if (!(qty > 0)) { row.querySelector('[data-f=quantity]').classList.add('invalid'); ok = false; }
    out.push({ part_code: v.part_code, part_name: v.part_name, quantity: qty, unit: v.unit, serial_no: v.serial_no, remark: v.remark });
  });
  return { items: out, ok };
}
function validate() {
  let ok = true; const bad = el => { el.classList.add('invalid'); ok = false; };
  [$('#tech'), $('#date'), mBtn].forEach(e => e.classList.remove('invalid'));
  if (!machine) bad(mBtn); if (!$('#tech').value.trim()) bad($('#tech')); if (!$('#date').value) bad($('#date'));
  const { items, ok: iok } = collectItems();
  if (!items.length) { bad(itemsEl.querySelector('[data-f=part_name]')); toast(t('addOne'), 'err'); }
  if (!iok) ok = false;
  if (!ok) toast(t('fix'), 'err');
  return ok ? items : null;
}
function localDateKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
async function confirmNoDuplicateParts(items, machineName, dateValue) {
  const codes = items.map(i => i.part_code.trim()).filter(Boolean);
  const duplicateCodes = new Set();
  const seen = new Set();
  for (const code of codes) {
    const key = code.toLowerCase();
    if (seen.has(key)) duplicateCodes.add(code);
    seen.add(key);
  }
  try {
    const snap = await getDocs(query(collection(db, 'spare_part_records'), orderBy('created_at', 'desc'), limit(500)));
    const day = localDateKey(dateValue), machineKey = machineName.trim().toLowerCase();
    snap.docs.forEach(d => {
      const record = d.data();
      if (record.deleted_at || record.machine_name?.trim().toLowerCase() !== machineKey || !record.replacement_date?.toDate) return;
      if (localDateKey(record.replacement_date.toDate()) !== day) return;
      (record.items || []).forEach(existing => {
        if (codes.some(code => code.toLowerCase() === String(existing.part_code || '').trim().toLowerCase())) duplicateCodes.add(existing.part_code);
      });
    });
  } catch (err) {
    console.warn('Duplicate check failed', err);
    return confirm(t('duplicateCheckFail'));
  }
  if (!duplicateCodes.size) return true;
  return confirm(t('duplicateConfirm', { matches: [...duplicateCodes].join(', ') }));
}
function setBusy(on, label) {
  ['#saveBtn', '#resetBtn', '#addItem'].forEach(s => $(s).disabled = on);
  $('#saveBtn').innerHTML = on ? `<span class="spin"></span><span>${esc(label)}</span>` : `<span>${t('save')}</span>`;
}
$('#vRec').addEventListener('submit', async e => {
  e.preventDefault();
  const items = validate(); if (!items) return;
  if (!configured) return toast(t('noCfg'), 'err');
  setBusy(true, t('checkingDuplicates'));
  if (!(await confirmNoDuplicateParts(items, machine, $('#date').value))) { setBusy(false); return; }
  setBusy(false);
  const record_id = newRecordId();
  try {
    const urls = [];
    for (let i = 0; i < images.length; i++) {       // Storage: spare_part_records/{record_id}/{timestamp}_{filename}
      setBusy(true, t('up', { i: i + 1, n: images.length }));
      const { blob, type } = await compress(images[i].file);
      const r = ref(storage, `spare_part_records/${record_id}/${Date.now()}_${images[i].file.name.replace(/[^\w.\-]+/g, '_')}`);
      await uploadBytes(r, blob, { contentType: type || 'image/jpeg' });
      urls.push(await getDownloadURL(r));
    }
    setBusy(true, t('saving'));
    await setDoc(doc(db, 'spare_part_records', record_id), {
      record_id, machine_name: machine, replacement_date: Timestamp.fromDate(new Date($('#date').value)),
      recorded_by: $('#tech').value.trim(), items, images: urls, general_remarks: $('#remarks').value.trim(), created_at: serverTimestamp()
    });
    toast(t('saved', { id: record_id })); records = null; resetForm();
  } catch (err) { console.error(err); toast(t('fail', { e: err.code || err.message }), 'err'); }
  finally { setBusy(false); }
});

// ---------- History ----------
let records = null;
function fillMachineFilter() {
  const s = $('#hM'), cur = s.value;
  const names = [...new Set([...MACHINES, ...(records || []).map(r => r.machine_name).filter(Boolean)])];
  s.innerHTML = `<option value="">${t('allM')}</option>` + names.map(m => `<option>${esc(m)}</option>`).join(''); s.value = cur;
}
async function loadHistory() {
  const box = $('#hList'); $('#hSum').textContent = '';
  if (!configured) { box.innerHTML = `<div class="card text-center text-slate-500">${t('noCfg')}</div>`; return; }
  box.innerHTML = `<div class="card flex items-center justify-center gap-3 text-slate-500"><span class="spin"></span>${t('loading')}</div>`;
  try {
    const snap = await getDocs(query(collection(db, 'spare_part_records'), orderBy('created_at', 'desc'), limit(500)));
    records = snap.docs.map(d => { const x = d.data(); return { ...x, items: x.items || [], images: x.images || [], _date: x.replacement_date?.toDate?.() || null }; }).filter(r => !r.deleted_at);
    fillMachineFilter();
    renderHistory();
  } catch (err) { console.error(err); box.innerHTML = `<div class="card text-red-600">${esc(t('loadFail', { e: err.code || err.message }))}</div>`; }
}
let auditEntries = [];
const auditDialog = $('#auditDialog');
async function loadAudit() {
  const box = $('#auditList');
  box.innerHTML = `<div class="card text-center text-slate-500">${t('loading')}</div>`;
  if (!auditDialog.open) auditDialog.showModal();
  try {
    const snap = await getDocs(query(collection(db, 'spare_part_record_audit'), orderBy('changed_at', 'desc'), limit(300)));
    auditEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAudit();
  } catch (err) {
    console.error(err);
    box.innerHTML = `<div class="card text-red-600">${esc(t('loadFail', { e: err.code || err.message }))}</div>`;
  }
}
function renderAudit() {
  const box = $('#auditList');
  if (!auditEntries.length) { box.innerHTML = `<div class="card text-center text-slate-500">${t('auditEmpty')}</div>`; return; }
  const actionText = { edit: t('actionEdit'), delete: t('actionDelete'), restore: t('actionRestore') };
  box.innerHTML = auditEntries.map(entry => `
    <article class="card space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <strong>${esc(actionText[entry.action] || entry.action)} · ${esc(entry.record_id)}</strong>
        ${entry.before ? `<button type="button" class="btn btn-ghost restore-audit !min-h-0" data-audit-id="${esc(entry.id)}" data-i="restore"></button>` : ''}
      </div>
      <p class="text-sm text-slate-600 dark:text-slate-300">${fmt(entry.changed_at?.toDate?.() || null)} · ${esc(entry.changed_by || '')}</p>
      ${entry.before?.machine_name ? `<p class="text-sm">${esc(entry.before.machine_name)} · ${esc(entry.before.recorded_by || '')}</p>` : ''}
    </article>`).join('');
  applyI18n(box);
}
$('#auditBtn').onclick = loadAudit;
$('#auditClose').onclick = () => auditDialog.close();
$('#auditList').addEventListener('click', async e => {
  const button = e.target.closest('.restore-audit');
  if (!button || !confirm(t('restoreConfirm'))) return;
  const entry = auditEntries.find(item => item.id === button.dataset.auditId);
  if (!entry?.before) return;
  button.disabled = true;
  try {
    const recordRef = doc(db, 'spare_part_records', entry.record_id);
    const currentSnap = await getDoc(recordRef);
    const current = currentSnap.exists() ? currentSnap.data() : null;
    const restored = { ...entry.before, deleted_at: null, deleted_by: null, updated_at: serverTimestamp() };
    const batch = writeBatch(db);
    batch.set(recordRef, restored);
    batch.set(doc(collection(db, 'spare_part_record_audit')), {
      record_id: entry.record_id, action: 'restore', before: current,
      after: { ...entry.before, deleted_at: null, deleted_by: null },
      changed_by: auth.currentUser?.email || 'anonymous', changed_at: serverTimestamp()
    });
    await batch.commit();
    records = null; await loadHistory(); await loadAudit(); toast(t('restored'));
  } catch (err) {
    console.error(err); toast(t('restoreFail', { e: err.code || err.message }), 'err'); button.disabled = false;
  }
});
function filtered() {
  const q = $('#hQ').value.trim().toLowerCase(), m = $('#hM').value, f = $('#hFrom').value, to = $('#hTo').value;
  const fd = f ? new Date(f + 'T00:00:00') : null, td = to ? new Date(to + 'T23:59:59') : null;
  return (records || []).filter(r => (!m || r.machine_name === m) && (!fd || r._date >= fd) && (!td || r._date <= td) &&
    (!q || [r.record_id, r.machine_name, r.recorded_by, r.general_remarks, ...r.items.flatMap(i => [i.part_code, i.part_name, i.serial_no])].join(' ').toLowerCase().includes(q)));
}
function renderHistory() {
  const list = filtered(), box = $('#hList');
  $('#hSum').textContent = t('sum', { r: list.length, p: list.reduce((n, r) => n + r.items.length, 0) });
  if (!list.length) { box.innerHTML = `<div class="card text-center text-slate-500">${t('empty')}</div>`; return; }
  box.innerHTML = list.map(r => `
    <details class="card !p-0 overflow-hidden">
      <summary class="flex cursor-pointer list-none items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="text-base font-semibold">${esc(r.machine_name)}</span>
            <span class="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-500/20 dark:text-red-300">${t('nItems', { n: r.items.length })}</span>
            ${r.images.length ? `<span class="text-xs text-slate-500">📷 ${r.images.length}</span>` : ''}
          </div>
          <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">${fmt(r._date)} · ${t('by')} ${esc(r.recorded_by)} · ${esc(r.record_id)}</div>
        </div>
        <span class="chev text-slate-400 transition" aria-hidden="true">▾</span>
      </summary>
      <div class="space-y-3 border-t border-slate-200 p-4 dark:border-slate-700">
        <div class="flex justify-end gap-2"><button type="button" class="btn btn-ghost edit-record" data-edit-id="${esc(r.record_id)}" data-i="edit"></button><button type="button" class="btn btn-danger delete-record" data-delete-id="${esc(r.record_id)}" data-i="deleteRecord"></button></div>
        <div class="overflow-x-auto"><table class="w-full min-w-[520px] text-left text-sm">
          <thead class="text-slate-500"><tr><th class="py-1 pr-3">${t('code')}</th><th class="pr-3">${t('name')}</th><th class="pr-3">${t('qty')}</th><th class="pr-3">Serial / Lot</th><th>${t('remark')}</th></tr></thead>
          <tbody>${r.items.map(i => `<tr class="border-t border-slate-100 dark:border-slate-800"><td class="py-2 pr-3 font-medium">${esc(i.part_code)}</td><td class="pr-3">${esc(i.part_name)}</td><td class="pr-3">${esc(i.quantity)} ${esc(i.unit)}</td><td class="pr-3">${esc(i.serial_no)}</td><td>${esc(i.remark)}</td></tr>`).join('')}</tbody>
        </table></div>
        ${r.general_remarks ? `<p class="text-sm"><b>${t('rem')}:</b> ${esc(r.general_remarks)}</p>` : ''}
        ${r.images.length ? `<div class="flex flex-wrap gap-2">${r.images.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" loading="lazy" alt="" class="h-20 w-20 rounded-lg border border-slate-200 object-cover dark:border-slate-700"></a>`).join('')}</div>` : ''}
      </div>
    </details>`).join('');
  applyI18n(box);
}
const editDialog = $('#editDialog'), editItemsEl = $('#editItems');
let editingRecord = null;
function addEditItem(item = {}) {
  const row = document.createElement('div');
  row.className = 'card edit-part space-y-3';
  row.innerHTML = `
    <div class="flex justify-end"><button type="button" class="btn btn-ghost remove-edit-part !min-h-0 px-3 text-red-600" aria-label="${esc(t('remove'))}">×</button></div>
    <div class="grid gap-3 sm:grid-cols-6">
      <div class="sm:col-span-2"><label class="lbl">${esc(t('code'))}</label><input data-edit-field="part_code" class="field" value="${esc(item.part_code)}"></div>
      <div class="sm:col-span-4"><label class="lbl">${esc(t('name'))}</label><input data-edit-field="part_name" class="field" value="${esc(item.part_name)}"></div>
      <div class="sm:col-span-2"><label class="lbl">${esc(t('qty'))} *</label><input data-edit-field="quantity" type="number" min="0.01" step="any" class="field" value="${esc(item.quantity ?? 1)}"></div>
      <div class="sm:col-span-2"><label class="lbl">${esc(t('unit'))}</label><input data-edit-field="unit" list="units" class="field" value="${esc(item.unit || 'Pcs')}"></div>
      <div class="sm:col-span-2"><label class="lbl">${esc(t('serial'))}</label><input data-edit-field="serial_no" class="field" value="${esc(item.serial_no)}"></div>
      <div class="sm:col-span-6"><label class="lbl">${esc(t('remark'))}</label><input data-edit-field="remark" class="field" value="${esc(item.remark)}"></div>
    </div>`;
  row.querySelector('.remove-edit-part').onclick = () => {
    if (editItemsEl.children.length === 1) return toast(t('editNeedPart'), 'err');
    row.remove();
  };
  editItemsEl.append(row);
}
function openEdit(recordId) {
  editingRecord = (records || []).find(r => r.record_id === recordId);
  if (!editingRecord) return;
  $('#editMachine').value = editingRecord.machine_name || '';
  $('#editTech').value = editingRecord.recorded_by || '';
  const d = editingRecord._date || new Date();
  $('#editDate').value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  $('#editRemarks').value = editingRecord.general_remarks || '';
  editItemsEl.innerHTML = '';
  (editingRecord.items.length ? editingRecord.items : [{}]).forEach(addEditItem);
  editDialog.showModal();
}
$('#hList').addEventListener('click', e => {
  const button = e.target.closest('.edit-record');
  if (button) openEdit(button.dataset.editId);
});
let pendingDeleteId = null;
$('#hList').addEventListener('click', e => {
  const button = e.target.closest('.delete-record');
  if (!button || !confirm(t('confirmDelete'))) return;
  pendingDeleteId = button.dataset.deleteId;
  $('#deleteEmail').value = ''; $('#deletePassword').value = '';
  $('#deleteLoginDialog').showModal(); $('#deleteEmail').focus();
});
$('#deleteLoginCancel').onclick = () => { pendingDeleteId = null; $('#deleteLoginDialog').close(); };
$('#deleteLoginDialog').addEventListener('close', () => { pendingDeleteId = null; });
$('#deleteLoginForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!pendingDeleteId) return;
  const submit = $('#deleteLoginSubmit'); submit.disabled = true;
  let authenticated = false;
  try {
    const credential = await signInWithEmailAndPassword(auth, $('#deleteEmail').value.trim(), $('#deletePassword').value);
    authenticated = true;
    const record = (records || []).find(r => r.record_id === pendingDeleteId);
    if (!record) throw new Error('Record is no longer loaded. Refresh history and try again.');
    const before = recordSnapshot(record);
    const now = Timestamp.fromDate(new Date());
    const after = { ...before, deleted_at: now, deleted_by: credential.user.email || '', updated_at: now };
    const batch = writeBatch(db);
    batch.update(doc(db, 'spare_part_records', pendingDeleteId), {
      deleted_at: serverTimestamp(), deleted_by: credential.user.email || '', updated_at: serverTimestamp()
    });
    batch.set(doc(collection(db, 'spare_part_record_audit')), {
      record_id: pendingDeleteId, action: 'delete', before, after,
      changed_by: credential.user.email || 'authorized user', changed_at: serverTimestamp()
    });
    await batch.commit();
    records = records.filter(r => r.record_id !== pendingDeleteId);
    pendingDeleteId = null; $('#deleteLoginDialog').close(); fillMachineFilter(); renderHistory(); toast(t('deleteMoved'));
  } catch (err) {
    console.error(err);
    const key = String(err.code || '').startsWith('auth/') ? 'loginFail' : 'deleteFail';
    toast(t(key, { e: err.code || err.message }), 'err');
  } finally {
    if (authenticated) await signOut(auth).catch(err => console.warn('Could not sign out after deletion', err));
    submit.disabled = false;
  }
});
$('#editAddPart').onclick = () => addEditItem();
$('#editClose').onclick = $('#editCancel').onclick = () => editDialog.close();
$('#editForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!editingRecord || !$('#editForm').reportValidity()) return;
  const items = [];
  let valid = true;
  editItemsEl.querySelectorAll('.edit-part').forEach(row => {
    const item = {};
    row.querySelectorAll('[data-edit-field]').forEach(input => {
      input.classList.remove('invalid'); item[input.dataset.editField] = input.value.trim();
    });
    if (!item.part_code && !item.part_name && !item.serial_no && !item.remark) return;
    item.quantity = parseFloat(item.quantity);
    if (!item.part_code && !item.part_name) { row.querySelector('[data-edit-field="part_name"]').classList.add('invalid'); valid = false; }
    if (!(item.quantity > 0)) { row.querySelector('[data-edit-field="quantity"]').classList.add('invalid'); valid = false; }
    items.push(item);
  });
  if (!items.length) { toast(t('editNeedPart'), 'err'); return; }
  if (!valid) { toast(t('fix'), 'err'); return; }
  const save = $('#editSave'); save.disabled = true;
  try {
    const changes = {
      machine_name: $('#editMachine').value.trim(),
      recorded_by: $('#editTech').value.trim(),
      replacement_date: Timestamp.fromDate(new Date($('#editDate').value)),
      general_remarks: $('#editRemarks').value.trim(), items, updated_at: serverTimestamp()
    };
    const before = recordSnapshot(editingRecord);
    const after = { ...before, ...changes, updated_at: Timestamp.fromDate(new Date()) };
    const batch = writeBatch(db);
    batch.update(doc(db, 'spare_part_records', editingRecord.record_id), { ...changes, updated_at: serverTimestamp() });
    batch.set(doc(collection(db, 'spare_part_record_audit')), {
      record_id: editingRecord.record_id, action: 'edit', before, after,
      changed_by: auth.currentUser?.email || 'anonymous', changed_at: serverTimestamp()
    });
    await batch.commit();
    Object.assign(editingRecord, changes, { updated_at: after.updated_at, _date: new Date($('#editDate').value) });
    editDialog.close(); fillMachineFilter(); renderHistory(); toast(t('editSaved'));
  } catch (err) {
    console.error(err); toast(t('editFail', { e: err.code || err.message }), 'err');
  } finally { save.disabled = false; }
});
['hQ', 'hM', 'hFrom', 'hTo'].forEach(id => $('#' + id).addEventListener('input', () => records && renderHistory()));
$('#hRefresh').onclick = loadHistory;
$('#hClear').onclick = () => {
  $('#hQ').value = ''; $('#hM').value = ''; $('#hFrom').value = ''; $('#hTo').value = '';
  if (records) renderHistory();
};

// ---------- Export (filtered list, one row per part) ----------
const heads = () => [t('xRid'), t('xMachine'), t('xDate'), t('xBy'), t('code'), t('name'), t('qty'), t('unit'), 'Serial / Lot', t('remark'), t('xRemark'), t('xImg')];
function exportRows() {
  const rows = [];
  filtered().forEach(r => r.items.forEach(i => rows.push([r.record_id, r.machine_name, fmt(r._date), r.recorded_by, i.part_code, i.part_name, i.quantity, i.unit, i.serial_no, i.remark, r.general_remarks, r.images.join('\n')])));
  return rows;
}
const stamp = () => { const d = new Date(); return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`; };
$('#xCsv').onclick = () => {
  const rows = exportRows(); if (!rows.length) return toast(t('noExport'), 'err');
  const cell = c => { let s = String(c ?? ''); if (/^[=+\-@]/.test(s) && isNaN(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };  // guards against spreadsheet formula injection
  const csv = '\uFEFF' + [heads(), ...rows].map(r => r.map(cell).join(',')).join('\r\n');   // BOM keeps Thai readable in Excel
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `spare-part-records_${stamp()}.csv`; a.click(); URL.revokeObjectURL(a.href);
};
$('#xXlsx').onclick = () => {
  const rows = exportRows(); if (!rows.length) return toast(t('noExport'), 'err');
  if (!window.XLSX) return toast('Excel library failed to load — use CSV.', 'err');
  const ws = XLSX.utils.aoa_to_sheet([heads(), ...rows]);
  ws['!cols'] = [18, 22, 20, 16, 14, 24, 8, 8, 16, 24, 28, 40].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Spare Parts');
  XLSX.writeFile(wb, `spare-part-records_${stamp()}.xlsx`);
};

// ---------- Init ----------
fillMachineFilter(); resetForm(); setLang(lang);
