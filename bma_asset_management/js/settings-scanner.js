/**
 * version 00056
 * ไฟล์: settings-scanner.js
 * หน้าที่: จัดการการสแกน QR Code และนำเข้าข้อมูลทรัพย์สิน
 */

let scannerHtml5QrCode = null;
let scannerIsDuplicate = false;
let scannerCurrentData = {};

// ==================== QR SCANNER FUNCTIONS ====================

async function startScannerCamera() {
    const readerDiv = document.getElementById('qr-reader');
    const startBtn = document.getElementById('start-camera-btn');
    const stopBtn = document.getElementById('stop-camera-btn');
    const statusDiv = document.getElementById('qr-status');
    
    if (scannerHtml5QrCode && scannerHtml5QrCode.isScanning) return;
    
    readerDiv.style.display = 'block';
    stopBtn.style.display = 'flex';
    startBtn.style.display = 'none';
    statusDiv.innerText = "📷 กำลังเปิดกล้อง...";
    statusDiv.className = "qr-status status-loading";
    
    try {
        if (!scannerHtml5QrCode) {
            scannerHtml5QrCode = new Html5Qrcode("qr-reader");
        }
        const config = { fps: 20, qrbox: { width: 250, height: 250 } };
        await scannerHtml5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            (text) => handleScannerResult(text)
        );
        statusDiv.innerText = "📸 เล็งไปที่ QR Code บนครุภัณฑ์";
        statusDiv.className = "qr-status status-scanning";
    } catch (err) {
        statusDiv.innerText = "❌ ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง";
        statusDiv.className = "qr-status status-error";
        stopScannerCamera();
    }
}

async function stopScannerCamera() {
    if (scannerHtml5QrCode && scannerHtml5QrCode.isScanning) {
        try {
            await scannerHtml5QrCode.stop();
        } catch (err) {}
    }
    const readerDiv = document.getElementById('qr-reader');
    const startBtn = document.getElementById('start-camera-btn');
    const stopBtn = document.getElementById('stop-camera-btn');
    
    readerDiv.style.display = 'none';
    stopBtn.style.display = 'none';
    startBtn.style.display = 'flex';
}

function uploadScannerImage() {
    const fileInput = document.getElementById('qr-file-input');
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const statusDiv = document.getElementById('qr-status');
        statusDiv.innerText = "⌛ กำลังสแกนไฟล์รูป...";
        statusDiv.className = "qr-status status-loading";
        
        const fileScanner = new Html5Qrcode("qr-reader");
        try {
            const text = await fileScanner.scanFile(file, true);
            await handleScannerResult(text);
            fileScanner.clear();
        } catch (err) {
            statusDiv.innerText = "❌ ไม่พบ QR Code ในรูปภาพ";
            statusDiv.className = "qr-status status-error";
            fileScanner.clear();
        }
        fileInput.value = '';
    };
    fileInput.click();
}

async function handleScannerResult(url) {
    await stopScannerCamera();
    
    const statusDiv = document.getElementById('qr-status');
    const formCard = document.getElementById('scanner-form-card');
    const duplicateAlert = document.getElementById('duplicate-alert');
    const saveBtn = document.getElementById('scanner-save-btn');
    
    statusDiv.innerText = "⌛ กำลังดึงข้อมูลจากระบบ กทม...";
    statusDiv.className = "qr-status status-loading";
    
    // ซ่อนฟอร์มเก่าและแจ้งเตือน
    formCard.style.display = 'none';
    duplicateAlert.style.display = 'none';
    scannerIsDuplicate = false;
    
    try {
        const response = await fetch(`${GAS_API_URL}?action=getBmaData&url=${encodeURIComponent(url)}`);
        const result = await response.json();
        
        if (result.error) throw new Error(result.error);
        
        scannerCurrentData = result;
        scannerCurrentData.url = url;
        scannerCurrentData.scan_date = new Date().toLocaleString('th-TH');
        
        // เติมข้อมูลลงฟอร์ม
        fillScannerForm(result);
        
        // ตรวจสอบข้อมูลซ้ำ
        await checkScannerDuplicate(result.f1);
        
        if (scannerIsDuplicate) {
            statusDiv.innerText = "❌ ข้อมูลนี้ถูกบันทึกไปแล้ว ไม่สามารถบันทึกซ้ำได้";
            statusDiv.className = "qr-status status-error";
            formCard.style.display = 'block';
            if (saveBtn) saveBtn.disabled = true;
        } else {
            statusDiv.innerText = "✅ ดึงข้อมูลสำเร็จ กรุณาตรวจสอบและบันทึก";
            statusDiv.className = "qr-status status-success";
            formCard.style.display = 'block';
            if (saveBtn) saveBtn.disabled = false;
        }
        
    } catch (err) {
        statusDiv.innerText = "❌ ดึงข้อมูลล้มเหลว: " + err.message;
        statusDiv.className = "qr-status status-error";
        formCard.style.display = 'none';
    }
}

