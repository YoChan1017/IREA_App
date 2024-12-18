const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
    const tableContents = document.getElementById("table-contents");
    const managerDialog = document.getElementById("managerDialog");
    const dialogTitle = document.getElementById("dialogTitle");
    const dialogName = document.getElementById("dialogName");
    const dialogRole = document.getElementById("dialogRole");
    const dialogPassword = document.getElementById("dialogPassword");
    const dialogConfirm = document.getElementById("dialogConfirm");
    const dialogCancel = document.getElementById("dialogCancel");

    let currentAction = ""; // 'edit' or 'delete'
    let currentManagerId = null;

    // 페이지 로드 시 데이터 요청
    ipcRenderer.send("fetch-managers");

    // 서버에서 데이터 수신
    ipcRenderer.on("managers-data", (event, managers) => {
        console.log("Managers data received:", managers); // 데이터 디버깅용
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
                currentAction = "edit";
                currentManagerId = e.target.getAttribute("data-id");
                dialogTitle.textContent = "직원 정보 수정";
                managerDialog.classList.add("active");
            });
        });

        // 삭제 버튼 이벤트 연결
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                currentAction = "delete";
                currentManagerId = e.target.getAttribute("data-id");
                dialogTitle.textContent = "직원 삭제 확인";
                dialogName.style.display = "none";
                dialogRole.style.display = "none";
                dialogPassword.style.display = "none";
                managerDialog.classList.add("active");
            });
        });
    }

    // 다이얼로그 확인 버튼 이벤트
    dialogConfirm.addEventListener("click", () => {
        const name = dialogName.value;
        const role = dialogRole.value;
        const password = dialogPassword.value;

        if (currentAction === "edit") {
            if (!name || !role || !password) {
                alert("모든 필드를 채워야 합니다.");
                return;
            }
            ipcRenderer.send("edit-manager", { id: currentManagerId, name, role, password });
        } else if (currentAction === "delete") {
            ipcRenderer.send("delete-manager", currentManagerId);
        }

        closeDialog();
    });

    // 다이얼로그 취소 버튼 이벤트
    dialogCancel.addEventListener("click", closeDialog);

    // 다이얼로그 닫기 함수
    function closeDialog() {
        managerDialog.classList.remove("active");
        dialogName.style.display = "block";
        dialogRole.style.display = "block";
        dialogPassword.style.display = "block";
        dialogName.value = "";
        dialogRole.value = "";
        dialogPassword.value = "";
    }

    // 데이터 변경 시 새로고침
    ipcRenderer.on("refresh-managers", () => {
        ipcRenderer.send("fetch-managers");
    });
});
