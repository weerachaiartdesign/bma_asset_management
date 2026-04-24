/**
 * version 00055
 * ไฟล์: asset-detail.js
 * หน้าที่: จัดการการแสดงรายละเอียดทรัพย์สินแบบ Modal
 * รองรับ: ทั้ง Desktop และ Mobile
 * ปรับปรุง: รองรับข้อมูลจากโครงสร้างใหม่ (department, workplace, responsible_person, images, repair_number, image_fix)
 */

// ตัวแปรสำหรับเก็บ Modal Element
let modalContainer = null;

/**
 * ฟังก์ชันเปิด Modal แสดงรายละเอียดทรัพย์สิน
 * @param {Object} item - ข้อมูลทรัพย์สิน
 */
function showAssetDetail(item) {
    // สร้าง Modal ถ้ายังไม่มี
    if (!modalContainer) {
        createModalContainer();
    }
    
    // แสดง Modal
    modalContainer.style.display = 'flex';
    
    // ===== เติมข้อมูลพื้นฐาน =====
    document.getElementById('detail-id').innerText = item.id || '-';
    document.getElementById('detail-type').innerText = item.type || '-';
    document.getElementById('detail-brand').innerText = item.brand || '-';
    document.getElementById('detail-model').innerText = item.model || '-';
    document.getElementById('detail-serial').innerText = item.serial || '-';
    
    // ===== หน่วยงาน/สถานที่/ผู้รับผิดชอบ (ตามโครงสร้างใหม่) =====
    document.getElementById('detail-department').innerText = item.department || item.dept || '-';
    document.getElementById('detail-location-asset').innerText = item.location_asset || item.location || '-';
    document.getElementById('detail-workplace').innerText = item.workplace || '-';
    document.getElementById('detail-responsible-person').innerText = item.responsible_person || item.owner || '-';
    
    // ===== ข้อมูลวันที่และมูลค่า =====
    document.getElementById('detail-acquired-date').innerText = item.acquired_date || '-';
    document.getElementById('detail-receive-date').innerText = item.receive_date || '-';
    document.getElementById('detail-age').innerText = item.age ? `${item.age} ปี` : '-';
    document.getElementById('detail-value').innerText = item.value ? formatPrice(item.value) : '-';
    
    // ===== หมายเหตุ =====
    document.getElementById('detail-remark').innerText = item.remark || '-';
    
    // ===== ข้อมูลการซ่อม (แสดงเฉพาะเมื่อสถานะเป็นชำรุด/รอซ่อม) =====
    const repairSection = document.getElementById('detail-repair-section');
    const isBroken = item.status && (item.status.includes('ชำรุด') || item.status.includes('รอซ่อม'));
    
    if (repairSection) {
        if (isBroken && (item.repair_number || item.image_fix)) {
            repairSection.style.display = 'block';
            document.getElementById('detail-repair-number').innerText = item.repair_number || '-';
            // แสดงรูปการซ่อม
            const repairImageContainer = document.getElementById('detail-repair-images');
            if (repairImageContainer && item.image_fix) {
                repairImageContainer.innerHTML = `<img src="${convertGoogleDriveUrl(item.image_fix)}" class="detail-image" onclick="openImageZoom('${convertGoogleDriveUrl(item.image_fix)}')" alt="รูปการซ่อม">`;
            }
        } else {
            repairSection.style.display = 'none';
        }
    }
    
    // ===== จัดการสถานะ =====
    const statusEl = document.getElementById('detail-status');
    if (statusEl) {
        statusEl.innerText = item.status || '-';
        statusEl.className = `px-3 py-1 rounded-full text-[10px] font-bold ${getStatusClassForModal(item.status)}`;
    }
    
    // ===== จัดการลิงก์ URL =====
    const urlLink = document.getElementById('detail-url');
    if (urlLink) {
        if (item.url) {
            urlLink.href = item.url;
            urlLink.style.display = 'flex';
        } else {
            urlLink.style.display = 'none';
        }
    }
    
    // ===== จัดการรูปภาพ (Image_1, Image_2, Image_Location) =====
    // รูปหลัก (Image_1 และ Image_2)
    const imageSection = document.getElementById('detail-image-section');
    const imageContainer = document.getElementById('detail-images');
    if (imageSection && imageContainer) {
        const allImages = [];
        if (item.images && item.images.length > 0) {
            item.images.forEach(img => {
                if (img) allImages.push(convertGoogleDriveUrl(img));
            });
        }
        // เพิ่ม Image_Location ด้วย
        if (item.image_location) {
            allImages.push(convertGoogleDriveUrl(item.image_location));
        }
        
        if (allImages.length > 0) {
            imageSection.style.display = 'block';
            imageContainer.innerHTML = allImages.map((img, idx) => `
                <img src="${img}" class="detail-image" onclick="openImageZoom('${img}')" alt="รูปภาพประกอบ ${idx + 1}">
            `).join('');
        } else {
            imageSection.style.display = 'none';
        }
    }
    
    // ===== ระบบตรวจสอบ (การสำรวจ / การยืนยัน) =====
    const exploreEl = document.getElementById('detail-explore');
    const confirmEl = document.getElementById('detail-confirm');
    if (exploreEl) exploreEl.innerText = item.explore || 'ยังไม่สำรวจ';
    if (confirmEl) confirmEl.innerText = item.confirm || 'ยังไม่ยืนยัน';
    
    // ป้องกันการ scroll ของ body ข้างหลัง
    document.body.style.overflow = 'hidden';
}

