/**
 * version 00032
 * Logic สำหรับหน้า Dashboard (Desktop)
 */
function renderDesktopDashboard(data) {
  const total = data.length;
  const normal = data.filter(d => ['ปกติ','ใช้งานได้','พร้อมใช้'].some(s => String(d.status).includes(s))).length;
  const broken = data.filter(d => ['ชำรุด','พัง','ซ่อม','ไม่พร้อมใช้'].some(s => String(d.status).includes(s))).length;
  const waiting = data.filter(d => String(d.status).includes('รอจำหน่าย')).length;

  const mapping = {
    'total-val': total,
    'normal-val': normal,
    'broken-val': broken,
    'waiting-val': waiting
  };

  Object.entries(mapping).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val.toLocaleString();
  });

  const typeData = groupAndSortData(data, 'type', 10);
  const deptData = groupAndSortData(data, 'dept', 8);

  updateChartInstance('typeChart', 'doughnut', Object.keys(typeData), Object.values(typeData), ['#064e3b', '#059669', '#10b981', '#6ee7b7', '#d1fae5']);
  updateChartInstance('deptChart', 'bar', Object.keys(deptData), Object.values(deptData), '#059669');
}
