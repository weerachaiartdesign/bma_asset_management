/**
 * version 00055
 * ไฟล์: dashboard.js
 * หน้าที่: คำนวณข้อมูลทางสถิติและวาดกราฟ (Chart.js) สำหรับหน้า Dashboard
 */

// คลังสีโทนเขียว 20 เฉด (เรียงจากเข้มไปอ่อน)
const GREEN_COLORS = [
    '#022c22',  // 1: เข้มที่สุด
    '#043a2c',  // 2
    '#064e3b',  // 3
    '#075949',  // 4
    '#065f46',  // 5
    '#056b49',  // 6
    '#047857',  // 7
    '#059063',  // 8
    '#059669',  // 9
    '#0ba773',  // 10
    '#10b981',  // 11
    '#1fbd82',  // 12
    '#34d399',  // 13
    '#4ddcac',  // 14
    '#6ee7b7',  // 15
    '#8aecc5',  // 16
    '#a7f3d0',  // 17
    '#bcf5dc',  // 18
    '#d1fae5',  // 19
    '#ecfdf5'   // 20: อ่อนที่สุด
];

/**
 * ฟังก์ชัน getChartColors: ดึงสีตามจำนวนที่ต้องการ
 * @param {number} count - จำนวนสีที่ต้องการ
 * @returns {Array} - รายการสี (ไล่เฉดจากเข้มไปอ่อน)
 */
function getChartColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        // ใช้ modulo เพื่อรองรับกรณีจำนวนมากกว่า 20
        colors.push(GREEN_COLORS[i % GREEN_COLORS.length]);
    }
    return colors;
}

/**
 * ฟังก์ชัน renderDesktopDashboard: ประมวลผลและอัปเดต UI สำหรับคอมพิวเตอร์
 * @param {Array} data - ข้อมูลทรัพย์สินทั้งหมดจาก API
 */
function renderDesktopDashboard(data) {
    // 1. คำนวณจำนวนตามสถานะ
    const stats = {
        total: data.length,
        normal: data.filter(d => ['ปกติ','ใช้งานได้'].some(s => d.status.includes(s))).length,
        broken: data.filter(d => ['ชำรุด','พัง','รอซ่อม'].some(s => d.status.includes(s))).length,
        waiting: data.filter(d => d.status.includes('รอจำหน่าย')).length
    };

    // 2. อัปเดตตัวเลขในหน้าจอ Desktop
    const mapping = { 'total': 'total-val', 'normal': 'normal-val', 'broken': 'broken-val', 'waiting': 'waiting-val' };
    Object.keys(mapping).forEach(key => {
        const el = document.getElementById(mapping[key]);
        if(el) el.innerText = stats[key].toLocaleString();
    });

    // 3. เตรียมข้อมูลสำหรับกราฟ (จัดกลุ่ม 20 อันดับ แต่แสดง 10 อันดับบน Desktop)
    const typeMap = groupAndSortData(data, 'type', 20);
    const deptMap = groupAndSortData(data, 'department', 20);
    
    const typeLabels = Object.keys(typeMap).slice(0, 10);
    const typeValues = Object.values(typeMap).slice(0, 10);
    const deptLabels = Object.keys(deptMap).slice(0, 10);
    const deptValues = Object.values(deptMap).slice(0, 10);

    // 4. วาดกราฟ (Desktop)
    updateChart('typeChart', 'doughnut', typeLabels, typeValues);
    updateChart('deptChart', 'bar', deptLabels, deptValues);
}

/**
 * ฟังก์ชัน renderMobileDashboard: ประมวลผลและอัปเดต UI สำหรับมือถือ
 * @param {Array} data - ข้อมูลทรัพย์สินทั้งหมดจาก API
 */
function renderMobileDashboard(data) {
    const stats = {
        total: data.length,
        normal: data.filter(d => ['ปกติ','ใช้งานได้'].some(s => d.status.includes(s))).length,
        broken: data.filter(d => ['ชำรุด','พัง','รอซ่อม'].some(s => d.status.includes(s))).length,
        waiting: data.filter(d => d.status.includes('รอจำหน่าย')).length
    };

    // อัปเดตตัวเลข UI มือถือ
    const ids = { total: 'm-total', normal: 'm-normal', broken: 'm-broken', waiting: 'm-waiting' };
    Object.entries(ids).forEach(([k, v]) => {
        const el = document.getElementById(v);
        if(el) el.innerText = stats[k].toLocaleString();
    });
    
    // เตรียมข้อมูลสำหรับกราฟ (จัดกลุ่ม 20 อันดับ แต่แสดง 6 อันดับบน Mobile)
    const typeMap = groupAndSortData(data, 'type', 20);
    const deptMap = groupAndSortData(data, 'department', 20);
    
    const typeLabels = Object.keys(typeMap).slice(0, 10);
    const typeValues = Object.values(typeMap).slice(0, 10);
    const deptLabels = Object.keys(deptMap).slice(0, 10);
    const deptValues = Object.values(deptMap).slice(0, 10);

    // วาดกราฟมือถือ (แนวนอนทั้งคู่)
    updateMobileChart('mTypeChart', 'horizontalBar', typeLabels, typeValues);
    updateMobileChart('mDeptChart', 'horizontalBar', deptLabels, deptValues);
}