/**
 * ฟังก์ชันปิด Modal
 * @param {Event} event - Event object (optional)
 */
function closeAssetDetail(event) {
    if (event && event.target !== event.currentTarget) {
        return;
    }
    
    if (modalContainer) {
        modalContainer.style.display = 'none';
        document.body.style.overflow = '';
    }
}

/**
 * ฟังก์ชันสร้าง Modal Container (โหลดจาก asset-detail.html)
 */
async function createModalContainer() {
    try {
        const response = await fetch('asset-detail.html');
        const html = await response.text();
        
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = html;
        modalContainer = modalDiv.firstElementChild;
        
        document.body.appendChild(modalContainer);
        modalContainer.style.display = 'none';
        
    } catch (error) {
        console.error('ไม่สามารถโหลด Modal template:', error);
    }
}

/**
 * ฟังก์ชันแปลง Google Drive URL ให้อยู่ในรูปแบบที่แสดงผลได้
 * @param {string} url - URL จาก Google Drive
 * @returns {string} - URL ที่แปลงแล้ว
 */
function convertGoogleDriveUrl(url) {
    if (!url) return null;
    const match = url.match(/[-\w]{25,}/);
    if (match && url.includes('drive.google.com')) {
        return `https://drive.google.com/uc?export=view&id=${match[0]}`;
    }
    return url;
}

/**
 * ฟังก์ชันจัดรูปแบบราคา
 * @param {number|string} price - ราคา
 * @returns {string} - ราคาที่จัดรูปแบบแล้ว
 */
function formatPrice(price) {
    const num = parseFloat(price);
    if (isNaN(num)) return price;
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0
    }).format(num);
}

/**
 * ฟังก์ชันกำหนดคลาส CSS สำหรับ Modal ตามสถานะ
 * @param {string} status - สถานะทรัพย์สิน
 * @returns {string} - ชื่อคลาส CSS
 */
function getStatusClassForModal(status) {
    if (!status) return 'bg-slate-100 text-slate-600';
    if (status.includes('ปกติ') || status.includes('ใช้งานได้')) {
        return 'bg-emerald-100 text-emerald-700';
    }
    if (status.includes('ชำรุด') || status.includes('พัง') || status.includes('รอซ่อม')) {
        return 'bg-orange-100 text-orange-700';
    }
    if (status.includes('รอจำหน่าย')) {
        return 'bg-slate-100 text-slate-600';
    }
    if (status.includes('จำหน่ายแล้ว')) {
        return 'bg-gray-200 text-gray-600';
    }
    return 'bg-slate-100 text-slate-600';
}

/**
 * ฟังก์ชันขยายรูปภาพ
 * @param {string} imgSrc - URL รูปภาพ
 */
function openImageZoom(imgSrc) {
    window.open(imgSrc, '_blank');
}
