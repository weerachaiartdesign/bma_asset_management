/**
 * version 00034
 * ไฟล์: dashboard.js
 * หน้าที่: คำนวณข้อมูลทางสถิติและวาดกราฟ (Chart.js) สำหรับหน้า Dashboard
 */

/**
 * ฟังก์ชัน renderDesktopDashboard: ประมวลผลและอัปเดต UI สำหรับคอมพิวเตอร์
 * @param {Array} data - ข้อมูลทรัพย์สินทั้งหมดจาก API
 */
function renderDesktopDashboard(data) {
    // 1. คำนวณจำนวนตามสถานะ
    const stats = {
        total: data.length,
        normal: data.filter(d => ['ปกติ','ใช้งานได้'].some(s => d.status.includes(s))).length,
        broken: data.filter(d => ['ชำรุด','พัง'].some(s => d.status.includes(s))).length,
        waiting: data.filter(d => d.status.includes('รอจำหน่าย')).length
    };

    // 2. อัปเดตตัวเลขในหน้าจอ
    const mapping = { 'total': 'total-val', 'normal': 'normal-val', 'broken': 'broken-val', 'waiting': 'waiting-val' };
    Object.keys(mapping).forEach(key => {
        const el = document.getElementById(mapping[key]);
        if(el) el.innerText = stats[key].toLocaleString();
    });

    // 3. เตรียมข้อมูลสำหรับกราฟ (จัดกลุ่มและดึง 10 อันดับแรก)
    const typeMap = groupAndSortData(data, 'type', 10);
    const deptMap = groupAndSortData(data, 'dept', 10);

    // 4. วาดกราฟวงกลมและกราฟแท่ง
    updateChart('typeChart', 'doughnut', Object.keys(typeMap), Object.values(typeMap));
    updateChart('deptChart', 'bar', Object.keys(deptMap), Object.values(deptMap));
}

/**
 * ฟังก์ชัน renderMobileDashboard: ประมวลผลและอัปเดต UI สำหรับมือถือ
 * @param {Array} data - ข้อมูลทรัพย์สินทั้งหมดจาก API
 */
function renderMobileDashboard(data) {
    const stats = {
        total: data.length,
        normal: data.filter(d => ['ปกติ','ใช้งานได้'].some(s => d.status.includes(s))).length,
        broken: data.filter(d => ['ชำรุด','พัง'].some(s => d.status.includes(s))).length,
        waiting: data.filter(d => d.status.includes('รอจำหน่าย')).length
    };

    // อัปเดตตัวเลข UI มือถือ
    const ids = { total: 'm-total', normal: 'm-normal', broken: 'm-broken', waiting: 'm-waiting' };
    Object.entries(ids).forEach(([k, v]) => {
        const el = document.getElementById(v);
        if(el) el.innerText = stats[k].toLocaleString();
    });

    const typeMap = groupAndSortData(data, 'type', 10);
    const deptMap = groupAndSortData(data, 'dept', 10);

    // วาดกราฟมือถือ (Doughnut และ Horizontal Bar)
    updateMobileChart('mTypeChart', 'doughnut', Object.keys(typeMap), Object.values(typeMap));
    updateMobileChart('mDeptChart', 'horizontalBar', Object.keys(deptMap), Object.values(deptMap));
}

/**
 * ฟังก์ชัน updateChart: สร้าง/ทำลายกราฟ Chart.js (Desktop)
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
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: type === 'doughnut' ? 'right' : 'top',
                    labels: { font: { family: 'Sarabun', size: 11 }, boxWidth: 12 }
                }
            }
        }
    });
}

/**
 * ฟังก์ชัน updateMobileChart: สร้าง/ทำลายกราฟ Chart.js (Mobile)
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
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: isDoughnut,
                    position: 'right',
                    labels: { font: { family: 'Sarabun', size: 9 }, boxWidth: 8, padding: 5 }
                }
            },
            scales: type === 'horizontalBar' ? {
                x: { ticks: { font: { size: 9 } } },
                y: { ticks: { font: { size: 9 } } }
            } : {}
        }
    });
}
