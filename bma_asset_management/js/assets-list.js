/**
 * version 00034
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
    body.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-slate-400">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td></tr>`;
    return;
  }

  body.innerHTML = data.map(item => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="px-6 py-4 font-mono text-xs font-bold text-slate-400">${item.id}</td>
      <td class="px-6 py-4 text-sm font-bold text-slate-700">${item.type}</td>
      <td class="px-6 py-4 text-xs text-slate-500">
        <div class="font-bold text-slate-700">${item.brand || '-'}</div>
        <div>${item.model || '-'}</div>
        <div class="text-[10px] opacity-60">SN: ${item.serial || '-'}</div>
      </td>
      <td class="px-6 py-4 text-xs">
        <div class="font-bold text-slate-700">${item.dept}</div>
        <div class="text-slate-500 mb-1">${item.location}</div>
        <div class="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-bold">${item.owner}</div>
      </td>
      <td class="px-6 py-4 text-center">
        <span class="px-3 py-1 rounded-full text-[10px] font-bold ${item.status.includes('ปกติ') ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}">
          ${item.status}
        </span>
      </td>
      <td class="px-6 py-4 text-center">
        ${item.url ? `<a href="${item.url}" target="_blank" class="text-emerald-600 hover:text-emerald-800 font-bold text-xs underline">ลิงก์ข้อมูล</a>` : '-'}
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
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3 animate-in">
      <div class="flex justify-between items-start mb-2">
        <span class="text-[10px] font-mono font-bold text-slate-400">#${item.id}</span>
        <span class="text-[9px] px-2 py-0.5 rounded-full font-bold ${item.status.includes('ปกติ') ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}">
          ${item.status}
        </span>
      </div>
      <h4 class="font-bold text-slate-800 text-sm mb-1">${item.type}</h4>
      <div class="text-[11px] text-slate-500 space-y-1 border-l-2 border-slate-100 pl-3">
        <div class="font-bold text-slate-700">${item.brand || ''} ${item.model || ''}</div>
        <div><i class="opacity-50">หน่วยงาน:</i> ${item.dept}</div>
        <div class="text-emerald-600 font-bold"><i class="opacity-50">ผู้ดูแล:</i> ${item.owner}</div>
      </div>
      ${item.url ? `
      <div class="mt-3 pt-2 border-t border-slate-50 flex justify-end">
        <a href="${item.url}" target="_blank" class="text-emerald-600 text-[10px] font-bold flex items-center gap-1">รายละเอียด →</a>
      </div>` : ''}
    </div>
  `).join('');
}
