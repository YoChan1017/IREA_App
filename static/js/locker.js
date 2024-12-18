let globalIdCounter = 1;

function createLockerRow() {
  const innerDiv = document.createElement('div');

  for (let i = 0; i < 15; i++) {
    const button = document.createElement('button');
    button.classList.add('popupBtn');
    //button마다 id 부여

    button.id = globalIdCounter;
    button.textContent = `${globalIdCounter}`
    globalIdCounter++;

    innerDiv.appendChild(button);
  }

  return innerDiv;
}


function createLockerBox() {
  const outerDiv = document.createElement('div');

  outerDiv.appendChild(createLockerRow());
  outerDiv.appendChild(createLockerRow());
  outerDiv.classList.add('locker-box')

  return outerDiv;
}

function createAllLocker() {
  const outerDiv = document.createElement('div');

  outerDiv.appendChild(createLockerBox());
  outerDiv.appendChild(createLockerBox());
  outerDiv.appendChild(createLockerBox());
  outerDiv.appendChild(createLockerBox());

  return outerDiv;
}

const lockerComtainer = document.getElementById('box-wrapper');
const lockersDiv = createAllLocker();
lockerComtainer.appendChild(lockersDiv);