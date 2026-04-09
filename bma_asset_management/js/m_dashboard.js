/**
 * version 00033 (Updated)
 * ฟังก์ชันจัดการ Dashboard สำหรับหน้าจอมือถือ
 * ปรับปรุง: เพิ่มสถิติรอจำหน่าย กราฟแยกตามหน่วยงาน และ Legend ด้านข้าง
 */
function renderMobileDashboard(data) {
  // 1. คำนวณสถิติ
  const stats = {
    total: data.length,
    normal: data.filter(d => ['ปกติ','ใช้งานได้'].some(s => d.status.includes(s))).length,
    broken: data.filter(d => ['ชำรุด','พัง'].some(s => d.status.includes(s))).length,
    waiting: data.filter(d => d.status.includes('รอจำหน่าย')).length
  };

  // 2. อัปเดตค่าสถิติลงใน UI
  const totalEl = document.getElementById('m-total');
  const normalEl = document.getElementById('m-normal');
  const brokenEl = document.getElementById('m-broken');
  const waitingEl = document.getElementById('m-waiting'); // เพิ่มรอจำหน่าย
  
  if(totalEl) totalEl.innerText = stats.total.toLocaleString();
  if(normalEl) normalEl.innerText = stats.normal.toLocaleString();
  if(brokenEl) brokenEl.innerText = stats.broken.toLocaleString();
  if(waitingEl) waitingEl.innerText = stats.waiting.toLocaleString();

  // 3. เตรียมข้อมูลกราฟ
  const typeMap = groupAndSortData(data, 'type', 5);
  const deptMap = groupAndSortData(data, 'dept', 5); // กรอง Top 5 หน่วยงาน
  
  // 4. วาดกราฟประเภท (Doughnut)
  updateMobileChart('mTypeChart', 'doughnut', Object.keys(typeMap), Object.values(typeMap));
  
  // 5. วาดกราฟหน่วยงาน (Horizontal Bar เพื่อประหยัดพื้นที่แนวตั้ง)
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
          display: isDoughnut, // แสดงเฉพาะกราฟวงกลม
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
