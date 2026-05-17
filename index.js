const categorySelect = document.getElementById('categorySelect');
const dynamicForm = document.getElementById('dynamicForm');
const saveBtn = document.getElementById('saveBtn');
const saveStatus = document.getElementById('saveStatus');
const toast = document.getElementById('toast');

let selectedItemType = 'thread';

const itemTypes = [
  { key: 'thread', label: 'Thread' },
  { key: 'cdSequence', label: 'CD Sequence' },
  { key: 'roleFussing', label: 'Role Fussing' },
  { key: 'bobbin', label: 'Bobbin' },
  { key: 'cone', label: 'Cone' },
  { key: 'colySequence', label: 'Coly Sequence' },
  { key: 'otherItem', label: 'Other Item' },
];

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.background = isError ? '#fb7185' : '#34d399';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function buildItemTypeSelector() {
  let html = '<div class="item-type-selector">';
  itemTypes.forEach(type => {
    html += `<button type="button" class="item-type-btn ${selectedItemType === type.key ? 'active' : ''}" data-type="${type.key}">${type.label}</button>`;
  });
  html += '</div>';
  return html;
}

function buildItemsForm() {
  let html = buildItemTypeSelector();
  html += `
    <div class="form-group">
      <label>In / Out</label>
      <div class="toggle-container">
        <label class="toggle-option"><input type="radio" name="inOut" value="in" checked> In</label>
        <label class="toggle-option"><input type="radio" name="inOut" value="out"> Out</label>
      </div>
    </div>
    <div class="form-group">
      <label>Number (optional)</label>
      <input type="text" id="entryNumber" placeholder="Any reference number">
    </div>
  `;

  if (selectedItemType === 'otherItem') {
    html += `
      <div class="form-group">
        <label>Item Name *</label>
        <input type="text" id="itemName" placeholder="Name of item" required>
      </div>
      <div class="form-group">
        <label>Quantity</label>
        <input type="text" id="itemQty" placeholder="Qty (letters allowed)">
      </div>
      <div class="form-group">
        <label>Size (optional)</label>
        <input type="text" id="itemSize" placeholder="Size">
      </div>
      <div class="form-group">
        <label>Grade (optional)</label>
        <input type="text" id="itemGrade" placeholder="Grade">
      </div>
      <div class="form-group">
        <label>Color (optional)</label>
        <input type="text" id="itemColor" placeholder="Color">
      </div>
      <div class="form-group">
        <label>Person Name (optional)</label>
        <input type="text" id="itemPerson" placeholder="Person Name">
      </div>`;
  } else if (selectedItemType === 'cone') {
    html += `
      <div class="form-group">
        <label>Quantity *</label>
        <input type="text" id="itemQty" placeholder="Qty (letters allowed)" required>
      </div>
      <div class="form-group">
        <label>Grade Number *</label>
        <input type="text" id="itemGrade" placeholder="Grade" required>
      </div>
      <div class="form-group">
        <label>Person Name *</label>
        <input type="text" id="itemPerson" placeholder="Person Name" required>
      </div>
      <div class="form-group">
        <label>Color</label>
        <input type="text" id="itemColor" placeholder="Color">
      </div>`;
  } else {
    // Thread, CD Sequence, Role Fussing, Bobbin, Coly Sequence
    html += `
      <div class="form-group">
        <label>Quantity *</label>
        <input type="text" id="itemQty" placeholder="Qty (letters allowed)" required>
      </div>
      <div class="form-group">
        <label>Person Name *</label>
        <input type="text" id="itemPerson" placeholder="Person Name" required>
      </div>
      <div class="form-group">
        <label>Color (optional)</label>
        <input type="text" id="itemColor" placeholder="Color">
      </div>`;
  }
  return html;
}

