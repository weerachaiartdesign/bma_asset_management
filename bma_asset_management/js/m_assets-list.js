/**
 * version 00033
 * ฟังก์ชันแสดงผลรายการทรัพย์สินแบบ Card สำหรับมือถือ
 */
function renderMobileTable(data) {
  const container = document.getElementById('mobile-list');
  if (!container) return;

  container.innerHTML = data.map(item => `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3">
      <div class="flex justify-between items-start mb-2">
        <span class="text-[10px] font-mono font-bold text-slate-400">${item.id}</span>
        <span class="text-[9px] px-2 py-0.5 rounded-full font-bold ${item.status.includes('ปกติ') ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}">${item.status}</span>
      </div>
      <h4 class="font-bold text-slate-800 text-sm mb-1">${item.type}</h4>
      <div class="text-[11px] text-slate-500 space-y-0.5 border-l-2 border-slate-100 pl-2">
        <div class="font-bold text-slate-700">${item.brand} ${item.model}</div>
        <div>หน่วยงาน: ${item.dept}</div>
        <div class="text-emerald-600">ผู้รับผิดชอบ: ${item.owner}</div>
      </div>
    </div>
  `).join('');
}