function fillScannerForm(data) {
    const fields = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'f15', 'f19', 'f20', 'f_dept'];
    fields.forEach(field => {
        const el = document.getElementById(`scan-${field}`);
        if (el && data[field]) el.value = data[field];
    });
    document.getElementById('scan-url').value = data.url || '';
    document.getElementById('scan-date').value = new Date().toLocaleString('th-TH');
}

async function checkScannerDuplicate(f1Value) {
    if (!f1Value) return;
    try {
        const response = await fetch(`${GAS_API_URL}?action=checkDuplicate&f1=${encodeURIComponent(f1Value)}`);
        const result = await response.json();
        
        if (result.exists) {
            scannerIsDuplicate = true;
            const alertDiv = document.getElementById('duplicate-alert');
            const msgSpan = document.getElementById('duplicate-message');
            if (msgSpan) msgSpan.innerText = `เลขครุภัณฑ์ ${f1Value} ถูกบันทึกในระบบแล้ว`;
            if (alertDiv) alertDiv.style.display = 'flex';
        }
    } catch (e) {
        console.error('Error checking duplicate:', e);
    }
}

async function submitScannerData() {
    const saveBtn = document.getElementById('scanner-save-btn');
    const originalText = saveBtn.innerHTML;
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
        <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        กำลังบันทึก...
    `;
    
    try {
        const formData = {};
        document.querySelectorAll('#scanner-asset-form input').forEach(input => {
            if (input.id) {
                let key = input.id.replace('scan-', '');
                formData[key] = input.value;
            }
        });
        formData.url = document.getElementById('scan-url').value;
        formData.scan_date = document.getElementById('scan-date').value;
        formData.source = 'scanner';
        
        const response = await fetch(GAS_API_URL, { 
            method: 'POST', 
            body: JSON.stringify(formData) 
        });
        const result = await response.json();
        
        showScannerModal(result.message, result.success ? "success" : "error", () => {
            if (result.success) {
                resetScannerForm();  // เรียกฟังก์ชันล้างข้อมูล
            }
        });
        
    } catch (error) {
        showScannerModal("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + error.message, "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

function resetScannerForm() {
    // ล้างค่าทั้งหมดในฟอร์ม
    const form = document.getElementById('scanner-asset-form');
    if (form) form.reset();
    
    // ซ่อนฟอร์มการ์ด
    const formCard = document.getElementById('scanner-form-card');
    if (formCard) formCard.style.display = 'none';
    
    // ซ่อนแจ้งเตือนข้อมูลซ้ำ
    const duplicateAlert = document.getElementById('duplicate-alert');
    if (duplicateAlert) duplicateAlert.style.display = 'none';
    
    // รีเซ็ตสถานะตัวแปร
    scannerIsDuplicate = false;
    scannerCurrentData = {};
    
    // รีเซ็ตสถานะข้อความ
    const statusDiv = document.getElementById('qr-status');
    if (statusDiv) {
        statusDiv.innerText = "📱 พร้อมสแกน QR Code";
        statusDiv.className = "qr-status status-idle";
    }
    
    // รีเซ็ตปุ่มบันทึกให้เป็น disabled จนกว่าจะสแกนใหม่
    const saveBtn = document.getElementById('scanner-save-btn');
    if (saveBtn) saveBtn.disabled = true;
    
    // ✅ ไม่เปิดกล้องอัตโนมัติ รอให้ผู้ใช้กดเปิดกล้องเอง
}

function showScannerModal(message, type = 'success', callback = null) {
    // ใช้ modal เดิมที่มีในระบบ หรือสร้างใหม่
    const modal = document.getElementById('customModal');
    const text = document.getElementById('modalText');
    const icon = document.getElementById('modalIcon');
    
    if (modal && text && icon) {
        text.innerText = message;
        icon.innerText = type === 'success' ? '✅' : '❌';
        modal.style.display = 'flex';
        
        const closeModalFn = () => {
            modal.style.display = 'none';
            if (callback) callback();
        };
        
        const modalBtn = document.querySelector('#customModal .modal-btn');
        if (modalBtn) {
            modalBtn.onclick = closeModalFn;
        }
    } else {
        alert(message);
        if (callback) callback();
    }
}
