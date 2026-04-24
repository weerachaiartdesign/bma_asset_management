/**
 * version 00055
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
        broken: data.filter(d => ['ชำรุด','พัง','รอซ่อม'].some(s => d.status.includes(s))).length,
        waiting: data.filter(d => d.status.includes('รอจำหน่าย')).length
    };

    // 2. อัปเดตตัวเลขในหน้าจอ Desktop
    const mapping = { 'total': 'total-val', 'normal': 'normal-val', 'broken': 'broken-val', 'waiting': 'waiting-val' };
    Object.keys(mapping).forEach(key => {
        const el = document.getElementById(mapping[key]);
        if(el) el.innerText = stats[key].toLocaleString();
    });

    // 3. เตรียมข้อมูลสำหรับกราฟ (จัดกลุ่มและดึง 8 อันดับแรก)
    const typeMap = groupAndSortData(data, 'type', 8);
    const deptMap = groupAndSortData(data, 'department', 8);

    // 4. วาดกราฟ
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
        broken: data.filter(d => ['ชำรุด','พัง','รอซ่อม'].some(s => d.status.includes(s))).length,
        waiting: data.filter(d => d.status.includes('รอจำหน่าย')).length
    };

    // อัปเดตตัวเลข UI มือถือ
    const ids = { total: 'm-total', normal: 'm-normal', broken: 'm-broken', waiting: 'm-waiting' };
    Object.entries(ids).forEach(([k, v]) => {
        const el = document.getElementById(v);
        if(el) el.innerText = stats[k].toLocaleString();
    });

    const typeMap = groupAndSortData(data, 'type', 6);
    const deptMap = groupAndSortData(data, 'department', 6);

    // วาดกราฟมือถือ
    updateMobileChart('mTypeChart', 'doughnut', Object.keys(typeMap), Object.values(typeMap));
    updateMobileChart('mDeptChart', 'horizontalBar', Object.keys(deptMap), Object.values(deptMap));
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
    
    charts[id] = new Chart(canvas, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: isDoughnut 
                    ? ['#064e3b', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5']
                    : '#059669',
                borderRadius: isDoughnut ? 0 : 4
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
                    title: { display: true, text: 'จำนวน (รายการ)', font: { size: 10 } }
                },
                x: {
                    ticks: { font: { size: 9 }, rotation: -30, autoSkip: true, maxRotation: 45 }
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
    
    charts[id] = new Chart(canvas.getContext('2d'), {
        type: 'bar',  // ใช้ bar เป็นหลัก
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: isDoughnut 
                    ? ['#064e3b', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
                    : '#059669',
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
                    title: {
                        display: !isHorizontalBar,
                        text: 'จำนวน (รายการ)',
                        font: { size: 9 }
                    },
                    ticks: {
                        font: { size: 8 },
                        stepSize: 1,
                        autoSkip: true,
                        maxRotation: 45
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: isHorizontalBar,
                        text: 'จำนวน (รายการ)',
                        font: { size: 9 }
                    },
                    ticks: {
                        font: { size: 8 },
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * ฟังก์ชัน groupAndSortData: จัดกลุ่มและเรียงลำดับข้อมูล
 * @param {Array} data - ข้อมูลทรัพย์สิน
 * @param {string} key - ชื่อฟิลด์ที่ต้องการจัดกลุ่ม
 * @param {number} limit - จำนวนสูงสุดที่ต้องการแสดง
 * @returns {Object} - Object ที่มี key เป็นชื่อกลุ่ม และ value เป็นจำนวน
 */
function groupAndSortData(data, key, limit) {
    const counts = data.reduce((acc, curr) => {
        let val = curr[key] || 'ไม่ระบุ';
        // รองรับกรณี department เก็บใน dept
        if (key === 'department' && (!val || val === 'ไม่ระบุ') && curr.dept) {
            val = curr.dept;
        }
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit));
}
