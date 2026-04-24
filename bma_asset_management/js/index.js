/**
 * version 00055
 * ไฟล์: index.js
 * หน้าที่: จัดการการแสดงผลข้อมูลทรัพย์สินในรูปแบบตาราง (Desktop) และการ์ด (Mobile)
 * รองรับ: Pagination (25/50/100/ทั้งหมด), การค้นหาแบบ Real-time, Responsive Desktop/Mobile
 */

let globalData = [];
let charts = {};
let currentTab = 'dashboard';
let isMobile = window.innerWidth < 768;
let rowsPerPage = 25;
let searchTimeout = null;

// ==================== INITIALIZATION ====================

window.onload = fetchData;

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
    
    // Toggle class hidden-sidebar (ซ่อน/แสดง)
    sidebar.classList.toggle('hidden-sidebar');
    
    // เก็บสถานะการซ่อนลง localStorage
    const isHidden = sidebar.classList.contains('hidden-sidebar');
    localStorage.setItem('sidebarHidden', isHidden);
    
    // ปรับขนาดกราฟหลังจาก sidebar เปลี่ยนขนาด
    setTimeout(() => {
        Object.values(charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
        window.dispatchEvent(new Event('resize'));
    }, 350);
}

// โหลดสถานะ sidebar ที่เคยซ่อนไว้
function loadSidebarState() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const isHidden = localStorage.getItem('sidebarHidden') === 'true';
    if (isHidden) {
        sidebar.classList.add('hidden-sidebar');
    }
}

// แก้ไข window.onload ให้เรียก loadSidebarState
window.onload = () => {
    fetchData();
    loadSidebarState();
};

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
    renderCurrentPage();
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
        } else {
            mInv.classList.replace('text-white/50', 'text-white');
            mDash.classList.replace('text-white', 'text-white/50');
        }
    }
    
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.innerText = tabId === 'dashboard' ? 'ภาพรวมระบบ' : 'รายการทรัพย์สิน';
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
                executeFilter(); // ใช้ executeFilter แทน filterTable เพื่อโหลดข้อมูลทันที
            }
        }, 150);

    } catch (err) {
        mainContent.innerHTML = `<div class="p-8 text-red-500">Error: ${err.message}</div>`;
    }
}

// ==================== FILTER & PAGINATION ====================

/**
 * ฟังก์ชันหลักสำหรับกรองและแบ่งหน้าข้อมูล
 * @param {boolean} isSearchEvent - true = มาจากการพิมพ์ค้นหา (debounce), false = มาจากการเปลี่ยน dropdown
 */
function filterTable(isSearchEvent = false) {
    if (isSearchEvent) {
        // Debounce สำหรับการค้นหา
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            executeFilter();
        }, 300);
    } else {
        executeFilter();
    }
}

/**
 * ฟังก์ชัน执行การกรองและแสดงผลจริง
 */
function executeFilter() {
    // 1. อ่านค่า query จากการค้นหา (แยกตามอุปกรณ์)
    const query = (() => {
        if (isMobile) {
            return document.getElementById('searchInputMobile')?.value.toLowerCase() || "";
        } else {
            return document.getElementById('searchInput')?.value.toLowerCase() || "";
        }
    })();
    
    // 2. อ่านค่า rowsPerPage จาก dropdown (แยกตามอุปกรณ์)
    const rowSelect = isMobile 
        ? document.getElementById('rowSelectMobile') 
        : document.getElementById('rowSelectDesktop');
    
    if (rowSelect) {
        rowsPerPage = rowSelect.value === 'All' ? globalData.length : parseInt(rowSelect.value);
        console.log(`[executeFilter] isMobile=${isMobile}, rowsPerPage=${rowsPerPage}, query="${query}"`); // debug log
    }

    // 3. กรองข้อมูลตามคำค้นหา
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
    
    // 4. ตัดข้อมูลตามจำนวนที่เลือก (Pagination)
    const paginatedData = filtered.slice(0, rowsPerPage);

    // 5. แสดงผลตามอุปกรณ์
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

/**
 * ฟังก์ชันจัดกลุ่มและเรียงลำดับข้อมูลสำหรับกราฟ
 * @param {Array} data - ข้อมูลทรัพย์สิน
 * @param {string} key - ชื่อฟิลด์ที่ต้องการจัดกลุ่ม (เช่น 'type', 'dept')
 * @param {number} limit - จำนวนสูงสุดที่ต้องการแสดง
 * @returns {Object} - Object ที่มี key เป็นชื่อกลุ่ม และ value เป็นจำนวน
 */
function groupAndSortData(data, key, limit) {
    const counts = data.reduce((acc, curr) => {
        const val = curr[key] || 'ไม่ระบุ';
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit));
}
