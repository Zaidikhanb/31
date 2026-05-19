// view.js - updated for lazy‑loading each category with “See Data” button

const periodFilter = document.getElementById('periodFilter');
const customDateInput = document.getElementById('customDate');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const sectionsContainer = document.getElementById('sectionsContainer');
const toast = document.getElementById('toast');

// Category metadata: key (API), display label, and icon (optional)
const categoriesMeta = [
  { key: 'items', label: 'Items Details' },
  { key: 'samples', label: 'Sample Details' },
  { key: 'cleaning', label: 'Clipping Details' },
  { key: 'persons', label: 'Person Details (Absent)' },
  { key: 'complains', label: 'Complains' }
];

// Helper: show toast message
function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.background = isError ? '#fb7185' : '#34d399';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Get date range based on current filter
function getDateRange(period) {
  if (period === 'custom') {
    const dateVal = customDateInput.value;
    if (dateVal) {
      const start = new Date(dateVal + 'T00:00:00.000Z');
      const end = new Date(dateVal + 'T23:59:59.999Z');
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    return { startDate: null, endDate: null };
  }

  const now = new Date();
  let start = new Date();
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  if (period === 'daily') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'weekly') {
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
  } else if (period === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'yearly') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    return { startDate: null, endDate: null };
  }
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

// Fetch a single category from the API
async function fetchCategory(category) {
  const period = periodFilter.value;
  const { startDate, endDate } = getDateRange(period);
  try {
    const res = await fetch('/api/get-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, startDate, endDate }),
    });
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

// Render a skeleton for all categories (only headers + "See Data" button)
function renderSkeleton() {
  let html = '';
  for (const cat of categoriesMeta) {
    html += `
      <div class="glass-card category-section" style="margin-bottom: 28px;" data-category="${cat.key}">
        <h2 style="margin-bottom: 16px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#gradIcon)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          ${cat.label}
        </h2>
        <div class="category-content" id="content-${cat.key}">
          <div class="placeholder-load">
            <button class="btn see-data-btn" data-category="${cat.key}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              See Data
            </button>
          </div>
        </div>
      </div>
    `;
  }
  sectionsContainer.innerHTML = html;

  // Attach click handlers to all "See Data" buttons
  document.querySelectorAll('.see-data-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const catKey = btn.dataset.category;
      loadCategory(catKey);
    });
  });
}

// Load a specific category and replace its placeholder with data table
async function loadCategory(category) {
  const contentDiv = document.getElementById(`content-${category}`);
  if (!contentDiv) return;

  // Show loading indicator
  contentDiv.innerHTML = '<div class="loading-indicator" style="padding: 20px; text-align: center;">Loading data...</div>';

  try {
    const data = await fetchCategory(category);
    const tableHtml = renderCategoryTable(category, data);
    contentDiv.innerHTML = tableHtml;

    // Re-attach delete handlers for the new dynamically added buttons
    contentDiv.querySelectorAll('.delete-entry-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.id;
        if (confirm('Delete this entry?')) {
          await deleteEntry(category, id);
          // After deletion, reload this same category
          loadCategory(category);
        }
      });
    });
  } catch (err) {
    contentDiv.innerHTML = `<p style="color: var(--danger);">Error loading data. Please try again.</p>`;
  }
}