/**
 * ฟังก์ชัน updateChart: สร้าง/ทำลายกราฟ Chart.js (Desktop)
 * @param {string} id - ID ของ canvas
 * @param {string} type - ประเภทกราฟ ('doughnut', 'bar')
 * @param {Array} labels - รายการชื่อ
 * @param {Array} values - รายการค่า
 */
function updateChart(id, type, labels, values) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (charts[id]) charts[id].destroy();

    const isDoughnut = type === 'doughnut';
    const colors = getChartColors(labels.length);
    
    charts[id] = new Chart(canvas, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,  // ทุกกราฟไล่เฉดสีทั้งหมด
                borderColor: isDoughnut ? '#ffffff' : 'transparent',
                borderWidth: isDoughnut ? 2 : 0,
                borderRadius: isDoughnut ? 0 : 4,
                barPercentage: 0.7,
                categoryPercentage: 0.8
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: isDoughnut,
                    position: 'right',
                    labels: { font: { family: 'Sarabun', size: 11 }, boxWidth: 12 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw} รายการ`;
                        }
                    }
                }
            },
            scales: isDoughnut ? {} : {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { size: 10 } },
                    title: { display: false },
                    grid: { color: '#e2e8f0' }
                },
                x: {
                    ticks: { font: { size: 9 }, rotation: -30, autoSkip: true, maxRotation: 45 },
                    title: { display: false },
                    grid: { display: false }
                }
            }
        }
    });
}

/**
 * ฟังก์ชัน updateMobileChart: สร้าง/ทำลายกราฟ Chart.js (Mobile)
 * @param {string} id - ID ของ canvas
 * @param {string} type - ประเภทกราฟ ('doughnut', 'horizontalBar')
 * @param {Array} labels - รายการชื่อ
 * @param {Array} values - รายการค่า
 */
function updateMobileChart(id, type, labels, values) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (charts[id]) charts[id].destroy();

    const isDoughnut = type === 'doughnut';
    const isHorizontalBar = type === 'horizontalBar';
    const colors = getChartColors(labels.length);
    
    charts[id] = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,  // ทุกกราฟไล่เฉดสีทั้งหมด
                borderRadius: 4,
                barPercentage: 0.7,
                categoryPercentage: 0.8
            }]
        },
        options: { 
            indexAxis: isHorizontalBar ? 'y' : 'x',
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `จำนวน: ${context.raw} รายการ`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: !isHorizontalBar,
                    title: { display: false },
                    ticks: {
                        font: { size: 8 },
                        stepSize: 1,
                        autoSkip: true,
                        maxRotation: 45
                    },
                    grid: { display: false }
                },
                y: {
                    display: true,
                    title: { display: false },
                    ticks: {
                        font: { size: 8 },
                        stepSize: 1
                    },
                    grid: { color: '#e2e8f0' }
                }
            }
        }
    });
}

/**
 * ฟังก์ชัน groupAndSortData: จัดกลุ่มและเรียงลำดับข้อมูล
 * @param {Array} data - ข้อมูลทรัพย์สิน
 * @param {string} key - ชื่อฟิลด์ที่ต้องการจัดกลุ่ม
 * @param {number} limit - จำนวนสูงสุดที่ต้องการเก็บ (เผื่อไว้)
 * @returns {Object} - Object ที่มี key เป็นชื่อกลุ่ม และ value เป็นจำนวน
 */
function groupAndSortData(data, key, limit) {
    const counts = data.reduce((acc, curr) => {
        let val = curr[key] || 'ไม่ระบุ';
        // รองรับกรณี department เก็บใน dept
        if (key === 'department') {
            if ((!val || val === 'ไม่ระบุ') && curr.dept) val = curr.dept;
            if ((!val || val === 'ไม่ระบุ') && curr.responsible_person) val = curr.responsible_person;
        }
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return Object.fromEntries(sorted.slice(0, limit));
}