function buildForm(category) {
  let html = '';
  if (category === 'items') {
    html = buildItemsForm();
  } else if (category === 'complains') {
    html = `
      <div class="form-group">
        <label>In / Out</label>
        <div class="toggle-container">
          <label class="toggle-option"><input type="radio" name="inOut" value="in" checked> In</label>
          <label class="toggle-option"><input type="radio" name="inOut" value="out"> Out</label>
        </div>
      </div>
      <div class="form-group">
        <label>Number (optional)</label>
        <input type="text" id="entryNumber" placeholder="Any reference number">
      </div>
      <div class="form-group">
        <label>Person Name *</label>
        <input type="text" id="complainName" placeholder="Name of person" required>
      </div>
      <div class="form-group">
        <label>Complain *</label>
        <textarea id="complainText" placeholder="Describe the complaint" rows="4" required></textarea>
      </div>`;
  } else {
    // samples, cleaning (clipping), persons
    html = `
      <div class="form-group">
        <label>In / Out</label>
        <div class="toggle-container">
          <label class="toggle-option"><input type="radio" name="inOut" value="in" checked> In</label>
          <label class="toggle-option"><input type="radio" name="inOut" value="out"> Out</label>
        </div>
      </div>
      <div class="form-group">
        <label>Number (optional)</label>
        <input type="text" id="entryNumber" placeholder="Any reference number">
      </div>`;
    if (category === 'samples') {
      html += `
        <div class="form-group">
          <label>Sample Name</label>
          <input type="text" id="sampleName" required>
        </div>
        <div class="form-group">
          <label>Sample Color</label>
          <input type="text" id="sampleColor" required>
        </div>
        <div class="form-group">
          <label>Person Name</label>
          <input type="text" id="samplePerson" required>
        </div>`;
    } else if (category === 'cleaning') {
      html += `
        <div class="form-group">
          <label>Size in Guzz</label>
          <input type="text" id="sizeGuzz" required>
        </div>
        <div class="form-group">
          <label>Person Name</label>
          <input type="text" id="cleanPerson" required>
        </div>`;
    } else if (category === 'persons') {
      html += `
        <div class="form-group">
          <label>Absent Person Name</label>
          <input type="text" id="absentName" required>
        </div>
        <div class="form-group">
          <label>Reason (Optional)</label>
          <input type="text" id="absentReason">
        </div>`;
    }
  }
  dynamicForm.innerHTML = html;

  if (category === 'items') {
    document.querySelectorAll('.item-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        selectedItemType = e.currentTarget.dataset.type;
        buildForm('items');
      });
    });
  }
}

function collectEntry(category) {
  const entry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  if (category === 'items') {
    entry.inOut = document.querySelector('input[name="inOut"]:checked')?.value || 'in';
    entry.number = document.getElementById('entryNumber')?.value || null;
    entry.itemType = selectedItemType;
    if (selectedItemType === 'otherItem') {
      entry.itemName = document.getElementById('itemName')?.value || null;
      entry.quantity = document.getElementById('itemQty')?.value || null;
      entry.size = document.getElementById('itemSize')?.value || null;
      entry.grade = document.getElementById('itemGrade')?.value || null;
      entry.color = document.getElementById('itemColor')?.value || null;
      entry.personName = document.getElementById('itemPerson')?.value || null;
    } else {
      entry.quantity = document.getElementById('itemQty')?.value || null;
      entry.personName = document.getElementById('itemPerson')?.value || null;
      entry.color = document.getElementById('itemColor')?.value || null;
      if (selectedItemType === 'cone') {
        entry.grade = document.getElementById('itemGrade')?.value || null;
      }
    }
  } else if (category === 'complains') {
    entry.inOut = document.querySelector('input[name="inOut"]:checked')?.value || 'in';
    entry.number = document.getElementById('entryNumber')?.value || null;
    entry.name = document.getElementById('complainName')?.value || null;
    entry.complain = document.getElementById('complainText')?.value || null;
  } else {
    entry.inOut = document.querySelector('input[name="inOut"]:checked')?.value || 'in';
    entry.number = document.getElementById('entryNumber')?.value || null;
    if (category === 'samples') {
      entry.sampleName = document.getElementById('sampleName').value;
      entry.sampleColor = document.getElementById('sampleColor').value;
      entry.personName = document.getElementById('samplePerson').value;
    } else if (category === 'cleaning') {
      entry.sizeGuzz = document.getElementById('sizeGuzz').value;
      entry.personName = document.getElementById('cleanPerson').value;
    } else if (category === 'persons') {
      entry.name = document.getElementById('absentName').value;
      entry.reason = document.getElementById('absentReason').value || null;
    }
  }
  return entry;
}

saveBtn.addEventListener('click', async () => {
  const category = categorySelect.value;
  const entry = collectEntry(category);
  saveStatus.textContent = 'Saving...';
  try {
    const res = await fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, entry }),
    });
    if (res.ok) {
      showToast('✓ Entry saved successfully!');
      saveStatus.textContent = '';
      buildForm(category);
    } else {
      const err = await res.json();
      showToast('✗ ' + (err.error || 'Unknown error'), true);
      saveStatus.textContent = 'Failed to save.';
    }
  } catch (e) {
    showToast('✗ Network error', true);
    saveStatus.textContent = 'Network error.';
  }
});

categorySelect.addEventListener('change', (e) => {
  buildForm(e.target.value);
});

buildForm('items');