/**
 * version 00036
 * หัวใจหลัก: จัดการการพับ Sidebar และการ Scroll หน้าจอ
 */
let globalData = [];
let charts = {};
let currentTab = 'dashboard';
let isMobile = window.innerWidth < 768;
let rowsPerPage = 25;

window.onload = fetchData;

window.onresize = () => {
    const newIsMobile = window.innerWidth < 768;
    if(newIsMobile !== isMobile) {
        isMobile = newIsMobile;
        renderCurrentPage();
    }
};

/**
 * 3. ฟังก์ชันพับ Sidebar (Desktop)
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

async function fetchData() {
    const loadingText = document.getElementById('loading-text');
    try {
        const response = await fetch(WEB_APP_URL);
        globalData = await response.json();
        
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.classList.add('hidden'), 500);
        }
        renderCurrentPage();
    } catch (err) {
        if (loadingText) loadingText.innerHTML = `<span class="text-red-500">ผิดพลาด: ${err.message}</span>`;
    }
}

function switchTab(tabId) {
    currentTab = tabId;
    updateNavUI(tabId);
    renderCurrentPage();
}

function updateNavUI(tabId) {
    // อัปเดตเมนู Desktop
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const btn = document.getElementById('btn-' + tabId);
    if(btn) btn.classList.add('active');

    // อัปเดตเมนู Mobile
    const mDash = document.getElementById('m-btn-dashboard');
    const mInv = document.getElementById('m-btn-inventory');
    if(mDash && mInv) {
        mDash.classList.toggle('active', tabId === 'dashboard');
        mInv.classList.toggle('active', tabId === 'inventory');
    }
    
    document.getElementById('page-title').innerText = tabId === 'dashboard' ? 'ภาพรวมระบบ' : 'รายการทรัพย์สิน';
}

async function renderCurrentPage() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const fileName = currentTab === 'dashboard' ? 'dashboard.html' : 'assets-list.html';
    
    try {
        const res = await fetch(fileName);
        mainContent.innerHTML = await res.text();

        // เมื่อโหลดเสร็จ ให้เลื่อนไปบนสุดเสมอ
        mainContent.scrollTop = 0;

        if (currentTab === 'dashboard') {
            isMobile ? renderMobileDashboard(globalData) : renderDesktopDashboard(globalData);
        } else {
            filterTable(); 
        }
    } catch (err) {
        mainContent.innerHTML = `<div class="p-8 text-red-500">Error: ${err.message}</div>`;
    }
}

/**
 * 2. ฟังก์ชันกรองข้อมูลและคุมการแสดงผล (Pagination)
 */
function filterTable() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || "";
    const rowSelect = document.getElementById('rowSelect');
    
    if (rowSelect) {
        rowsPerPage = rowSelect.value === 'All' ? globalData.length : parseInt(rowSelect.value);
    }

    const filtered = globalData.filter(item => 
        Object.values(item).some(val => String(val).toLowerCase().includes(query))
    );
    
    const paginatedData = filtered.slice(0, rowsPerPage);

    if (isMobile) {
        renderMobileTable(paginatedData);
        const countElM = document.getElementById('show-count-m');
        if (countElM) countElM.innerText = `แสดง ${paginatedData.length} จาก ${filtered.length}`;
    } else {
        renderDesktopTable(paginatedData);
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
