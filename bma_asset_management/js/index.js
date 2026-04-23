/**
 * version 00047
 * แก้ไข: 
 * 1. ฟังก์ชัน toggleSidebar() สำหรับพับเมนูและบังคับให้กราฟ Resize
 * 2. ใช้ setTimeout ใน renderCurrentPage() เพื่อรอให้ Canvas พร้อมก่อนวาดกราฟ
 */
let globalData = [];
let charts = {};
let currentTab = 'dashboard';
let isMobile = window.innerWidth < 768;
let rowsPerPage = 25;

window.onload = fetchData;

// จัดการเรื่องการเปลี่ยนขนาดหน้าจอ
window.onresize = () => {
    const newIsMobile = window.innerWidth < 768;
    if(newIsMobile !== isMobile) {
        isMobile = newIsMobile;
        renderCurrentPage();
    }
    // สั่ง Resize กราฟทุกตัวเมื่อมีการขยับหน้าจอ
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') chart.resize();
    });
};

/**
 * toggleSidebar: สำหรับพับ/กางเมนู Sidebar ฝั่ง Desktop
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        
        // รอให้ CSS Transition (0.3s) ทำงานเสร็จก่อน แล้วค่อยสั่ง Resize กราฟ
        setTimeout(() => {
            Object.values(charts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
        }, 350);
    }
}

async function fetchData() {
    const loadingText = document.getElementById('loading-text');
    try {
        if (typeof WEB_APP_URL === 'undefined') throw new Error("ไม่พบ WEB_APP_URL ใน api-config.js");
        
        const response = await fetch(WEB_APP_URL);
        globalData = await response.json();
        
        if (globalData.error) throw new Error(globalData.error);
        
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.classList.add('hidden'), 500);
        }
        renderCurrentPage();
    } catch (err) {
        if (loadingText) loadingText.innerHTML = `<span class="text-red-600">Error: ${err.message}</span>`;
        console.error(err);
    }
}

function switchTab(tabId) {
    currentTab = tabId;
    updateNavUI(tabId);
    renderCurrentPage();
}

function updateNavUI(tabId) {
    // Desktop Nav
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const btn = document.getElementById('btn-' + tabId);
    if(btn) btn.classList.add('active');

    // Mobile Nav
    const mDash = document.getElementById('m-btn-dashboard');
    const mInv = document.getElementById('m-btn-inventory');
    if(mDash && mInv) {
        if (tabId === 'dashboard') {
            mDash.classList.replace('text-white/50', 'text-white');
            mInv.classList.replace('text-white', 'text-white/50');
        } else {
            mInv.classList.replace('text-white/50', 'text-white');
            mDash.classList.replace('text-white', 'text-white/50');
        }
    }
    
    const titleEl = document.getElementById('page-title');
    if(titleEl) titleEl.innerText = tabId === 'dashboard' ? 'ภาพรวมระบบ' : 'รายการทรัพย์สิน';
}

async function renderCurrentPage() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const fileName = currentTab === 'dashboard' ? 'dashboard.html' : 'assets-list.html';
    
    try {
        const res = await fetch(fileName);
        mainContent.innerHTML = await res.text();
        mainContent.scrollTop = 0;

        // แก้ปัญหากราฟไม่ขึ้น: หน่วงเวลาเล็กน้อยเพื่อให้ Canvas ถูกวาดลง DOM เสร็จก่อน
        setTimeout(() => {
            if (currentTab === 'dashboard') {
                if (isMobile) {
                    if (typeof renderMobileDashboard === 'function') renderMobileDashboard(globalData);
                } else {
                    if (typeof renderDesktopDashboard === 'function') renderDesktopDashboard(globalData);
                }
            } else {
                filterTable(); 
            }
        }, 200);

    } catch (err) {
        mainContent.innerHTML = `<div class="p-8 text-red-500 text-center">ขออภัย เกิดข้อผิดพลาด: ${err.message}</div>`;
    }
}

function filterTable() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || "";
    const rowSelect = document.getElementById('rowSelect');
    
    if (rowSelect) {
        rowsPerPage = rowSelect.value === 'All' ? globalData.length : parseInt(rowSelect.value);
    }

    const filtered = globalData.filter(item => 
        (item.type && item.type.toLowerCase().includes(query)) || 
        (item.id && item.id.toLowerCase().includes(query)) ||
        (item.dept && item.dept.toLowerCase().includes(query)) ||
        (item.owner && item.owner.toLowerCase().includes(query))
    );
    
    const paginatedData = filtered.slice(0, rowsPerPage);

    if (isMobile) {
        if (typeof renderMobileTable === 'function') renderMobileTable(paginatedData);
        const countElM = document.getElementById('show-count-m');
        if (countElM) countElM.innerText = `แสดง ${paginatedData.length} จาก ${filtered.length}`;
    } else {
        if (typeof renderDesktopTable === 'function') renderDesktopTable(paginatedData);
        const countEl = document.getElementById('show-count');
        if (countEl) countEl.innerText = `แสดง ${paginatedData.length} จาก ${filtered.length} รายการ`;
    }
}

function groupAndSortData(data, key, limit) {
    const counts = data.reduce((acc, curr) => {
        const val = curr[key] || 'ไม่ระบุ';
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    return Object.fromEntries(Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, limit));
}
