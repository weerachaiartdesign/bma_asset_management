/**
 * version 00033
 * ไฟล์รวมฟังก์ชันสำหรับจัดการ Dashboard ทั้ง Desktop และ Mobile
 */

// --- Desktop Functions ---

/**
 * ฟังก์ชันสำหรับประมวลผลข้อมูลและอัปเดต Dashboard บน Desktop
 */
function renderDesktopDashboard(data) {
  // คำนวณค่าทางสถิติ
  const stats = {
    total: data.length,
    normal: data.filter(d => ['ปกติ','ใช้งานได้'].some(s => d.status.includes(s))).length,
    broken: data.filter(d => ['ชำรุด','พัง'].some(s => d.status.includes(s))).length,
    waiting: data.filter(d => d.status.includes('รอจำหน่าย')).length
  };

  // อัปเดตตัวเลขใน Card
  Object.keys(stats).forEach(id => {
    const el = document.getElementById(id + '-val');
    if(el) el.innerText = stats[id].toLocaleString();
  });

  // เตรียมข้อมูลกราฟ (Top 10)
  const typeMap = groupAndSortData(data, 'type', 10);
  const deptMap = groupAndSortData(data, 'dept', 10);

  // วาดกราฟประเภท (Doughnut) และ กราฟหน่วยงาน (Bar)
  updateChart('typeChart', 'doughnut', Object.keys(typeMap), Object.values(typeMap));
  updateChart('deptChart', 'bar', Object.keys(deptMap), Object.values(deptMap));
}

/**
 * ฟังก์ชัน updateChart: จัดการการวาดหรือทำลายกราฟเก่าก่อนสร้างใหม่ (Chart.js Desktop)
 */
function updateChart(id, type, labels, values) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  if (charts[id]) charts[id].destroy();

  charts[id] = new Chart(canvas, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ['#064e3b', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5', '#f0fdf4', '#f8fafc']
      }]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: type === 'doughnut' ? 'right' : 'top',
          labels: {
            font: { family: 'Sarabun', size: 11 },
            boxWidth: 12
          }
        }
      }
    }
  });
}

// --- Mobile Functions ---

/**
 * ฟังก์ชันจัดการ Dashboard สำหรับหน้าจอมือถือ
 */
function renderMobileDashboard(data) {
  // 1. คำนวณสถิติ
  const stats = {
    total: data.length,
    normal: data.filter(d => ['ปกติ','ใช้งานได้'].some(s => d.status.includes(s))).length,
    broken: data.filter(d => ['ชำรุด','พัง'].some(s => d.status.includes(s))).length,
    waiting: data.filter(d => d.status.includes('รอจำหน่าย')).length
  };

  // 2. อัปเดตค่าสถิติลงใน UI มือถือ
  const totalEl = document.getElementById('m-total');
  const normalEl = document.getElementById('m-normal');
  const brokenEl = document.getElementById('m-broken');
  const waitingEl = document.getElementById('m-waiting');
  
  if(totalEl) totalEl.innerText = stats.total.toLocaleString();
  if(normalEl) normalEl.innerText = stats.normal.toLocaleString();
  if(brokenEl) brokenEl.innerText = stats.broken.toLocaleString();
  if(waitingEl) waitingEl.innerText = stats.waiting.toLocaleString();

  // 3. เตรียมข้อมูลกราฟ (Top 10 สำหรับประเภท, Top 10 สำหรับหน่วยงาน)
  const typeMap = groupAndSortData(data, 'type', 10);
  const deptMap = groupAndSortData(data, 'dept', 10);
  
  // 4. วาดกราฟประเภท (Doughnut)
  updateMobileChart('mTypeChart', 'doughnut', Object.keys(typeMap), Object.values(typeMap));
  
  // 5. วาดกราฟหน่วยงาน (Horizontal Bar)
  updateMobileChart('mDeptChart', 'horizontalBar', Object.keys(deptMap), Object.values(deptMap));
}

/**
 * ฟังก์ชันสำหรับวาดกราฟบนมือถือ
 */
function updateMobileChart(id, type, labels, values) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  if (charts[id]) charts[id].destroy();

  const isDoughnut = type === 'doughnut';
  
  charts[id] = new Chart(canvas.getContext('2d'), {
    type: type === 'horizontalBar' ? 'bar' : type,
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ['#064e3b', '#059669', '#10b981', '#34d399', '#6ee7b7'],
        borderRadius: type === 'horizontalBar' ? 4 : 0
      }]
    },
    options: { 
      indexAxis: type === 'horizontalBar' ? 'y' : 'x',
      responsive: true, 
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: isDoughnut,
          position: 'right',
          labels: {
            font: { family: 'Sarabun', size: 9 },
            boxWidth: 8,
            padding: 5
          }
        }
      },
      scales: type === 'horizontalBar' ? {
        x: { ticks: { font: { size: 9 } } },
        y: { ticks: { font: { size: 9 } } }
      } : {}
    }
  });
}
