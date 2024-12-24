const { ipcRenderer } = require("electron");

// -------------------------------------------------- 골프 회원 검색 -------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const tableContents = document.querySelector("#table-contents");
    const nameInput = document.getElementById("name");
    const genderSelect = document.getElementById("gender");
    const proSelect = document.getElementById("manager");
    const durationSelect = document.getElementById("months");

    // 초기 데이터 로드
    function loadGolfData(filters = {}) {
        ipcRenderer.send("fetch-filtered-golf-data", filters);
    }

    // 데이터 수신 및 렌더링
    ipcRenderer.on("filtered-golf-data-response", (event, data) => {
        tableContents.innerHTML = "";

        if (data.length === 0) {
            tableContents.innerHTML = "<div>검색 결과가 없습니다.</div>";
            return;
        }

        data.forEach((row) => {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("table-contents");

            rowDiv.innerHTML = `
                <div class="small">${row.name}</div>
                <div class="small">${row.male === 'M' ? '남자' : '여자'}</div>
                <div class="medium">${row.b_day}</div>
                <div class="big">${row.p_num}</div>
                <div class="big">${row.s_day}</div>
                <div class="small">${row.r_day}개월</div>
                <div class="big">${row.f_day}</div>
                <div class="medium">${row.pro_name || "X"}</div>
                <div class="small">${row.payment === 'A' ? ' 카드' : 'B' ? '현금' : '기타'}</div>
                <div class="small">${row.price}원</div>
                <div class="button-cont">
                    <button class="edit-btn" data-id="${row.golf_id}">수정</button>
                    <button class="delete-btn" data-id="${row.golf_id}">삭제</button>
                </div>
            `;
            tableContents.appendChild(rowDiv);
        });
    });

    // 검색 이벤트
    function applyFilters() {
        const filters = {
            name: nameInput.value.trim(),
            gender: genderSelect.value !== "성별" ? genderSelect.value : null,
            pro_id: proSelect.value !== "프로정보" ? proSelect.value : null,
            duration: durationSelect.value !== "등록기간" ? parseInt(durationSelect.value, 10) : null,
        };
        loadGolfData(filters);
    }

    nameInput.addEventListener("input", applyFilters);
    genderSelect.addEventListener("change", applyFilters);
    proSelect.addEventListener("change", applyFilters);
    durationSelect.addEventListener("change", applyFilters);

    // 초기화
    ipcRenderer.send("fetch-pros");
    ipcRenderer.once("pros-data", (event, pros) => {
        pros.forEach((pro) => {
            const option = document.createElement("option");
            option.value = pro.pro_id;
            option.textContent = pro.pro_name;
            proSelect.appendChild(option);
        });
    });

    document.getElementById("downloadCsv").addEventListener("click", () => {
        ipcRenderer.send("download-csv");
    });
    
    ipcRenderer.on("csv-download-success", (event, filePath) => {
        showDialog(`CSV 파일이 저장되었습니다: ${filePath}`, true);
    });
    
    ipcRenderer.on("csv-download-error", (event, message) => {
        showDialog(`CSV 다운로드 중 오류 발생: ${message}`, false);
    });
    
    ipcRenderer.on("csv-download-cancel", (event, message) => {
        showDialog(message, false);
    });
    
    // 다이얼로그 생성 함수
    function showDialog(message, isSuccess) {
        const dialog = document.createElement("div");
        dialog.className = "dialog-container active";
        dialog.innerHTML = `
            <div class="dialog-title">${isSuccess ? "성공" : "오류"}</div>
            <p>${message}</p>
            <div class="dialog-buttons">
                <button class="confirm" onclick="this.parentElement.parentElement.classList.remove('active')">확인</button>
            </div>
        `;
        document.body.appendChild(dialog);
    }    

    loadGolfData();
});


