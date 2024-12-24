const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
    const dataContainer = document.querySelector(".data-container");
    const adminButtons = document.querySelectorAll(".admin-only");
    const notificationDialog = document.createElement("div");
    notificationDialog.classList.add("dialog-container");
    notificationDialog.innerHTML = `
        <div class="dialog-title">권한 없음</div>
        <p>이 페이지에 접근할 권한이 없습니다.</p>
        <div class="dialog-buttons">
            <button id="notificationClose" class="confirm">확인</button>
        </div>
    `;
    document.body.appendChild(notificationDialog);

    const notificationClose = document.getElementById("notificationClose");

    notificationClose.addEventListener("click", () => {
        notificationDialog.classList.remove("active");
    });

    function showNotification() {
        notificationDialog.classList.add("active");
    }

    ipcRenderer.send("fetch-logged-in-user");

    ipcRenderer.on("logged-in-user-response", (event, user) => {
        if (!user) {
            window.location.href = "loginPage.html"; // 로그인 정보가 없으면 로그인 페이지로 이동
        } else {
            const isAdmin = user.role === "ADMIN";

            adminButtons.forEach((button) => {
                button.addEventListener("click", (e) => {
                    const targetPage = button.classList.contains("manager-btn")
                        ? "managerPage.html"
                        : "proPage.html";

                    if (!isAdmin) {
                        e.preventDefault(); // 기본 동작 차단
                        showNotification(); // 권한 없음 다이얼로그 표시
                    } else {
                        window.location.href = targetPage; // 권한이 있으면 페이지 이동
                    }
                });
            });
        }
    });

    // 로그인된 사용자 정보 요청
    ipcRenderer.send("fetch-logged-in-user");
    ipcRenderer.on("logged-in-user-response", (event, user) => {
        if (!user) {
            window.location.href = "loginPage.html"; // 로그인 정보 없으면 로그인 페이지로 이동
        }
    });

    ipcRenderer.on("logged-in-user-response", (event, user) => {
        if (user) {
            dataContainer.innerHTML = `
                <p>${user.name}님 환영합니다.</p>
                <hr>
                <p>등록된 회원 수: 데이터 로딩 중...</p>
                <p>등록된 라커 수: 데이터 로딩 중...</p>
                <hr>
                <p>% 업데이트 예정 %</p>
                <p>만료된 회원 수 : 데이터 로딩 중...</p>
                <p>만료된 라커 수 : 데이터 로딩 중...</p>
            `;

            // 회원 및 라커 데이터 요청
            ipcRenderer.send("fetch-home-data");

            ipcRenderer.on("home-data-response", (event, data) => {
                if (data.error) {
                    console.error("Error fetching home data:", data.error);
                    dataContainer.innerHTML = `
                        <p>${user.name}님 환영합니다.</p>
                        <hr>
                        <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
                        <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
                        <hr>
                        <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
                        <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
                    `;
                } else {
                    dataContainer.innerHTML = `
                        <p>${user.name}님 환영합니다.</p>
                        <hr>
                        <p>등록된 회원 수: ${data.memberCount} 명</p>
                        <p>등록된 라커 수: ${data.occupiedLockers} / 120</p>
                        <hr>
                        <p>만료된 회원 수 : ${data.expiredMembers} / ${data.memberCount}</p>
                        <p>만료된 라커 수 : ${data.expiredLockers} / ${data.occupiedLockers}</p>
                    `;
                }
            });
        } else {
            dataContainer.innerHTML = "<p>로그인 정보가 없습니다. 다시 로그인하세요.</p>";
        }
    });

    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", () => {
        ipcRenderer.send("logout"); // 로그아웃 요청

        ipcRenderer.once("logout-success", () => {
            window.location.href = "loginPage.html"; // 로그인 페이지로 리다이렉트
        });
    });

});
