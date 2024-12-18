const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
    const managerDropdown = document.getElementById("manager");

    // 기존 옵션 제거 함수
    function clearManagerDropdown() {
        managerDropdown.innerHTML = ""; // 모든 기존 옵션 제거
    }

    // PRO 테이블 데이터 가져오기
    ipcRenderer.send("fetch-pros");
    ipcRenderer.once("pros-data", (event, pros) => {
        clearManagerDropdown(); // 기존 옵션 제거
        pros.forEach(pro => {
            const option = document.createElement("option");
            option.value = pro.pro_id;
            option.textContent = pro.pro_name;
            managerDropdown.appendChild(option);
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const submitButton = document.querySelector(".submit-btn");
    const alertDialog = document.getElementById("alertDialog");
    const alertMessage = document.getElementById("alertMessage");
    const alertConfirm = document.getElementById("alertConfirm");

    // 알림 다이얼로그 표시 함수
    function showAlert(message) {
        alertMessage.textContent = message;
        alertDialog.classList.add("active");
    }

    // 알림 다이얼로그 닫기
    alertConfirm.addEventListener("click", () => {
        alertDialog.classList.remove("active");
    });

    submitButton.addEventListener("click", (e) => {
        e.preventDefault(); // 기본 폼 제출 방지
    
        // 데이터 수집
        const name = document.getElementById("name").value.trim();
        const gender = document.getElementById("gender").value;
        const birthDate = `${document.getElementById("year-select").querySelector(".select-selected").textContent}-${document.getElementById("month-select").querySelector(".select-selected").textContent.padStart(2, '0')}-${document.getElementById("day-select").querySelector(".select-selected").textContent.padStart(2, '0')}`;
        const phone = document.getElementById("phone").value.trim();
        const startDate = document.getElementById("start_date").value;
        const months = parseInt(document.getElementById("months").value, 10);
        const expiryDate = document.getElementById("expiry_date").value;
        const lesson = document.getElementById("lesson").value === "true";
        const proId = parseInt(document.getElementById("manager").value, 10);
        const payment = document.getElementById("payment_option").value;
        const price = parseInt(document.getElementById("price").value, 10);
    
        // 필수 필드 검증
        if (!name || !gender || !birthDate || !phone || !startDate || !months || !expiryDate || !proId || isNaN(price)) {
            showAlert("모든 필드를 올바르게 입력해주세요.");
            return;
        }
    
        // 데이터 전송
        ipcRenderer.send("add-golf-member", {
            name,
            gender,
            birthDate,
            phone,
            startDate,
            months,
            expiryDate,
            lesson,
            proId,
            payment,
            price,
        });
    });

    // 등록 성공 알림
    ipcRenderer.on("member-added", () => {
        const successDialog = document.getElementById("successDialog");
        successDialog.classList.add("active");
    
        document.getElementById("dialogConfirm").addEventListener("click", () => {
            location.href = "homePage.html"; // 홈으로 이동
        });
    });      
});
