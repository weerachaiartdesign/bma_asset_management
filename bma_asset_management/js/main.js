//** version 00132
/**
 * ไฟล์: js/main.js
 * หน้าที่: ควบคุมการสลับหน้าจอ (SPA) และจัดการสถานะการโหลด
 */

async function loadPage(pageName) {
    const container = document.getElementById('app-container');
    const bottomNav = document.getElementById('bottom-nav');
    const topControls = document.getElementById('top-controls');
    const loader = document.getElementById('app-loader');

    // แสดง Loader เล็กน้อยเพื่อให้รู้ว่ากำลังเปลี่ยนหน้า
    if(loader) loader.style.display = 'flex';
    if(loader) loader.style.opacity = '1';

    try {
        // ป้องกัน Error 404 โดยการใช้ Path ที่แน่นอน
        // เติม .html อัตโนมัติถ้าไม่มี
        const path = pageName.endsWith('.html') ? pageName : `${pageName}.html`;
        
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Page not found: ${path}`);
        
        const html = await response.text();
        container.innerHTML = html;

        // บันทึกตำแหน่งหน้าล่าสุด
        window.location.hash = pageName;

        // ควบคุม UI ตามหน้า
        if (pageName === 'login') {
            bottomNav.classList.add('hidden');
            topControls.classList.add('hidden');
        } else {
            bottomNav.classList.remove('hidden');
            topControls.classList.remove('hidden');
            const userInitial = localStorage.getItem('userName') ? localStorage.getItem('userName').charAt(0).toUpperCase() : 'U';
            document.getElementById('user-profile-btn').innerText = userInitial;
        }

    } catch (err) {
        console.error("Load failed:", err);
        container.innerHTML = `<div class="p-10 text-center"><i class="fas fa-exclamation-triangle text-red-500 text-4xl"></i><p class="mt-4">ไม่สามารถโหลดหน้า ${pageName} ได้</p></div>`;
    } finally {
        // ซ่อน Loader
        setTimeout(() => {
            if(loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 500);
            }
        }, 300);
    }
}

// ตรวจสอบการเข้าสู่ระบบเมื่อเปิดแอป
window.addEventListener('load', () => {
    // แก้ไขปัญหาการ Refresh แล้วหน้าหายใน SPA
    const currentHash = window.location.hash.replace('#', '') || '';
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        loadPage('login');
    } else {
        loadPage(currentHash || 'dashboard');
    }
});

// ตรวจสอบการกดย้อนกลับ (Back Button) ของ Browser/Mobile
window.addEventListener('hashchange', () => {
    const page = window.location.hash.replace('#', '');
    if (page) loadPage(page);
});