/**
 * version 00033
 * ฟังก์ชันสำหรับประมวลผลข้อมูลและอัปเดต Dashboard บน Desktop
 * ปรับปรุง: แสดงชื่อรายการ (Legend) ไว้ที่ด้านข้างของกราฟวงกลม
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

  // เตรียมข้อมูลกราฟ
  const typeMap = groupAndSortData(data, 'type', 10);
  const deptMap = groupAndSortData(data, 'dept', 10);

  // วาดกราฟประเภท (Doughnut) และ กราฟหน่วยงาน (Bar)
  updateChart('typeChart', 'doughnut', Object.keys(typeMap), Object.values(typeMap));
  updateChart('deptChart', 'bar', Object.keys(deptMap), Object.values(deptMap));
}

/**
 * ฟังก์ชัน updateChart: จัดการการวาดหรือทำลายกราฟเก่าก่อนสร้างใหม่ (Chart.js)
 * ปรับปรุง: ตั้งค่า position ของ legend ให้เป็น 'right' สำหรับกราฟวงกลม
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
          position: type === 'doughnut' ? 'right' : 'top', // แสดงด้านข้างเฉพาะกราฟวงกลม
          labels: {
            font: { family: 'Sarabun', size: 11 },
            boxWidth: 12
          }
        }
      }
    }
  });
}