// -------------------------------------------------- 골프 회원 관리 -------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const tableContents = document.querySelector("#table-contents");
    const managerDropdown = document.getElementById("manager");

    let loggedInUserId = null;
    let loggedInUserRole = null;

    // 로그인된 사용자 정보 요청
    ipcRenderer.send("fetch-logged-in-user");

    ipcRenderer.on("logged-in-user-response", (event, user) => {
        if (user) {
            loggedInUserId = user.id;
            loggedInUserRole = user.role; // 권한 정보 저장
        }
    });

    // GOLF 데이터 로드 함수
    function loadGolfData() {
        ipcRenderer.send("fetch-golf-data");
    }

    // PRO 데이터 로드 함수
    function loadProOptions(proDropdown, selectedProId = null) {
        proDropdown.innerHTML = ""; // 기존 옵션 초기화
        ipcRenderer.send("fetch-pros");
        ipcRenderer.once("pros-data", (event, pros) => {
            pros.forEach((pro) => {
                const option = document.createElement("option");
                option.value = pro.pro_id;
                option.textContent = pro.pro_name;
                if (pro.pro_id === selectedProId) option.selected = true;
                proDropdown.appendChild(option);
            });
        });
    }

    // GOLF 데이터 수신 및 렌더링
    ipcRenderer.on("golf-data-response", (event, data) => {
        console.log("Golf data received:", data);
        tableContents.innerHTML = ""; // 기존 데이터 초기화

        if (data.length === 0) {
            tableContents.innerHTML = "<div>등록된 회원정보가 없습니다.</div>";
            return;
        }

        data.forEach((row) => {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("table-contents");

            rowDiv.innerHTML = `
                <div class="small">${row.name}</div>
                <div class="small">${row.male === 'M' ? '남자' : '여자'}</div>
                <div class="medium">${row.b_day}</div>
                <div class="big">${row.p_num}</div>
                <div class="big">${row.s_day}</div>
                <div class="small">${row.r_day}개월</div>
                <div class="big">${row.f_day}</div>
                <div class="medium">${row.pro_name || "X"}</div>
                <div class="small">${row.payment === 'A' ? ' 카드' : 'B' ? '현금' : '기타'}</div>
                <div class="small">${row.price}원</div>
                <div class="button-cont">
                    <button class="edit-btn" data-id="${row.golf_id}">수정</button>
                    <button class="delete-btn" data-id="${row.golf_id}">삭제</button>
                </div>
            `;
            tableContents.appendChild(rowDiv);
        });
    });

    // 수정 버튼 클릭 이벤트
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("edit-btn")) {
            const golfId = e.target.dataset.id;

            // 권한 확인
            if (loggedInUserRole !== "ADMIN") {
                showNotification("수정 불가", "관리자만 수정할 수 있습니다.");
                return;
            }

            // 수정 다이얼로그 표시
            ipcRenderer.send("fetch-single-golf", golfId);
        }
    });

    // 단일 회원 데이터 수신 및 수정 다이얼로그 열기
    ipcRenderer.on("single-golf-response", (event, member) => {
        const editDialog = document.getElementById("editDialog");
        document.getElementById("editName").value = member.name;
        document.getElementById("editGender").value = member.male;
        document.getElementById("editBirthDate").value = member.b_day;
        document.getElementById("editPhone").value = member.p_num;
        document.getElementById("editStartDate").value = member.s_day;
        document.getElementById("editDuration").value = member.r_day;
        document.getElementById("editPrice").value = member.price;

        const proDropdown = document.getElementById("editProInfo");
        loadProOptions(proDropdown, member.pro_id);

        editDialog.dataset.id = member.golf_id;
        editDialog.classList.add("active");
    });

    // 수정 저장 버튼 클릭 이벤트
    document.getElementById("editConfirm").addEventListener("click", () => {
        const editDialog = document.getElementById("editDialog");
        const updatedMember = {
            id: editDialog.dataset.id,
            name: document.getElementById("editName").value,
            male: document.getElementById("editGender").value,
            b_day: document.getElementById("editBirthDate").value,
            p_num: document.getElementById("editPhone").value,
            s_day: document.getElementById("editStartDate").value,
            r_day: parseInt(document.getElementById("editDuration").value, 10),
            pro_id: document.getElementById("editProInfo").value,
            price: parseInt(document.getElementById("editPrice").value, 10),
        };

        ipcRenderer.send("edit-golf-member", updatedMember);
        editDialog.classList.remove("active");
    });

    // 수정 성공 응답 처리
    ipcRenderer.on("golf-update-success", (event, golfId) => {
        console.log(`Successfully updated member with ID: ${golfId}`);
        loadGolfData(); // 최신 데이터 로드
    });

    // 수정 취소 버튼 클릭 이벤트
    document.getElementById("editCancel").addEventListener("click", () => {
        document.getElementById("editDialog").classList.remove("active");
    });

    // 삭제 버튼 클릭 이벤트
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const golfId = e.target.dataset.id;

            // 권한 확인
            if (loggedInUserRole !== "ADMIN") {
                showNotification("삭제 불가", "관리자만 삭제할 수 있습니다.");
                return;
            }

            // 삭제 확인 다이얼로그 표시
            const deleteDialog = document.getElementById("deleteDialog");
            deleteDialog.dataset.id = golfId;
            deleteDialog.classList.add("active");
        }
    });

    // 삭제 확인 버튼 클릭 이벤트
    document.getElementById("deleteConfirm").addEventListener("click", () => {
        const deleteDialog = document.getElementById("deleteDialog");
        const golfId = deleteDialog.dataset.id;

        ipcRenderer.send("delete-golf-member", golfId);
        deleteDialog.classList.remove("active");
    });

    // 삭제 취소 버튼 클릭 이벤트
    document.getElementById("deleteCancel").addEventListener("click", () => {
        document.getElementById("deleteDialog").classList.remove("active");
    });

    // 삭제 성공 응답 처리
    ipcRenderer.on("golf-delete-success", (event, golfId) => {
        console.log(`Successfully deleted GOLF member with ID: ${golfId}`);
        loadGolfData(); // GOLF 데이터만 새로 로드
    });    

    // 삭제 실패 응답 처리
    ipcRenderer.on("golf-delete-error", (event, error) => {
        console.error("Error deleting member:", error);
        showDialog("회원 삭제 중 오류가 발생했습니다.");
    });

    function showNotification(title, message) {
        const notificationDialog = document.createElement("div");
        notificationDialog.classList.add("dialog-container", "active");
        notificationDialog.innerHTML = `
            <div class="dialog-title">${title}</div>
            <p>${message}</p>
            <div class="dialog-buttons">
                <button class="confirm" onclick="this.parentElement.parentElement.classList.remove('active')">확인</button>
            </div>
        `;
        document.body.appendChild(notificationDialog);
    }    

    // 초기 데이터 로드
    loadGolfData();
});
