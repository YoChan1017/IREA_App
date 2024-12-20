const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
    const tableContents = document.getElementById("table-contents");
    const proDialog = document.getElementById("proDialog");
    const deleteDialog = document.getElementById("deleteDialog");
    const dialogTitle = document.getElementById("dialogTitle");
    const dialogName = document.getElementById("dialogName");
    const dialogConfirm = document.getElementById("dialogConfirm");
    const dialogCancel = document.getElementById("dialogCancel");
    const deleteConfirm = document.getElementById("deleteConfirm");
    const deleteCancel = document.getElementById("deleteCancel");
    const addButton = document.querySelector(".btn-container button");

    let currentAction = ""; // 'add' or 'edit'
    let currentProId = null; // 수정할 프로 ID
    let proIdToDelete = null; // 삭제할 프로 ID

    function showAlert(message) {
        const alertDialog = document.createElement("div");
        alertDialog.classList.add("dialog-container", "active");
        alertDialog.innerHTML = `
            <div class="dialog-title">알림</div>
            <p>${message}</p>
            <div class="dialog-buttons">
                <button class="confirm" onclick="this.parentElement.parentElement.classList.remove('active')">확인</button>
            </div>
        `;
        document.body.appendChild(alertDialog);
    }    

    // 데이터 렌더링 함수
    function renderPros(pros) {
        tableContents.innerHTML = "";

        if (pros.length === 0) {
            tableContents.innerHTML = "<div>No pros found.</div>";
            return;
        }

        pros.forEach(pro => {
            const row = document.createElement("div");
            row.classList.add("table-contents");
            row.innerHTML = `
                <div class="big">${pro.pro_name}</div>
                <div class="button-cont">
                    <button class="edit-btn" data-id="${pro.pro_id}">수정</button>
                    <button class="delete-btn" data-id="${pro.pro_id}">삭제</button>
                </div>
            `;
            tableContents.appendChild(row);
        });

        // 수정 버튼 이벤트 연결
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const proId = e.target.getAttribute("data-id");
                if (proId === "1") {
                    showAlert("해당 데이터는 수정할 수 없습니다.");
                    return;
                }

                const proName = e.target.parentElement.previousElementSibling.textContent;
                currentAction = "edit";
                currentProId = proId;
                dialogTitle.textContent = "▶ 프로 정보 수정 ◀";
                dialogName.value = proName;
                proDialog.classList.add("active");
            });
        });

        // 삭제 버튼 이벤트 연결
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const proId = e.target.getAttribute("data-id");
                if (proId === "1") {
                    showAlert("해당 데이터는 삭제할 수 없습니다.");
                    return;
                }

                proIdToDelete = proId;
                deleteDialog.classList.add("active");
            });
        });

    }

    // 데이터 요청 및 초기 렌더링
    ipcRenderer.send("fetch-pros");
    ipcRenderer.on("pros-data", (event, pros) => {
        console.log("Pro data received:", pros); // 디버깅용 로그
        renderPros(pros);
    });

    // 새로고침 이벤트
    ipcRenderer.on("refresh-pros", () => {
        ipcRenderer.send("fetch-pros");
    });

    // 다이얼로그 확인 버튼 이벤트
    dialogConfirm.addEventListener("click", () => {
        const proName = dialogName.value.trim();

        if (!proName) {
            showAlert("프로 이름을 입력하세요.");
            return;
        }

        if (currentAction === "add") {
            ipcRenderer.send("add-pro", { pro_name: proName });
        } else if (currentAction === "edit") {
            ipcRenderer.send("edit-pro", { pro_id: currentProId, pro_name: proName });
        }

        closeProDialog();
    });

    // 다이얼로그 취소 버튼 이벤트
    dialogCancel.addEventListener("click", closeProDialog);

    // 삭제 다이얼로그 확인 버튼 이벤트
    deleteConfirm.addEventListener("click", () => {
        if (proIdToDelete) {
            ipcRenderer.send("delete-pro", proIdToDelete);
            proIdToDelete = null;
        }
        closeDeleteDialog();
    });

    // 삭제 다이얼로그 취소 버튼 이벤트
    deleteCancel.addEventListener("click", closeDeleteDialog);

    // 추가 버튼 클릭 이벤트
    addButton.addEventListener("click", () => {
        currentAction = "add";
        dialogTitle.textContent = "▶ 프로 추가 ◀";
        dialogName.value = "";
        proDialog.classList.add("active");
    });

    // 다이얼로그 닫기 함수
    function closeProDialog() {
        proDialog.classList.remove("active");
        dialogName.value = "";
        currentProId = null;
    }

    function closeDeleteDialog() {
        deleteDialog.classList.remove("active");
        proIdToDelete = null;
    }
});
