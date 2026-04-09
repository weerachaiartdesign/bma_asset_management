/**
 * version 00033
 * ไฟล์ควบคุมหลัก (Main Controller)
 * จัดการการนำทางสลับหน้าจอ (Tab Switching) การดึงข้อมูล และการเลือกฟังก์ชัน Render ให้เหมาะสมกับ Device
 */
let globalData = [];
let charts = {};
let currentTab = 'dashboard';
let isMobile = window.innerWidth < 768;

// เริ่มต้นโหลดข้อมูลเมื่อ Window พร้อม
window.onload = fetchData;

// ตรวจสอบการเปลี่ยนขนาดหน้าจอเพื่อปรับ Layout แบบ Real-time
window.onresize = () => {
  const newIsMobile = window.innerWidth < 768;
  if(newIsMobile !== isMobile) {
    isMobile = newIsMobile;
    renderCurrentPage();
  }
};

/**
 * ฟังก์ชัน fetchData: ดึงข้อมูลจาก Google Apps Script และซ่อนหน้า Loading
 */
async function fetchData() {
  const loadingText = document.getElementById('loading-text');
  try {
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
    if (loadingText) loadingText.innerHTML = `<span class="text-red-600">เกิดข้อผิดพลาด: ${err.message}</span>`;
  }
}

/**
 * ฟังก์ชัน switchTab: รับค่า ID ของ Tab ที่ต้องการเปลี่ยนและทำการ Render ใหม่
 */
function switchTab(tabId) {
  currentTab = tabId;
  updateNavUI(tabId);
  renderCurrentPage();
}

/**
 * ฟังก์ชัน updateNavUI: เปลี่ยนสถานะปุ่มกดในเมนู (Active/Inactive)
 */
function updateNavUI(tabId) {
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  const btn = document.getElementById('btn-' + tabId);
  if(btn) btn.classList.add('active');

  const mDash = document.getElementById('m-btn-dashboard');
  const mInv = document.getElementById('m-btn-inventory');
  if(mDash && mInv) {
    if(tabId === 'dashboard') {
      mDash.style.color = '#065f46';
      mInv.style.color = '#94a3b8';
    } else {
      mInv.style.color = '#065f46';
      mDash.style.color = '#94a3b8';
    }
  }
  document.getElementById('page-title').innerText = tabId === 'dashboard' ? 'Dashboard' : 'รายการทรัพย์สิน';
}

/**
 * ฟังก์ชัน renderCurrentPage: เลือกฟังก์ชันการวาดหน้าจอจากไฟล์ Logic เฉพาะส่วน (Desktop/Mobile)
 */
async function renderCurrentPage() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  const prefix = isMobile ? 'm_' : 'd_';
  const pageName = currentTab === 'dashboard' ? 'dashboard' : 'assets-list';
  
  // โหลด Template HTML
  const res = await fetch(`${prefix}${pageName}.html`);
  mainContent.innerHTML = await res.text();

  // เรียกใช้ฟังก์ชัน Render ที่อยู่ในไฟล์ JS แยกส่วน
  if (currentTab === 'dashboard') {
    isMobile ? renderMobileDashboard(globalData) : renderDesktopDashboard(globalData);
  } else {
    isMobile ? renderMobileTable(globalData) : renderDesktopTable(globalData);
  }
}

/**
 * ฟังก์ชัน filterTable: ใช้สำหรับกรองข้อมูลในหน้ารายการทรัพย์สิน
 */
function filterTable() {
  const query = document.getElementById('searchInput')?.value.toLowerCase() || "";
  const filtered = globalData.filter(item => 
    item.type.toLowerCase().includes(query) || 
    item.id.toLowerCase().includes(query) ||
    item.dept.toLowerCase().includes(query)
  );
  isMobile ? renderMobileTable(filtered) : renderDesktopTable(filtered);
}

/**
 * Helper: รวมกลุ่มข้อมูลและเรียงลำดับ (ใช้สำหรับวาดกราฟ)
 */
function groupAndSortData(data, key, limit) {
  const counts = data.reduce((acc, curr) => {
    const val = curr[key] || 'ไม่ระบุ';
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  return Object.fromEntries(Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, limit));
}
