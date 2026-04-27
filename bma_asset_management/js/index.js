/**
 * version 00056
 * ไฟล์: index.js
 * หน้าที่: จัดการการแสดงผลข้อมูลทรัพย์สินในรูปแบบตาราง (Desktop) และการ์ด (Mobile)
 * รองรับ: Pagination (25/50/100/ทั้งหมด), การค้นหาแบบ Real-time, Responsive Desktop/Mobile
 * เพิ่มเติม: ระบบตั้งค่า (Settings) พร้อมปุ่มรูปเฟือง
 */

let globalData = [];
let charts = {};
let currentTab = 'dashboard';
let isMobile = window.innerWidth < 768;
let rowsPerPage = 25;
let searchTimeout = null;

// ==================== INITIALIZATION ====================

window.onload = () => {
    fetchData();
    loadSidebarState();
};

window.onresize = () => {
    const newIsMobile = window.innerWidth < 768;
    if (newIsMobile !== isMobile) {
        isMobile = newIsMobile;
        renderCurrentPage();
    }
};

// ==================== SIDEBAR FUNCTIONS ====================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    sidebar.classList.toggle('hidden-sidebar');
    
    const isHidden = sidebar.classList.contains('hidden-sidebar');
    localStorage.setItem('sidebarHidden', isHidden);
    
    setTimeout(() => {
        Object.values(charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
        window.dispatchEvent(new Event('resize'));
    }, 350);
}

function loadSidebarState() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const isHidden = localStorage.getItem('sidebarHidden') === 'true';
    if (isHidden) {
        sidebar.classList.add('hidden-sidebar');
    }
}

// ==================== DATA FETCHING ====================

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

// ==================== TAB NAVIGATION ====================

function switchTab(tabId) {
    currentTab = tabId;
    updateNavUI(tabId);
    
    if (tabId === 'settings') {
        renderSettingsPage();
    } else {
        renderCurrentPage();
    }
}

function updateNavUI(tabId) {
    // Desktop navigation
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const btn = document.getElementById('btn-' + tabId);
    if (btn) btn.classList.add('active');

    // Mobile bottom navigation
    const mDash = document.getElementById('m-btn-dashboard');
    const mInv = document.getElementById('m-btn-inventory');
    if (mDash && mInv) {
        if (tabId === 'dashboard') {
            mDash.classList.replace('text-white/50', 'text-white');
            mInv.classList.replace('text-white', 'text-white/50');
        } else if (tabId === 'inventory') {
            mInv.classList.replace('text-white/50', 'text-white');
            mDash.classList.replace('text-white', 'text-white/50');
        }
    }
    
    // อัปเดตหัวข้อ (ยกเว้น settings จะจัดการใน renderSettingsPage)
    if (tabId !== 'settings') {
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.innerText = tabId === 'dashboard' ? 'ภาพรวมระบบ' : 'รายการทรัพย์สิน';
    }
}

// ==================== SETTINGS FUNCTIONS ====================

function toggleSettingsMenu() {
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

function openSettings() {
    // ปิด dropdown
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
    
    // เปลี่ยนไปหน้าตั้งค่า
    switchTab('settings');
}

function renderSettingsPage() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    // เปลี่ยนหัวข้อ
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.innerText = 'ตั้งค่าระบบ';
    
    // สร้างเนื้อหาหน้าตั้งค่า
    mainContent.innerHTML = `
        <div class="p-8 animate-in">
            <div class="max-w-4xl mx-auto">
                <!-- การ์ดหลัก -->
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div class="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-slate-800">ตั้งค่าระบบ</h3>
                                <p class="text-xs text-slate-400">จัดการการตั้งค่าต่างๆ ของระบบ</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-8 text-center">
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-2xl mb-4">
                            <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h4 class="text-md font-semibold text-slate-600 mb-2">กำลังอยู่ในระหว่างการพัฒนา</h4>
                        <p class="text-sm text-slate-400">หน้าตั้งค่าระบบกำลังอยู่ระหว่างการพัฒนา<br>เร็วๆ นี้จะมีการอัปเดตเพิ่มเติม</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    mainContent.scrollTop = 0;
}

// ==================== PAGE RENDERING ====================

async function renderCurrentPage() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const fileName = currentTab === 'dashboard' ? 'dashboard.html' : 'assets-list.html';
    
    try {
        const res = await fetch(fileName);
        mainContent.innerHTML = await res.text();
        mainContent.scrollTop = 0;

        setTimeout(() => {
            if (currentTab === 'dashboard') {
                if (typeof renderDesktopDashboard === 'function' && typeof renderMobileDashboard === 'function') {
                    isMobile ? renderMobileDashboard(globalData) : renderDesktopDashboard(globalData);
                }
            } else {
                executeFilter();
            }
        }, 150);

    } catch (err) {
        mainContent.innerHTML = `<div class="p-8 text-red-500">Error: ${err.message}</div>`;
    }
}

// ==================== FILTER & PAGINATION ====================

function filterTable(isSearchEvent = false) {
    if (isSearchEvent) {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            executeFilter();
        }, 300);
    } else {
        executeFilter();
    }
}

function executeFilter() {
    const query = (() => {
        if (isMobile) {
            return document.getElementById('searchInputMobile')?.value.toLowerCase() || "";
        } else {
            return document.getElementById('searchInput')?.value.toLowerCase() || "";
        }
    })();
    
    const rowSelect = isMobile 
        ? document.getElementById('rowSelectMobile') 
        : document.getElementById('rowSelectDesktop');
    
    if (rowSelect) {
        rowsPerPage = rowSelect.value === 'All' ? globalData.length : parseInt(rowSelect.value);
    }

    const filtered = globalData.filter(item => 
        (item.type && item.type.toLowerCase().includes(query)) || 
        (item.id && item.id.toLowerCase().includes(query)) ||
        (item.dept && item.dept.toLowerCase().includes(query)) ||
        (item.owner && item.owner.toLowerCase().includes(query)) ||
        (item.brand && item.brand.toLowerCase().includes(query)) ||
        (item.model && item.model.toLowerCase().includes(query)) ||
        (item.serial && item.serial.toLowerCase().includes(query)) ||
        (item.location && item.location.toLowerCase().includes(query))
    );
    
    const paginatedData = filtered.slice(0, rowsPerPage);

    if (isMobile) {
        if (typeof renderMobileTable === 'function') renderMobileTable(paginatedData);
        const countElM = document.getElementById('show-count-m');
        if (countElM) countElM.innerText = `แสดง ${paginatedData.length} จาก ${filtered.length} รายการ`;
    } else {
        if (typeof renderDesktopTable === 'function') renderDesktopTable(paginatedData);
        const countEl = document.getElementById('show-count');
        if (countEl) countEl.innerText = `แสดง ${paginatedData.length} จาก ${filtered.length} รายการ`;
    }
}

// ==================== HELPER FUNCTIONS ====================

function groupAndSortData(data, key, limit) {
    const counts = data.reduce((acc, curr) => {
        const val = curr[key] || 'ไม่ระบุ';
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit));
}

// ==================== CLICK OUTSIDE DROPDOWN ====================

// ปิด dropdown เมื่อคลิกที่อื่น
document.addEventListener('click', function(event) {
    const settingsBtn = document.getElementById('settingsBtn');
    const dropdown = document.getElementById('settingsDropdown');
    
    if (settingsBtn && dropdown && !settingsBtn.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});
