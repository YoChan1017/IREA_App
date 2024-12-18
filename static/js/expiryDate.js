const startDateInput = document.getElementById('start_date'); 
const monthsInput = document.getElementById('months');
const expiryDateInput = document.getElementById('expiry_date');
function calExpiryDate() {
  const startDateValue = startDateInput.value;
  const monthsValue = parseInt(monthsInput.value, 10);

  if (startDateValue && monthsValue > 0) {
    const startDate = new Date(startDateValue);
    startDate.setMonth(startDate.getMonth() + monthsValue);

    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0') //월 0부터 시작해서 +1
    const day = String(startDate.getDate()).padStart(2, '0');

    expiryDateInput.value = `${year}-${month}-${day}`;
  }
}

startDateInput.addEventListener('input', calExpiryDate);
monthsInput.addEventListener('input', calExpiryDate);