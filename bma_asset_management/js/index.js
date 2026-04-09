/**
 * version 00032
 * หน้าที่: ควบคุม UI และ Logic ทั้งหมด แยกออกจากไฟล์ HTML
 */

let globalData = [];
let charts = {};
let currentTab = 'dashboard';
let isMobile = window.innerWidth < 768;

window.addEventListener('load', fetchData);
window.addEventListener('resize', () => {
  const newIsMobile = window.innerWidth < 768;
  if(newIsMobile !== isMobile) {
    isMobile = newIsMobile;
    switchTab(currentTab);
  }
});

async function fetchData() {
  try {
    // กรณีรันบน Google Apps Script ให้ใช้ google.script.run
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(data => {
          globalData = JSON.parse(data);
          switchTab('dashboard');
          hideLoading();
        })
        .withFailureHandler(err => {
          showError(err.message);
        })
        .getAssetsData();
    } else {
      // กรณี Test ภายนอกด้วย URL
      const response = await fetch(WEB_APP_URL);
      globalData = await response.json();
      if (globalData.error) throw new Error(globalData.error);
      await switchTab('dashboard');
      hideLoading();
    }
  } catch (err) {
    showError(err.message);
  }
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = '0';
    setTimeout(() => { loading.classList.add('hidden'); }, 500);
  }
}

function showError(msg) {
  const lt = document.getElementById('loading-text');
  if (lt) lt.innerHTML = `<span class="text-red-600">${msg}</span>`;
}

async function switchTab(tabId) {
  currentTab = tabId;
  const mainContent = document.getElementById('main-content');
  const prefix = isMobile ? 'm_' : 'd_';
  const fileToLoad = tabId === 'dashboard' ? `${prefix}dashboard.html` : `${prefix}assets-list.html`;
  
  try {
    const response = await fetch(fileToLoad);
    const html = await response.text();
    mainContent.innerHTML = html;

    updateNavUI(tabId);
    renderContent();
  } catch (err) {
    console.error("Load error:", err);
  }
}

function updateNavUI(tabId) {
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  const desktopBtn = document.getElementById('btn-' + tabId);
  if(desktopBtn) desktopBtn.classList.add('active');

  const mDash = document.getElementById('m-btn-dashboard');
  const mInv = document.getElementById('m-btn-inventory');
  if(mDash && mInv) {
    if(tabId === 'dashboard') {
      mDash.classList.add('text-emerald-800'); mDash.classList.remove('text-slate-400');
      mInv.classList.add('text-slate-400'); mInv.classList.remove('text-emerald-800');
    } else {
      mInv.classList.add('text-emerald-800'); mInv.classList.remove('text-slate-400');
      mDash.classList.add('text-slate-400'); mDash.classList.remove('text-emerald-800');
    }
  }
  document.getElementById('page-title').innerText = tabId === 'dashboard' ? 'Dashboard' : 'รายการทรัพย์สิน';
}

function renderContent() {
  if (currentTab === 'dashboard') {
    renderDashboard();
  } else {
    renderTable(globalData);
  }
}

function renderDashboard() {
  const total = globalData.length;
  const normal = globalData.filter(d => ['ปกติ','ใช้งานได้','พร้อมใช้'].some(s => String(d.status).includes(s))).length;
  const broken = globalData.filter(d => ['ชำรุด','พัง','ซ่อม','ไม่พร้อมใช้'].some(s => String(d.status).includes(s))).length;
  const waiting = globalData.filter(d => String(d.status).includes('รอจำหน่าย')).length;

  ['total-val', 'normal-val', 'broken-val', 'waiting-val'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if(el) el.innerText = [total, normal, broken, waiting][idx].toLocaleString();
  });

  const typeData = groupAndSort(globalData, 'type', isMobile ? 5 : 10);
  const deptData = groupAndSort(globalData, 'dept', isMobile ? 5 : 8);

  updateChart('typeChart', 'doughnut', Object.keys(typeData), Object.values(typeData), ['#064e3b', '#059669', '#10b981', '#6ee7b7', '#d1fae5']);
  updateChart('deptChart', isMobile ? 'horizontalBar' : 'bar', Object.keys(deptData), Object.values(deptData), '#059669');
}

function renderTable(data) {
  const container = document.getElementById('table-body') || document.getElementById('mobile-list-container');
  if(!container) return;

  if(isMobile) {
    container.innerHTML = data.slice(0, 100).map(item => `
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3 text-xs">
        <div class="flex justify-between items-start mb-2">
          <span class="text-[10px] font-bold text-slate-400 font-mono">${item.id}</span>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${['ปกติ','ใช้งานได้'].some(s => String(item.status).includes(s)) ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}">${item.status}</span>
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
            <div class="text-emerald-600 font-semibold">${item.owner || '-'}</div>
          </div>
          <div class="font-mono font-bold text-emerald-700 text-sm">฿${Number(item.value || 0).toLocaleString()}</div>
        </div>
      </div>
    `).join('');
  } else {
    container.innerHTML = data.slice(0, 200).map(item => `
      <tr class="hover:bg-emerald-50/40 transition">
        <td class="px-6 py-4 font-mono text-[11px] text-slate-500 font-bold">${item.id}</td>
        <td class="px-6 py-4 font-bold text-slate-700">${item.type}</td>
        <td class="px-6 py-4 text-xs text-slate-600">
            <div class="font-semibold">${item.brand || '-'}</div>
            <div class="text-slate-500">${item.model || '-'}</div>
        </td>
        <td class="px-6 py-4 text-right font-mono font-bold text-slate-700">฿${Number(item.value || 0).toLocaleString()}</td>
        <td class="px-6 py-4 text-xs">
            <div class="font-bold text-slate-700">${item.dept}</div>
            <div class="text-emerald-600 font-semibold">${item.owner || '-'}</div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="px-3 py-1 rounded-full text-[10px] font-bold ${['ปกติ','ใช้งานได้'].some(s => String(item.status).includes(s)) ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}">${item.status}</span>
        </td>
        <td class="px-6 py-4 text-center">
          ${item.url ? `<a href="${item.url}" target="_blank" class="text-[#12643a]">ดูข้อมูล</a>` : '-'}
        </td>
      </tr>
    `).join('');
  }
}

function filterTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const filtered = globalData.filter(item => 
    String(item.id).toLowerCase().includes(input) || 
    String(item.type).toLowerCase().includes(input) || 
    String(item.dept).toLowerCase().includes(input)
  );
  renderTable(filtered);
}

function groupAndSort(data, key, limit) {
  const counts = data.reduce((acc, curr) => {
    const val = curr[key] || 'ไม่ระบุ';
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  return Object.fromEntries(Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, limit));
}

function updateChart(id, type, labels, data, colors) {
  const canvas = document.getElementById(id);
  if(!canvas) return;
  if (charts[id]) charts[id].destroy();
  
  charts[id] = new Chart(canvas.getContext('2d'), {
    type: type === 'horizontalBar' ? 'bar' : type,
    data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 5 }] },
    options: {
      indexAxis: type === 'horizontalBar' ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { 
          display: type === 'doughnut', 
          position: 'left',
          labels: { font: { family: 'Sarabun', size: 10 }, boxWidth: 10 } 
        } 
      }
    }
  });
}
