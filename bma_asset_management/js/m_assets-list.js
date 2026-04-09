/**
 * version 00032
 * Logic สำหรับหน้ารายการทรัพย์สิน (Mobile)
 */
function renderMobileTable(data) {
  const container = document.getElementById('mobile-list-container');
  if (!container) return;

  container.innerHTML = data.map(item => `
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3 text-xs">
      <div class="flex justify-between items-start mb-2">
        <span class="text-[10px] font-bold text-slate-400 font-mono">${item.id}</span>
        <div class="flex gap-2">
          ${item.url ? `<a href="${item.url}" target="_blank" class="text-emerald-600 p-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>` : ''}
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${['ปกติ','ใช้งานได้'].some(s => String(item.status).includes(s)) ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}">${item.status}</span>
        </div>
      </div>
      <div class="font-bold text-slate-800 text-sm mb-1">${item.type}</div>
      <div class="space-y-0.5 text-slate-500 mb-3 border-l-2 border-emerald-100 pl-2">
          <div>${item.brand || '-'}</div>
          <div>${item.model || '-'}</div>
          <div class="text-[10px] text-slate-400">S/N: ${item.serial || '-'}</div>
      </div>
      <div class="flex justify-between items-end pt-3 border-t border-slate-50">
        <div class="text-[10px] leading-tight space-y-1">
          <div class="text-slate-600 font-bold">${item.dept}</div>
          <div class="text-slate-400 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
            ${item.location || '-'}
          </div>
          <div class="text-emerald-600 font-semibold">${item.owner || '-'}</div>
        </div>
        <div class="font-mono font-bold text-emerald-700 text-sm">฿${Number(item.value || 0).toLocaleString()}</div>
      </div>
    </div>
  `).join('');
}
