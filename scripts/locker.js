const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
    const boxWrapper = document.getElementById("box-wrapper");
    const modalWrap = document.getElementById("modalWrap");
    const searchInput = document.querySelector(".search-input input");
    const searchResults = document.querySelector("#search-results");
    const memberNameBox = document.querySelector(".member-name");
    const lockerNumberInput = document.getElementById("locker_number");
    const dialogContainer = document.createElement("div");
    dialogContainer.classList.add("dialog-container");

    let selectedLocker = null;
    let selectedMember = null;

    // 라커 데이터 로드
    function loadLockerData() {
        ipcRenderer.send("fetch-locker-data");
    }

    ipcRenderer.on("fetch-locker-response", (event, lockers) => {
        const buttons = boxWrapper.querySelectorAll("button");
    
        // 등록된 라커 수를 계산
        const registeredLockers = lockers.length;
    
        // 라커 수 표시 업데이트
        const lockerInfoSpan = document.querySelector(".locker-info-container span");
        lockerInfoSpan.innerHTML = `라커<div></div>${registeredLockers}/120`;
    
        // 모든 버튼 초기화
        buttons.forEach((btn) => {
            btn.classList.remove("occupied", "empty");
            btn.classList.add("empty");
            btn.style.backgroundColor = "#00382e"; // 빈 라커 색상 (#00382e)
            btn.onclick = () => handleLockerClick(parseInt(btn.textContent.trim().replace("라커 ", "")), null);
        });
    
        // 데이터가 있는 라커만 업데이트
        lockers.forEach((locker) => {
            const lockerButton = Array.from(buttons).find(
                (btn) => parseInt(btn.textContent.trim().replace("라커 ", "")) === locker.l_num
            );
    
            if (lockerButton) {
                lockerButton.classList.remove("empty");
                lockerButton.classList.add("occupied");
                lockerButton.style.backgroundColor = "#ffffff36"; // 데이터가 있는 라커 색상 (#ffffff36)
                lockerButton.onclick = () => handleLockerClick(locker.l_num, locker);
            }
        });
    });    

    // 라커 클릭 핸들러
    function handleLockerClick(lockerNumber, locker) {
        if (locker) {
            showLockerDetails(locker); // 상세 정보
        } else {
            openLockerModal(lockerNumber); // 빈 라커 등록 폼
        }
    }

    // 라커 상세 정보 표시
    function showLockerDetails(locker) {
        dialogContainer.innerHTML = `
            <div class="dialog-title">▶ 라커 상세 정보 ◀</div>
            <p><strong>라커 번호:</strong> ${locker.l_num}번</p>
            <p><strong>회원 이름:</strong> ${locker.name || "정보 없음"}</p>
            <p><strong>등록일:</strong> ${locker.s_day}</p>
            <p><strong>기간:</strong> ${locker.r_day}개월</p>
            <p><strong>만료일:</strong> ${locker.f_day}</p>
            <p><strong>결제 방법:</strong> ${locker.payment === 'A' ? ' 카드' : 'B' ? '현금' : '기타'}</p>
            <p><strong>가격:</strong> ${locker.price}원</p>
            <div class="dialog-buttons">
                <button class="confirm">확인</button>
                <button class="extend">연장</button>
                <button class="delete">해제</button>
            </div>
        `;
        document.body.appendChild(dialogContainer);
        dialogContainer.classList.add("active");

        // 확인 버튼
        document.querySelector(".confirm").addEventListener("click", () => {
            dialogContainer.classList.remove("active");
            dialogContainer.remove();
        });

        // 연장 버튼
        document.querySelector(".dialog-buttons .extend").addEventListener("click", () => {
            showExtendDialog(locker); // 연장 다이얼로그 호출
        });

        // 삭제 버튼
        document.querySelector(".dialog-buttons .delete").addEventListener("click", () => {
            showDeleteConfirmation(locker.l_num); // 삭제 확인 다이얼로그 호출
        });
    }
    
    // 연장 다이얼로그 생성 함수
    function showExtendDialog(locker) {
        dialogContainer.innerHTML = `
            <div class="dialog-title">▶ 라커 연장 ◀</div>
            <p><strong>연장 기간</strong>
                <select id="extend-months" required>
                    <option value="1">1개월</option>
                    <option value="2">2개월</option>
                    <option value="3">3개월</option>
                    <option value="4">4개월</option>
                    <option value="5">5개월</option>
                    <option value="6">6개월</option>
                    <option value="7">7개월</option>
                    <option value="8">8개월</option>
                    <option value="9">9개월</option>
                    <option value="10">10개월</option>
                    <option value="11">11개월</option>
                    <option value="12">12개월</option>
                </select>
            </p>
            <p><strong>추가 금액</strong>
                <input class="dialog-input" type="number" id="extend-price" min="0" step="1000" required/>
            </p>
            <div class="dialog-buttons">
                <button class="confirm">확인</button>
                <button class="cancel">취소</button>
            </div>
        `;
        document.body.appendChild(dialogContainer);
        dialogContainer.classList.add("active");

        // 확인 버튼 클릭
        document.querySelector(".dialog-buttons .confirm").addEventListener("click", () => {
            const extendMonths = parseInt(document.getElementById("extend-months").value);
            const extendPrice = parseInt(document.getElementById("extend-price").value);

            if (!extendMonths || !extendPrice) {
                showDialog("추가 기간과 가격을 입력하세요.", false);
                return;
            }

            ipcRenderer.send("extend-locker", {
                locker_id: locker.l_num,
                additionalMonths: extendMonths,
                additionalPrice: extendPrice,
            });

            dialogContainer.classList.remove("active");
            dialogContainer.remove();
        });

        // 취소 버튼 클릭
        document.querySelector(".dialog-buttons .cancel").addEventListener("click", () => {
            dialogContainer.classList.remove("active");
            dialogContainer.remove();
        });
    }

    ipcRenderer.on("extend-locker-success", () => {
        showDialog("라커 연장이 성공적으로 완료되었습니다.", true);
        loadLockerData(); // 갱신된 데이터를 다시 로드
    });
    
    ipcRenderer.on("extend-locker-fail", () => {
        showDialog("라커 연장에 실패했습니다. 다시 시도해주세요.", false);
    });
    
    function showDeleteConfirmation(lockerNumber) {
        dialogContainer.innerHTML = `
            <div class="dialog-title">! 삭제 확인 !</div>
            <p>정말 이 라커를 해제하시겠습니까?</p>
            <div class="dialog-buttons">
                <button class="confirm">확인</button>
                <button class="cancel">취소</button>
            </div>
        `;
        document.body.appendChild(dialogContainer);
        dialogContainer.classList.add("active");
    
        // 확인 버튼 클릭
        document.querySelector(".dialog-buttons .confirm").addEventListener("click", () => {
            ipcRenderer.send("delete-locker", lockerNumber); // 서버에 삭제 요청
            dialogContainer.classList.remove("active");
            dialogContainer.remove();
        });
    
        // 취소 버튼 클릭
        document.querySelector(".dialog-buttons .cancel").addEventListener("click", () => {
            dialogContainer.classList.remove("active");
            dialogContainer.remove();
        });
    }

    ipcRenderer.on("delete-locker-success", (event, lockerNumber) => {
        showDialog(`라커 ${lockerNumber}이(가) 성공적으로 해제되었습니다.`, true);
        loadLockerData(); // 데이터 갱신
    });
    
    ipcRenderer.on("delete-locker-fail", () => {
        showDialog("라커 삭제에 실패했습니다. 다시 시도해주세요.", false);
    });
    

    // 빈 라커 등록 모달 열기
    function openLockerModal(lockerNumber) {
        selectedLocker = lockerNumber;
        lockerNumberInput.value = lockerNumber;
        resetForm();
        loadAllMembers();
        modalWrap.style.display = "block";
    }

    // 입력 폼 초기화
    function resetForm() {
        searchInput.value = "";
        searchResults.innerHTML = "";
        memberNameBox.textContent = "선택된 회원 없음";
        selectedMember = null;

        Array.from(document.querySelectorAll("form input, form select")).forEach((input) => {
            if (input.id !== "locker_number") input.value = "";
        });
    }

    // 전체 회원 불러오기
    function loadAllMembers() {
        ipcRenderer.send("search-golf-members", "");
    }

    // 회원 검색
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();
        ipcRenderer.send("search-golf-members", query);
    });

    ipcRenderer.on("search-golf-members-response", (event, members) => {
        searchResults.innerHTML = "";
    
        if (members.length === 0) {
            searchResults.innerHTML = `<tr><td colspan="4">검색 결과가 없습니다.</td></tr>`;
            return;
        }
    
        members.forEach((member) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${member.name}</td>
                <td>${member.male === "M" ? "남자" : "여자"}</td>
                <td>${member.b_day}</td>
                <td>${member.p_num}</td>
            `;
            row.style.cursor = "pointer";
    
            row.addEventListener("click", () => {
                // 회원이 이미 라커에 등록되어 있는지 확인
                ipcRenderer.send("check-locker-availability", member.golf_id);
    
                ipcRenderer.once("locker-availability-response", (event, isAvailable) => {
                    if (!isAvailable) {
                        // 회원이 이미 등록된 경우
                        showDialog(`${member.name}님은 이미 라커에 등록되어 있습니다.`, false);
                    } else {
                        // 회원 선택 가능
                        selectedMember = member;
                        memberNameBox.textContent = member.name; // 선택된 회원 표시
                    }
                });
            });
    
            searchResults.appendChild(row);
        });
    });
    
    // 다이얼로그 표시 함수
    function showDialog(message, isSuccess) {
        dialogContainer.innerHTML = `
            <div class="dialog-title">${isSuccess ? "성공" : "알림"}</div>
            <p>${message}</p>
            <div class="dialog-buttons">
                <button class="confirm">확인</button>
            </div>
        `;
    
        document.body.appendChild(dialogContainer);
        dialogContainer.classList.add("active");
    
        document.querySelector(".confirm").addEventListener("click", () => {
            dialogContainer.classList.remove("active");
            dialogContainer.remove();
        });
    }
    

    // 등록 폼 제출 이벤트
    document.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();

        if (!selectedMember) {
            showDialog("회원 정보를 선택하세요.");
            return;
        }

        const lockerData = {
            locker_number: selectedLocker,
            golf_id: selectedMember.golf_id,
            start_date: document.getElementById("start_date").value,
            months: document.getElementById("months").value,
            expiry_date: calculateExpiryDate(document.getElementById("start_date").value, document.getElementById("months").value),
            price: document.getElementById("locker-price").value,
            payment: document.getElementById("payment_option").value,
        };

        ipcRenderer.send("register-locker", lockerData);
    });

    ipcRenderer.on("register-locker-success", () => {
        showDialog("라커 등록이 성공적으로 완료되었습니다.", true);
        modalWrap.style.display = "none";
        loadLockerData(); // 라커 데이터 다시 로드
    });
    
    ipcRenderer.on("register-locker-fail", () => {
        showDialog("라커 등록에 실패했습니다. 다시 시도해주세요.", false);
    });
    
    // 다이얼로그 표시 함수
    function showDialog(message, isSuccess) {
        dialogContainer.innerHTML = `
            <div class="dialog-title">${isSuccess ? "성공" : "실패"}</div>
            <p>${message}</p>
            <div class="dialog-buttons">
                <button class="confirm">확인</button>
            </div>
        `;
    
        document.body.appendChild(dialogContainer);
        dialogContainer.classList.add("active");
    
        document.querySelector(".confirm").addEventListener("click", () => {
            dialogContainer.classList.remove("active");
            dialogContainer.remove();
        });
    }    

    // 만료일 계산 함수
    function calculateExpiryDate(startDate, months) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + parseInt(months));
        return date.toISOString().split("T")[0];
    }

    // 초기 데이터 로드
    loadLockerData();
});
