/**
 * version 00055
 * ไฟล์: assets-list.js
 * หน้าที่: จัดการการแสดงผลข้อมูลทรัพย์สินในรูปแบบตาราง (Desktop) และการ์ด (Mobile)
 */

/**
 * ฟังก์ชัน renderDesktopTable: สร้าง HTML แถวตารางทรัพย์สิน
 * @param {Array} data - ข้อมูลทรัพย์สินที่ผ่านการ Filter แล้ว
 */
function renderDesktopTable(data) {
  const body = document.getElementById('table-body');
  if (!body) return;

  if (data.length === 0) {
    body.innerHTML = `<table><td colspan="6" class="px-6 py-12 text-center text-slate-400">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td></tr>`;
    return;
  }

  body.innerHTML = data.map(item => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100 cursor-pointer" onclick="showAssetDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})">
      <td class="px-6 py-4 font-mono text-xs font-bold text-slate-400">${escapeHtml(item.id)}</td>
      <td class="px-6 py-4 text-sm font-bold text-slate-700">${escapeHtml(item.type)}</td>
      <td class="px-6 py-4 text-xs text-slate-500">
        <div class="font-bold text-slate-700">${escapeHtml(item.brand || '-')}</div>
        <div>${escapeHtml(item.model || '-')}</div>
        <div class="text-[10px] opacity-60">SN: ${escapeHtml(item.serial || '-')}</div>
      </td>
      <td class="px-6 py-4 text-xs">
        <!-- ฝ่าย/กลุ่มงาน: พื้นสีเขียวอ่อน แบบเต็มบรรทัด (block) -->
        <div class="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-bold mb-1">${escapeHtml(item.department || item.dept || '-')}</div>
        <div class="text-slate-500">ที่ตั้ง: ${escapeHtml(item.location_asset || item.location || '-')}</div>
        <div class="font-bold text-slate-700">ผู้ดูแล: ${escapeHtml(item.responsible_person || item.owner || '-')}</div>
        <div class="text-slate-500">ปฏิบัติงาน: ${escapeHtml(item.workplace || '-')}</div>
      </td>
      <td class="px-6 py-4 text-center">
        <span class="px-3 py-1 rounded-full text-[10px] font-bold ${getStatusClass(item.status)}">
          ${escapeHtml(item.status)}
        </span>
      </td>
      <td class="px-6 py-4 text-center">
        ${item.url ? `<a href="${item.url}" target="_blank" class="text-emerald-600 hover:text-emerald-800 font-bold text-xs underline" onclick="event.stopPropagation()">ลิงก์ข้อมูล</a>` : '-'}
      </td>
    </tr>
  `).join('');
}

/**
 * ฟังก์ชัน renderMobileTable: สร้าง HTML การ์ดทรัพย์สินสำหรับมือถือ
 * @param {Array} data - ข้อมูลทรัพย์สินที่ผ่านการ Filter แล้ว
 */
function renderMobileTable(data) {
  const container = document.getElementById('mobile-list');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `<div class="py-20 text-center text-slate-400 font-bold">ไม่พบข้อมูลที่ต้องการ</div>`;
    return;
  }

  container.innerHTML = data.map(item => `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3 animate-in cursor-pointer active:scale-98 transition-transform" onclick="showAssetDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})">
      <div class="flex justify-between items-start mb-2">
        <span class="text-[10px] font-mono font-bold text-slate-400">#${escapeHtml(item.id)}</span>
        <span class="text-[9px] px-2 py-0.5 rounded-full font-bold ${getStatusClass(item.status)}">
          ${escapeHtml(item.status)}
        </span>
      </div>
      <h4 class="font-bold text-slate-800 text-sm mb-1">${escapeHtml(item.type)}</h4>
      <div class="text-[11px] text-slate-500 space-y-1 border-l-2 border-slate-100 pl-3">
        <div class="font-bold text-slate-700">${escapeHtml(item.brand || '')} ${escapeHtml(item.model || '')}</div>
        <!-- หน่วยงาน: ตัวอักษรสีเขียวเข้ม -->
        <div class="text-emerald-700 font-semibold"><span class="opacity-50">หน่วยงาน:</span> ${escapeHtml(item.department || item.dept || '-')}</div>
        <div><span class="opacity-50">ที่ตั้ง:</span> ${escapeHtml(item.location_asset || item.location || '-')}</div>
        <!-- ผู้ดูแล: ตัวอักษรสีดำเข้ม -->
        <div class="text-slate-800 font-semibold"><span class="opacity-50">ผู้ดูแล:</span> ${escapeHtml(item.responsible_person || item.owner || '-')}</div>
        <div><span class="opacity-50">ปฏิบัติงาน:</span> ${escapeHtml(item.workplace || '-')}</div>
      </div>
      ${item.url ? `
      <div class="mt-3 pt-2 border-t border-slate-50 flex justify-end">
        <a href="${item.url}" target="_blank" class="text-emerald-600 text-[10px] font-bold flex items-center gap-1" onclick="event.stopPropagation()">รายละเอียด →</a>
      </div>` : ''}
    </div>
  `).join('');
}

/**
 * ฟังก์ชันกำหนดคลาส CSS ตามสถานะ
 * @param {string} status - สถานะทรัพย์สิน
 * @returns {string} - ชื่อคลาส CSS
 */
function getStatusClass(status) {
  if (!status) return 'bg-slate-100 text-slate-600';
  if (status.includes('ปกติ') || status.includes('ใช้งานได้')) {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (status.includes('ชำรุด') || status.includes('พัง') || status.includes('รอซ่อม')) {
    return 'bg-orange-100 text-orange-700';
  }
  if (status.includes('รอจำหน่าย')) {
    return 'bg-slate-100 text-slate-600';
  }
  if (status.includes('จำหน่ายแล้ว')) {
    return 'bg-gray-200 text-gray-600';
  }
  return 'bg-slate-100 text-slate-600';
}

/**
 * ฟังก์ชันป้องกัน XSS (แปลง HTML special characters)
 * @param {string} str - ข้อความที่ต้องการแปลง
 * @returns {string} - ข้อความที่แปลงแล้ว
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