// Generate HTML table for a given category and its entries
function renderCategoryTable(category, entries) {
  if (!entries.length) {
    return '<p style="color: var(--text-secondary);">No data found for the selected period.</p>';
  }

  let tableHtml = '<div class="table-wrapper"><table class="data-table"><thead><tr>';

  // Define columns per category
  if (category === 'items') {
    tableHtml += '<th>Date/Time</th><th>In/Out</th><th>Number</th><th>Type</th><th>Qty</th><th>Person</th><th>Color</th><th>Grade</th><th>Size</th><th></th></tr></thead><tbody>';
    const itemTypeLabels = {
      thread: 'Thread', cdSequence: 'CD Sequence', roleFussing: 'Role Fussing',
      bobbin: 'Bobbin', cone: 'Cone', colySequence: 'Coly Sequence', otherItem: 'Other Item'
    };
    entries.forEach(entry => {
      const inOutClass = entry.inOut === 'in' ? 'in-out-green' : 'in-out-red';
      tableHtml += `<tr>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td class="${inOutClass}">${entry.inOut || '-'}</td>
        <td>${entry.number || '-'}</td>
        <td>${itemTypeLabels[entry.itemType] || entry.itemType || '-'}</td>
        <td>${entry.quantity || entry.itemName || '-'}</td>
        <td>${entry.personName || '-'}</td>
        <td>${entry.color || '-'}</td>
        <td>${entry.grade || '-'}</td>
        <td>${entry.size || '-'}</td>
        <td><button class="action-btn delete-entry-btn" data-id="${entry.id}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button></td>
      </tr>`;
    });
  } else if (category === 'samples') {
    tableHtml += '<th>Date/Time</th><th>In/Out</th><th>Number</th><th>Sample Name</th><th>Color</th><th>Person</th><th></th></tr></thead><tbody>';
    entries.forEach(entry => {
      const inOutClass = entry.inOut === 'in' ? 'in-out-green' : 'in-out-red';
      tableHtml += `<tr>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td class="${inOutClass}">${entry.inOut || '-'}</td>
        <td>${entry.number || '-'}</td>
        <td>${entry.sampleName || '-'}</td>
        <td>${entry.sampleColor || '-'}</td>
        <td>${entry.personName || '-'}</td>
        <td><button class="action-btn delete-entry-btn" data-id="${entry.id}"><svg ...></svg></button></td>
      </tr>`;
    });
  } else if (category === 'cleaning') {
    tableHtml += '<th>Date/Time</th><th>In/Out</th><th>Number</th><th>Size (Guzz)</th><th>Person</th><th></th></tr></thead><tbody>';
    entries.forEach(entry => {
      const inOutClass = entry.inOut === 'in' ? 'in-out-green' : 'in-out-red';
      tableHtml += `<tr>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td class="${inOutClass}">${entry.inOut || '-'}</td>
        <td>${entry.number || '-'}</td>
        <td>${entry.sizeGuzz || '-'}</td>
        <td>${entry.personName || '-'}</td>
        <td><button class="action-btn delete-entry-btn" data-id="${entry.id}"><svg ...></svg></button></td>
      </tr>`;
    });
  } else if (category === 'persons') {
    tableHtml += '<th>Date/Time</th><th>In/Out</th><th>Number</th><th>Name</th><th>Reason</th><th></th></tr></thead><tbody>';
    entries.forEach(entry => {
      const inOutClass = entry.inOut === 'in' ? 'in-out-green' : 'in-out-red';
      tableHtml += `<tr>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td class="${inOutClass}">${entry.inOut || '-'}</td>
        <td>${entry.number || '-'}</td>
        <td>${entry.name || '-'}</td>
        <td>${entry.reason || '-'}</td>
        <td><button class="action-btn delete-entry-btn" data-id="${entry.id}"><svg ...></svg></button></td>
      </tr>`;
    });
  } else if (category === 'complains') {
    tableHtml += '<th>Date/Time</th><th>In/Out</th><th>Number</th><th>Name</th><th>Complain</th><th></th></tr></thead><tbody>';
    entries.forEach(entry => {
      const inOutClass = entry.inOut === 'in' ? 'in-out-green' : 'in-out-red';
      tableHtml += `<tr>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td class="${inOutClass}">${entry.inOut || '-'}</td>
        <td>${entry.number || '-'}</td>
        <td>${entry.name || '-'}</td>
        <td>${entry.complain || '-'}</td>
        <td><button class="action-btn delete-entry-btn" data-id="${entry.id}"><svg ...></svg></button></td>
      </tr>`;
    });
  }

  tableHtml += '</tbody></table></div>';
  // replace generic SVG with actual SVG (kept short for brevity; full SVG works in production)
  tableHtml = tableHtml.replace(/<svg ...>/g, '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>');
  return tableHtml;
}

// Delete entry API call, then refresh the specific category view
async function deleteEntry(category, id) {
  try {
    const res = await fetch('/api/delete-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, id }),
    });
    if (res.ok) {
      showToast('✓ Entry deleted');
      // Reload the category after deletion
      await loadCategory(category);
    } else {
      showToast('✗ Delete failed', true);
    }
  } catch (e) {
    showToast('✗ Network error', true);
  }
}

// Download all data (respects current filter)
async function downloadAllData() {
  showToast('Preparing download...');
  try {
    const allResults = {};
    for (const cat of categoriesMeta) {
      allResults[cat.key] = await fetchCategory(cat.key);
    }
    if (Object.values(allResults).every(arr => arr.length === 0)) {
      showToast('No data to download', true);
      return;
    }
    const blob = new Blob([JSON.stringify(allResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_data_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Download complete');
  } catch (err) {
    showToast('Error preparing download', true);
  }
}

// Reset the whole UI (clears any loaded data) – used when filter changes
function resetAndRenderSkeleton() {
  renderSkeleton();
}

// Event listeners for filter controls
periodFilter.addEventListener('change', () => {
  if (periodFilter.value === 'custom') {
    customDateInput.style.display = 'inline-block';
  } else {
    customDateInput.style.display = 'none';
  }
  resetAndRenderSkeleton(); // clear all loaded data, user must click "See Data" again
});

customDateInput.addEventListener('change', () => {
  if (customDateInput.value) {
    resetAndRenderSkeleton();
  }
});

downloadAllBtn.addEventListener('click', downloadAllData);

// Initial page load: show skeleton (no data loaded)
document.addEventListener('DOMContentLoaded', () => {
  renderSkeleton();
});