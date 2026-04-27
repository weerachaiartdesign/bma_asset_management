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
    
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.innerText = 'ตั้งค่าระบบ';
    
    // โหลดหน้า scanner
    fetch('settings-scanner.html')
        .then(response => response.text())
        .then(html => {
            mainContent.innerHTML = html;
            mainContent.scrollTop = 0;
            
            // โหลด CSS เพิ่มเติมสำหรับ scanner (ถ้ายังไม่มี)
            loadScannerStyles();
            
            // เริ่มต้นกล้องอัตโนมัติ (สะดวกสำหรับมือถือ)
            setTimeout(() => {
                if (typeof startScannerCamera === 'function') {
                    startScannerCamera();
                }
            }, 500);
        })
        .catch(err => {
            mainContent.innerHTML = `
                <div class="p-8 text-center">
                    <div class="text-red-500 mb-4">⚠️ ไม่สามารถโหลดหน้านำเข้าข้อมูล</div>
                    <button onclick="renderSettingsPage()" class="px-4 py-2 bg-emerald-600 text-white rounded-lg">ลองอีกครั้ง</button>
                </div>
            `;
            console.error(err);
        });
}

function loadScannerStyles() {
    // ตรวจสอบว่ามี style สำหรับ scanner ไหม
    if (!document.getElementById('scanner-styles')) {
        const style = document.createElement('style');
        style.id = 'scanner-styles';
        style.textContent = `
            /* Scanner Page Styles */
            .scanner-page { max-width: 600px; margin: 0 auto; padding: 16px; }
            .scanner-header { text-align: center; margin-bottom: 24px; }
            .scanner-header-icon { width: 56px; height: 56px; background: #064e3b; border-radius: 28px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #10b981; }
            .scanner-header h2 { font-size: 20px; font-weight: 700; color: #1e293b; }
            .scanner-subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            
            .scanner-container-card, .scanner-form-card { background: white; border-radius: 24px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
            .qr-reader { width: 100%; border-radius: 16px; overflow: hidden; display: none; }
            .qr-reader video { border-radius: 16px; }
            
            .qr-status { text-align: center; padding: 12px; font-size: 13px; font-weight: 600; border-radius: 12px; margin: 12px 0; }
            .status-idle { background: #f1f5f9; color: #475569; }
            .status-loading { background: #fef3c7; color: #d97706; }
            .status-scanning { background: #d1fae5; color: #065f46; }
            .status-success { background: #a7f3d0; color: #064e3b; }
            .status-error { background: #fee2e2; color: #dc2626; }
            
            .scanner-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
            .scanner-btn { flex: 1; padding: 12px; border-radius: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; border: none; transition: all 0.2s; }
            .scanner-btn-primary { background: #059669; color: white; }
            .scanner-btn-primary:hover { background: #047857; }
            .scanner-btn-danger { background: #ef4444; color: white; }
            .scanner-btn-danger:hover { background: #dc2626; }
            .scanner-btn-secondary { background: #e2e8f0; color: #1e293b; }
            .scanner-btn-secondary:hover { background: #cbd5e1; }
            
            .form-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
            .form-header-icon { width: 40px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; }
            .success-bg { background: #d1fae5; color: #059669; }
            .form-status { font-size: 12px; color: #64748b; margin-top: 4px; }
            
            .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .form-field.full-width { grid-column: span 2; }
            .form-field label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
            .form-field input { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; transition: all 0.2s; }
            .form-field input:focus { outline: none; border-color: #059669; ring: 2px solid #059669; }
            .readonly-field { background: #f8fafc; color: #1e293b; }
            .editable-field { background: white; }
            
            .duplicate-alert { display: flex; align-items: center; gap: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; }
            .duplicate-icon { font-size: 24px; }
            
            .form-actions { display: flex; gap: 12px; margin-top: 24px; }
            .scanner-save-btn { flex: 2; background: #059669; color: white; border: none; border-radius: 14px; padding: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
            .scanner-save-btn:disabled { background: #94a3b8; cursor: not-allowed; }
            .scanner-reset-btn { flex: 1; background: #f1f5f9; color: #475569; border: none; border-radius: 14px; padding: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
            
            @media (max-width: 640px) {
                .form-grid { gap: 12px; }
                .scanner-page { padding: 12px; }
                .scanner-container-card, .scanner-form-card { padding: 16px; }
            }
        `;
        document.head.appendChild(style);
    }
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
