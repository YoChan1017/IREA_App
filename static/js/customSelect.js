// 커스텀 드롭다운 로직
document.querySelectorAll('.custom-select').forEach(function(selectBox) {
  const selected = selectBox.querySelector('.select-selected');
  const items = selectBox.querySelector('.select-items');

  // 드롭다운 열기 및 닫기
  selected.addEventListener('click', function() {
    items.style.display = items.style.display === 'block' ? 'none' : 'block';
  });

  // 옵션 선택 시 선택된 값을 업데이트하고 닫기
  items.addEventListener('click', function(e) {
    if (e.target.tagName === 'DIV') {
      selected.textContent = e.target.textContent;
      items.style.display = 'none';
    }
  });
        
  // 페이지 어디든 클릭 시 드롭다운 닫기
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-select')) {
      items.style.display = 'none';
    }
  });
});