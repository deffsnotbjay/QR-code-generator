lucide.createIcons();

// Elements
const textTab = document.getElementById('textTab');
const urlTab = document.getElementById('urlTab');
const textInput = document.getElementById('textInput');
const urlInput = document.getElementById('urlInput');
const processBtn = document.getElementById('processBtn');
const qrPlaceholder = document.getElementById('qrPlaceholder');
const qrContainer = document.getElementById('qrcode');
const styleSection = document.getElementById('styleSection');

const qrColor = document.getElementById('qrColor');
const bgColor = document.getElementById('bgColor');
const sizeRange = document.getElementById('qrSize');
const sizeValue = document.getElementById('sizeValue');
const patternRow = document.getElementById('patternRow');
const cornerRow = document.getElementById('cornerRow');
const logoInput = document.getElementById('logoInput');

const downloadBtn = document.getElementById('downloadBtn');
const saveBtn = document.getElementById('saveBtn');
const savedList = document.getElementById('savedList');
const savedHeader = document.getElementById('savedHeader');

// Modal Elements
const deleteModal = document.getElementById('deleteModal');
const deleteItemName = document.getElementById('deleteItemName');
let deleteTargetId = null;

// State
let currentType = 'text';
let qr = null;
let lastDataValue = 'Welcome';
let userLogo = null;

// Initialization
styleSection.style.opacity = '0.5';
styleSection.style.pointerEvents = 'none'; 
loadSavedQRs(); // Load saved items on start

// 1. Tab Switching
textTab.addEventListener('click', () => switchTab('text'));
urlTab.addEventListener('click', () => switchTab('url'));

function switchTab(type) {
  currentType = type;
  textTab.classList.toggle('active', type === 'text');
  urlTab.classList.toggle('active', type === 'url');
  textInput.style.display = type === 'text' ? 'block' : 'none';
  urlInput.style.display = type === 'url' ? 'block' : 'none';
  lucide.createIcons();
}

// 2. Generate QR Logic
processBtn.addEventListener('click', () => {
  const content = (currentType === 'text' ? textInput.value : urlInput.value).trim();
  if (!content) {
      alert("Please enter some text or a URL first");
      return;
  }
  
  lastDataValue = content;
  styleSection.style.opacity = '1';
  styleSection.style.pointerEvents = 'auto';
  qrPlaceholder.style.display = 'none';
  
  styleSection.classList.add('visible');
  
  if(window.innerWidth < 768) {
      styleSection.scrollIntoView({ behavior: 'smooth' });
  }
  
  createOrUpdateQR();
});

// 3. Logo Upload Logic
logoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = () => {
          userLogo = reader.result;
          createOrUpdateQR();
      };
      reader.readAsDataURL(file);
  } else {
      userLogo = null;
      createOrUpdateQR();
  }
});

// 4. Core Logic
function createOrUpdateQR() {
  const containerWidth = document.querySelector('.right-panel').offsetWidth;
  const sizeInput = parseInt(sizeRange.value, 10);
  const finalSize = Math.min(sizeInput, containerWidth - 40); 

  const activePattern = document.querySelector('#patternRow .pattern-btn.active').dataset.pattern;
  const activeCorner = document.querySelector('#cornerRow .pattern-btn.active').dataset.corner;

  const qrOptions = {
      width: finalSize,
      height: finalSize,
      data: lastDataValue,
      image: userLogo,
      dotsOptions: { 
          color: qrColor.value, 
          type: activePattern 
      },
      backgroundOptions: { 
          color: bgColor.value 
      },
      cornersSquareOptions: { 
          type: activeCorner,
          color: qrColor.value 
      },
      imageOptions: {
          crossOrigin: "anonymous",
          margin: 5,
          imageSize: 0.4
      }
  };

  if (!qr) {
      qrContainer.innerHTML = '';
      qr = new QRCodeStyling(qrOptions);
      qr.append(qrContainer);
  } else {
      qr.update(qrOptions);
  }
}

// 5. Update Listeners
[qrColor, bgColor].forEach(input => {
  input.addEventListener('input', createOrUpdateQR);
});

