/**
 * version 00043
 * ไฟล์: index.js
 * หน้าที่: จัดการการนำทาง, การพับเมนู, และควบคุมการวาดกราฟ
 */

let globalData = [];    
let charts = {};        
let currentTab = 'dashboard'; 
let isMobile = window.innerWidth < 768;

window.onload = fetchData; 

window.onresize = () => {
    const newIsMobile = window.innerWidth < 768;
    if(newIsMobile !== isMobile) {
        isMobile = newIsMobile;
        renderCurrentPage();
    }
};

/**
 * toggleSidebar: ฟังก์ชันสำหรับพับ/กางเมนู Sidebar (Desktop)
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        
        // บันทึกสถานะไว้ใน LocalStorage
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
        
        // สำคัญ: ต้องแจ้งให้ Chart ปรับขนาดตามพื้นที่ที่เปลี่ยนไป
        setTimeout(() => {
            Object.values(charts).forEach(chart => {
                if (typeof chart.resize === 'function') chart.resize();
            });
        }, 300);
    }
}

/**
 * fetchData: ดึงข้อมูลจาก API
 */
async function fetchData() {
    const loadingText = document.getElementById('loading-text');
    try {
        if (typeof WEB_APP_URL === 'undefined') throw new Error("กรุณาตั้งค่า WEB_APP_URL");
        
        const response = await fetch(WEB_APP_URL);
        globalData = await response.json();
        
        if (globalData.error) throw new Error(globalData.error);
        
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.classList.add('hidden');
                // คืนค่าสถานะ Sidebar จาก LocalStorage
                if (localStorage.getItem('sidebarCollapsed') === 'true') {
                    document.getElementById('sidebar')?.classList.add('collapsed');
                }
                renderCurrentPage();
            }, 500);
        }
    } catch (err) {
        if (loadingText) loadingText.innerText = "ข้อผิดพลาด: " + err.message;
        console.error(err);
    }
}

/**
 * switchTab: สลับหน้า Dashboard / Inventory
 */
function switchTab(tabId) {
    if (currentTab === tabId) return;
    currentTab = tabId;
    renderCurrentPage();
}

/**
 * renderCurrentPage: แสดงผลหน้าปัจจุบัน และสั่งวาดกราฟใหม่
 */
async function renderCurrentPage() {
    const mainContent = document.getElementById('main-content');
    const pageTitle = document.getElementById('page-title');
    
    updateNavUI();

    try {
        const fileName = currentTab === 'dashboard' ? 'dashboard.html' : 'assets-list.html';
        const response = await fetch(fileName);
        const html = await response.text();
        
        mainContent.innerHTML = html;
        pageTitle.innerText = currentTab === 'dashboard' ? 'ภาพรวมระบบ' : 'รายการทรัพย์สิน';

        // หลังจากฉีด HTML เข้าไปแล้ว ต้องสั่งให้ฟังก์ชันในไฟล์อื่นทำงาน
        if (currentTab === 'dashboard') {
            // รอให้ DOM อัปเดตแป๊บหนึ่งก่อนวาดกราฟ
            setTimeout(() => {
                if (isMobile) {
                    if (typeof renderMobileDashboard === 'function') renderMobileDashboard(globalData);
                } else {
                    if (typeof renderDesktopDashboard === 'function') renderDesktopDashboard(globalData);
                }
            }, 50);
        } else {
            setTimeout(() => {
                if (isMobile) {
                    if (typeof renderMobileTable === 'function') renderMobileTable(globalData);
                } else {
                    if (typeof renderDesktopTable === 'function') renderDesktopTable(globalData);
                }
            }, 50);
        }
    } catch (err) {
        mainContent.innerHTML = `<div class="p-8 text-red-500 font-bold">เกิดข้อผิดพลาด: ${err.message}</div>`;
    }
}

/**
 * updateNavUI: เปลี่ยนสีปุ่มเมนูตามสถานะ Active
 */
function updateNavUI() {
    const tabs = ['dashboard', 'inventory'];
    tabs.forEach(t => {
        // Desktop
        const btn = document.getElementById(`btn-${t}`);
        if (btn) {
            t === currentTab ? btn.classList.add('active') : btn.classList.remove('active');
        }
        // Mobile
        const mBtn = document.getElementById(`m-btn-${t}`);
        if (mBtn) {
            if (t === currentTab) {
                mBtn.classList.remove('text-white/50');
                mBtn.classList.add('text-white');
            } else {
                mBtn.classList.remove('text-white');
                mBtn.classList.add('text-white/50');
            }
        }
    });
}

/**
 * filterTable: ฟังก์ชันค้นหา
 */
function filterTable() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || "";
    const filtered = globalData.filter(item => 
        (item.type && item.type.toLowerCase().includes(query)) || 
        (item.id && item.id.toLowerCase().includes(query)) ||
        (item.dept && item.dept.toLowerCase().includes(query))
    );
    
    if (isMobile) {
        if (typeof renderMobileTable === 'function') renderMobileTable(filtered);
    } else {
        if (typeof renderDesktopTable === 'function') renderDesktopTable(filtered);
    }
}

/**
 * groupAndSortData: ช่วยจัดกลุ่มข้อมูล
 */
function groupAndSortData(data, key, limit) {
    const counts = data.reduce((acc, curr) => {
        const val = curr[key] || 'ไม่ระบุ';
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
}
