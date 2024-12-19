const btn = document.getElementById('box-wrapper');
const modal = document.getElementById('modalWrap');
const closeBtn = document.getElementById('closeBtn');
const modalWrap = document.getElementById("modalWrap");
const modalBody = document.getElementById("modalBody");
const lockerNumberInput = document.getElementById("locker_number");
let selectedLocker = null;

// 라커 클릭 핸들러
function handleLockerClick(lockerNumber, locker) {
    if (locker) {
        // 등록된 라커의 상세 정보를 표시
        showLockerDetails(locker);
    } else {
        // 빈 라커 등록 모드를 열기
        openLockerModal(lockerNumber);
    }
}

// 라커 상세 정보 표시
function showLockerDetails(locker) {
    modalBody.innerHTML = `
        <span id="closeBtn">&times;</span>
        <div class="locker-details">
            <h2>라커 상세 정보</h2>
            <p><strong>라커 번호:</strong> ${locker.l_num}</p>
            <p><strong>회원 이름:</strong> ${locker.name || "정보 없음"}</p>
            <p><strong>등록일:</strong> ${locker.s_day}</p>
            <p><strong>기간:</strong> ${locker.r_day}개월</p>
            <p><strong>만료일:</strong> ${locker.f_day}</p>
            <p><strong>결제 방법:</strong> ${
                locker.payment === "A" ? "카드" : locker.payment === "B" ? "현금" : "기타"
            }</p>
            <p><strong>가격:</strong> ${locker.price}원</p>
            <div class="dialog-buttons">
                <button id="returnToRegister">등록으로 돌아가기</button>
            </div>
        </div>
    `;

    modalWrap.style.display = "block";

    document.getElementById("closeBtn").onclick = () => {
        modalWrap.style.display = "none";
    };

    document.getElementById("returnToRegister").onclick = () => {
        openLockerModal(selectedLocker);
    };
}

// 빈 라커 등록 모달 열기
function openLockerModal(lockerNumber) {
    selectedLocker = lockerNumber;

    modalBody.innerHTML = `
        <span id="closeBtn">&times;</span>
        <form>
            <span class="search-input">회원 검색<input type="text" /></span>
            <div class="search-result">
                <table class="styled-table">
                    <thead>
                        <tr>
                            <th>이름</th>
                            <th>성별</th>
                            <th>생년월일</th>
                            <th>전화번호</th>
                        </tr>
                    </thead>
                    <tbody id="search-results"></tbody>
                </table>
            </div>
            <div class="member-name-box">
                <span>등록 회원:</span><span id="memberName">선택된 회원 없음</span>
            </div>
            <div class="registration-box">
                <label>등록일자<input type="date" id="start_date" required></label>
                <label>등록기간
                    <select id="months" required>
                        <option value="1">1개월</option>
                        <option value="3">3개월</option>
                        <option value="6">6개월</option>
                        <option value="12">12개월</option>
                    </select>
                </label>
                <label>만료일<input type="date" id="expiry_date" readonly></label>
                <label>가격<input type="number" id="locker-price" min="0" step="1000" required></label>
                <label>결제방법
                    <select id="payment_option" required>
                        <option value="A">카드</option>
                        <option value="B">현금</option>
                        <option value="C">기타</option>
                    </select>
                </label>
            </div>
            <button type="submit" class="register-btn">등록</button>
        </form>
    `;

    modalWrap.style.display = "block";

    document.getElementById("closeBtn").onclick = () => {
        modalWrap.style.display = "none";
    };
}

// 초기화 또는 이벤트 핸들러
document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    // 등록 로직 추가
});


closeBtn.onclick = function () {
  modal.style.display = 'none';
}

window.onclick = function (event) {
  const modal = document.getElementById("modalWrap"); // 기존 모달
  const activeDialog = document.querySelector(".dialog-container.active"); // locker.js 다이얼로그

  // modalWrap을 클릭한 경우 닫기
  if (event.target === modal) {
      modal.style.display = "none";
  }

  // locker.js 다이얼로그를 클릭한 경우 닫기
  if (activeDialog && event.target === activeDialog) {
      activeDialog.classList.remove("active");
      activeDialog.remove();
  }
};
