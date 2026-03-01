// schemes.js

let dataStore = []; // Will be populated from JSON

// DOM Elements
const keywordSearch = document.getElementById('keywordSearch');
const ageInput = document.getElementById('ageInput');
const occupationSelect = document.getElementById('occupationSelect');
const marginInput = document.getElementById('marginInput');
const marginValue = document.getElementById('marginValue');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

const schemesGrid = document.getElementById('schemesGrid');
const policiesGrid = document.getElementById('policiesGrid');
const resultsCount = document.getElementById('resultsCount');

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Fetch the external JSON data
async function loadSchemesData() {
    try {
        const response = await fetch('schemes_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        dataStore = await response.json();
        renderData(); // Initial render after data is loaded
    } catch (error) {
        console.error('Failure fetching schemes data:', error);
        resultsCount.textContent = 'Error loading schemes. Please try again later.';
    }
}

// Helper to format currency
function formatCurrency(num) {
    return new Intl.NumberFormat('en-IN').format(num);
}

// Event Listeners for tabs
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked
        btn.classList.add('active');
        const target = document.getElementById(btn.getAttribute('data-tab'));
        target.classList.add('active');
    });
});

// Update Margin Display
marginInput.addEventListener('input', (e) => {
    marginValue.textContent = formatCurrency(e.target.value);
});

// Event Listeners for filters
[keywordSearch, ageInput, occupationSelect, marginInput].forEach(el => {
    el.addEventListener('input', renderData);
    el.addEventListener('change', renderData);
});

// Reset Filters
resetFiltersBtn.addEventListener('click', () => {
    keywordSearch.value = '';
    ageInput.value = '';
    occupationSelect.value = '';
    marginInput.value = 2000000;
    marginValue.textContent = formatCurrency(2000000);
    renderData();
});

// Rendering Function
function renderData() {
    const keyword = keywordSearch.value.toLowerCase().trim();
    const age = parseInt(ageInput.value, 10);
    const occupation = occupationSelect.value;
    const margin = parseInt(marginInput.value, 10);

    const filteredSchemes = [];
    const filteredPolicies = [];

    dataStore.forEach(item => {
        // Filter logic
        let matchKeyword = true;
        let matchAge = true;
        let matchOccupation = true;
        let matchMargin = true;

        if (keyword) {
            matchKeyword = item.title.toLowerCase().includes(keyword) ||
                item.description.toLowerCase().includes(keyword) ||
                item.keywords.some(kw => kw.toLowerCase().includes(keyword));
        }

        if (!isNaN(age)) {
            matchAge = age >= item.minAge && age <= item.maxAge;
        }

        if (occupation && occupation !== '') {
            matchOccupation = item.occupations.includes('Any') || item.occupations.includes(occupation);
        }

        if (!isNaN(margin)) {
            matchMargin = margin <= item.maxMargin || margin === 2000000; // If max, show all mostly
            // Actual margin logic: If person's margin(income) > maxMargin allowed by scheme, they are not eligible.
            if (margin > item.maxMargin && margin !== 2000000) { // Assuming 20,00,000+ means no limit specified or max bucket
                matchMargin = false;
            } else if (margin === 2000000) {
                matchMargin = true;
            } else {
                matchMargin = true;
            }
        }

        if (matchKeyword && matchAge && matchOccupation && matchMargin) {
            if (item.type === 'scheme') {
                filteredSchemes.push(item);
            } else {
                filteredPolicies.push(item);
            }
        }
    });

    // Render Cards
    renderCards(schemesGrid, filteredSchemes, 'scheme');
    renderCards(policiesGrid, filteredPolicies, 'policy');

    // Update headers
    resultsCount.textContent = `${filteredSchemes.length} Recommended Schemes`;
}

function renderCards(container, items, type) {
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No ${type}s found</h3>
                <p>Try adjusting your filters to see more results.</p>
            </div>
        `;
        return;
    }

    items.forEach(item => {
        const occString = item.occupations.includes('Any') ? 'All' : item.occupations.join(', ');
        const ageString = item.minAge === 0 && item.maxAge === 120 ? 'All Ages' : `${item.minAge} - ${item.maxAge} yrs`;
        const incLimit = item.maxMargin >= 2000000 ? 'No Limit' : `Up to ₹${formatCurrency(item.maxMargin)}`;

        const card = document.createElement('div');
        card.className = 'scheme-card';

        let badge = type === 'scheme' ? 'Govt Scheme' : 'Local Policy';
        if (item.title.toLowerCase().includes('pm') || item.title.toLowerCase().includes('pradhan mantri')) {
            badge = 'Central Govt';
        }

        const applyLink = item.link && item.link !== '#' ? item.link : '#';
        const linkTarget = applyLink !== '#' ? 'target="_blank" rel="noopener noreferrer"' : '';

        card.innerHTML = `
            <div class="card-badge">${badge}</div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <div class="card-meta">
                <div class="meta-item"><strong>For:</strong> ${occString}</div>
                <div class="meta-item"><strong>Age:</strong> ${ageString}</div>
                <div class="meta-item"><strong>Max Income:</strong> ${incLimit}</div>
            </div>
            <a href="${applyLink}" ${linkTarget} class="apply-btn">${type === 'scheme' ? 'Check Details & Apply' : 'Read Full Policy'}</a>
        `;
        container.appendChild(card);
    });
}

// Initialize app
loadSchemesData();
