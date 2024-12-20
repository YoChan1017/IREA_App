const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
    const tableContents = document.getElementById("table-contents");
    const addButton = document.querySelector(".btn-container button");
    const managerDialog = document.getElementById("managerDialog");
    const dialogTitle = document.getElementById("dialogTitle");
    const dialogName = document.getElementById("dialogName");
    const dialogId = document.getElementById("dialogId");
    const dialogRole = document.getElementById("dialogRole");
    const dialogPassword = document.getElementById("dialogPassword");
    const dialogConfirm = document.getElementById("dialogConfirm");
    const dialogCancel = document.getElementById("dialogCancel");

    const notificationDialog = document.createElement("div");
    notificationDialog.classList.add("dialog-container");
    notificationDialog.innerHTML = `
        <div class="dialog-title" id="notificationTitle"></div>
        <p id="notificationMessage"></p>
        <div class="dialog-buttons">
            <button id="notificationClose" class="confirm">확인</button>
            <button id="notificationCancel" class="cancel">취소</button>
        </div>
    `;
    document.body.appendChild(notificationDialog);

    const notificationTitle = document.getElementById("notificationTitle");
    const notificationMessage = document.getElementById("notificationMessage");
    const notificationClose = document.getElementById("notificationClose");

    notificationClose.addEventListener("click", () => {
        notificationDialog.classList.remove("active");
    });

    function showNotification(title, message) {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        notificationDialog.classList.add("active");
    }

    let currentAction = ""; // 'add', 'edit', or 'delete'
    let currentManagerId = null;

    // 페이지 로드 시 데이터 요청
    ipcRenderer.send("fetch-managers");

    // 서버에서 데이터 수신
    ipcRenderer.on("managers-data", (event, managers) => {
        renderManagers(managers);
    });

    // 데이터 렌더링 함수
    function renderManagers(managers) {
        tableContents.innerHTML = "";

        if (managers.length === 0) {
            tableContents.innerHTML = "<div>No managers found.</div>";
            return;
        }

        managers.forEach(manager => {
            const row = document.createElement("div");
            row.classList.add("table-contents");
            row.innerHTML = `
                <div class="small">${manager.name}</div>
                <div class="small">${manager.irea_id}</div>
                <div class="big">${manager.irea_pw}</div>
                <div class="small">${manager.role}</div>
                <div class="button-cont">
                    <button class="edit-btn" data-id="${manager.user_id}">수정</button>
                    <button class="delete-btn" data-id="${manager.user_id}">삭제</button>
                </div>
            `;
            tableContents.appendChild(row);
        });

        // 수정 버튼 이벤트 연결
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const userId = e.target.getAttribute("data-id");
                currentAction = "edit";
                currentManagerId = userId;
                const manager = managers.find(m => m.user_id == userId);
        
                dialogTitle.textContent = "▶ 직원 정보 수정 ◀";
                managerDialog.classList.add("active");
        
                dialogName.value = manager.name;
                dialogPassword.value = "";
        
                if (userId === "1") {
                    dialogId.style.display = "none"; // ID 수정 비활성화
                    dialogRole.style.display = "none"; // 역할 수정 비활성화
                } else {
                    dialogId.style.display = "block";
                    dialogRole.style.display = "block";
                }
            });
        });
        

        // 삭제 버튼 이벤트 연결
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const userId = e.target.getAttribute("data-id");
                if (userId === "1") {
                    showNotification("삭제 불가", "관리자 데이터는 삭제할 수 없습니다.");
                    return;
                }
        
                currentAction = "delete";
                currentManagerId = userId;
                showNotification("삭제 확인", "정말 삭제하시겠습니까?");
        
                // "확인" 버튼 클릭 시 삭제 실행
                notificationClose.addEventListener("click", () => {
                    if (currentAction === "delete") {
                        ipcRenderer.send("delete-manager", currentManagerId);
                        currentAction = ""; // 이벤트 중복 방지
                    }
                    notificationDialog.classList.remove("active");
                }, { once: true });
        
                // "취소" 버튼 클릭 시 다이얼로그 닫기
                notificationCancel.addEventListener("click", () => {
                    currentAction = ""; // 삭제 취소
                    notificationDialog.classList.remove("active");
                }, { once: true });
            });
        });        
    }

    // "직원 추가" 버튼 클릭 시 다이얼로그 열기
    addButton.addEventListener("click", () => {
        currentAction = "add";
        dialogTitle.textContent = "▶ 직원 추가 ◀";
        dialogName.value = "";
        dialogId.value = "";
        dialogId.style.display = "block";
        dialogPassword.value = "";
        dialogRole.value = "USER"; // 권한 고정
        dialogRole.style.display = "block";
        managerDialog.classList.add("active");
    });

    // "확인" 버튼 클릭 시 동작
    dialogConfirm.addEventListener("click", () => {
        const name = dialogName.value.trim();
        const password = dialogPassword.value.trim();

        if (!name || (!password && currentAction === "edit")) {
            showNotification("오류", "모든 필드를 입력하세요.");
            return;
        }

        if (currentAction === "add") {
            const ireaId = dialogId.value.trim();
            if (!ireaId) {
                showNotification("오류", "아이디를 입력하세요.");
                return;
            }
            ipcRenderer.send("add-manager", { name, ireaId, password, role: "USER" });
        } else if (currentAction === "edit") {
            ipcRenderer.send("edit-manager", { id: currentManagerId, name, password });
        }

        managerDialog.classList.remove("active");
    });

    // "취소" 버튼 클릭 시 다이얼로그 닫기
    dialogCancel.addEventListener("click", () => {
        managerDialog.classList.remove("active");
    });

    // 데이터 변경 시 새로고침
    ipcRenderer.on("refresh-managers", () => {
        ipcRenderer.send("fetch-managers");
    });

    // 추가 성공/실패 알림
    ipcRenderer.on("add-manager-success", () => {
        showNotification("성공", "직원이 성공적으로 추가되었습니다.");
        ipcRenderer.send("fetch-managers"); // 직원 목록 갱신
    });

    ipcRenderer.on("add-manager-fail", (event, error) => {
        showNotification("오류", `직원 추가에 실패했습니다: ${error}`);
    });

    ipcRenderer.on("edit-manager-success", () => {
        showNotification("성공", "직원 정보가 성공적으로 수정되었습니다.");
        ipcRenderer.send("fetch-managers");
    });
    
    ipcRenderer.on("edit-manager-fail", (event, error) => {
        showNotification("오류", `직원 정보 수정에 실패했습니다: ${error}`);
    });    

    // 삭제 성공/실패 알림
    ipcRenderer.on("delete-manager-success", () => {
        showNotification("성공", "직원이 성공적으로 삭제되었습니다.");
        ipcRenderer.send("fetch-managers");
    });

    ipcRenderer.on("delete-manager-fail", (event, error) => {
        showNotification("오류", `직원 삭제에 실패했습니다: ${error}`);
    });
});