sizeRange.addEventListener('input', (e) => {
  sizeValue.textContent = e.target.value;
  createOrUpdateQR();
});

patternRow.addEventListener('click', (e) => handleStyleClick(e, patternRow));
cornerRow.addEventListener('click', (e) => handleStyleClick(e, cornerRow));

function handleStyleClick(e, container) {
  const btn = e.target.closest('.pattern-btn');
  if (!btn) return;
  container.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  createOrUpdateQR();
}

// 6. Download
downloadBtn.addEventListener('click', () => {
  if (qr) qr.download({ name: "my-qr-code", extension: "png" });
});

// 7. Save Logic
saveBtn.addEventListener('click', async () => {
  if (!qr) return;
  
  const blob = await qr.getRawData("png");
  const reader = new FileReader();
  reader.readAsDataURL(blob); 
  reader.onloadend = function() {
      const base64data = reader.result;
      const newItem = {
          id: Date.now(),
          img: base64data,
          text: lastDataValue,
          date: new Date().toLocaleDateString()
      };

      let savedItems = JSON.parse(localStorage.getItem('savedQRs') || "[]");
      savedItems.unshift(newItem); 
      localStorage.setItem('savedQRs', JSON.stringify(savedItems));

      renderSavedItem(newItem);
      checkEmptyState();
  }
});

function loadSavedQRs() {
  const savedItems = JSON.parse(localStorage.getItem('savedQRs') || "[]");
  savedList.innerHTML = '';
  
  // Filter out old bad data if any
  const validItems = savedItems.filter(item => item.id !== undefined);
  
  validItems.forEach(item => renderSavedItem(item, false)); 
  checkEmptyState();
}

function renderSavedItem(item, prepend = true) {
  const card = document.createElement("div");
  card.className = "saved-card";
  card.dataset.id = item.id;
  
  const displayText = item.text.length > 20 ? item.text.substring(0, 20) + '...' : item.text;
  // Escape single quotes for HTML attribute
  const safeText = item.text.replace(/'/g, "\\'");

  card.innerHTML = `
      <img src="${item.img}" alt="Saved QR">
      <span class="saved-text" title="${item.text}">${displayText}</span>
      <div class="saved-footer">
          <span class="saved-date">${item.date}</span>
          <button class="delete-btn" onclick="openDeleteModal(${item.id}, '${safeText}')">
              <i data-lucide="trash-2"></i>
          </button>
      </div>
  `;
  
  if (prepend) {
      savedList.prepend(card);
  } else {
      savedList.appendChild(card);
  }
  
  lucide.createIcons();
}

// --- MODAL FUNCTIONS ---

window.openDeleteModal = function(id, text) {
  deleteTargetId = id;
  const displayText = text.length > 18 ? text.substring(0, 18) + '...' : text;
  deleteItemName.textContent = `'${displayText}'`;
  
  deleteModal.style.display = 'flex';
  setTimeout(() => {
      deleteModal.classList.add('open');
  }, 10);
}

window.closeDeleteModal = function() {
  deleteModal.classList.remove('open');
  setTimeout(() => {
      deleteModal.style.display = 'none';
      deleteTargetId = null;
  }, 300); 
}

window.confirmDelete = function() {
  if(!deleteTargetId) return;

  let savedItems = JSON.parse(localStorage.getItem('savedQRs') || "[]");
  savedItems = savedItems.filter(item => item.id !== deleteTargetId);
  localStorage.setItem('savedQRs', JSON.stringify(savedItems));

  const card = document.querySelector(`.saved-card[data-id="${deleteTargetId}"]`);
  if(card) {
      card.remove();
  }

  closeDeleteModal();
  checkEmptyState();
}

function checkEmptyState() {
  const savedItems = JSON.parse(localStorage.getItem('savedQRs') || "[]");
  // Also filter valid items here for the count
  const validItems = savedItems.filter(item => item.id !== undefined);
  
  if (validItems.length > 0) {
      savedHeader.classList.add('hidden');
  } else {
      savedHeader.classList.remove('hidden');
  }
}

window.addEventListener('resize', () => {
  if(qr && lastDataValue) createOrUpdateQR();
});