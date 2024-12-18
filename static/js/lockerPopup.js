const btn = document.getElementById('box-wrapper');
const modal = document.getElementById('modalWrap');
const closeBtn = document.getElementById('closeBtn');

btn.onclick = function (event) {
  if (event.target.tagName === 'BUTTON') {
      const lockerNumber = event.target.textContent; // 클릭한 버튼의 텍스트를 라커번호로 사용
      document.getElementById('locker_number').value = lockerNumber;
      modal.style.display = "block";
  }
}

closeBtn.onclick = function () {
  modal.style.display = 'none';
}

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none"; //외부 클릭 시 숨김
  }
}