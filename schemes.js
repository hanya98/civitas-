// schemes.js

// Mock Data for Schemes and Policies
// type: 'scheme' or 'policy'
const dataStore = [
    {
        id: 1,
        title: 'PM Kisan Samman Nidhi',
        description: 'Under the scheme an income support of 6,000/- per year in three equal installments will be provided to all land holding farmer families.',
        type: 'scheme',
        minAge: 18,
        maxAge: 120,
        occupations: ['Farmer'],
        maxMargin: 1500000,
        keywords: ['farmer', 'kisan', 'agriculture', 'income support']
    },
    {
        id: 2,
        title: 'Stand-Up India Scheme',
        description: 'Facilitates bank loans between 10 lakh and 1 Crore to at least one SC/ST borrower and at least one woman borrower per bank branch for setting up a greenfield enterprise.',
        type: 'scheme',
        minAge: 18,
        maxAge: 120,
        occupations: ['Business', 'Women', 'Unemployed'],
        maxMargin: 2000000,
        keywords: ['business', 'loan', 'entrepreneur', 'startup', 'sc/st', 'women']
    },
    {
        id: 3,
        title: 'Pradhan Mantri Vaya Vandana Yojana',
        description: 'A pension scheme announced by the Government of India exclusively for the senior citizens aged 60 years and above.',
        type: 'scheme',
        minAge: 60,
        maxAge: 120,
        occupations: ['Senior Citizen', 'Any', 'Unemployed'],
        maxMargin: 2000000,
        keywords: ['pension', 'senior', 'retirement', 'elderly']
    },
    {
        id: 4,
        title: 'Post Matric Scholarship Scheme',
        description: 'Financial assistance to students studying at post matriculation or post-secondary stage to enable them to complete their education.',
        type: 'scheme',
        minAge: 14,
        maxAge: 30,
        occupations: ['Student'],
        maxMargin: 250000,
        keywords: ['education', 'scholarship', 'student', 'college']
    },
    {
        id: 5,
        title: 'Mudra Yojana (PMMY)',
        description: 'Loans up to ₹10 Lakhs to non-corporate, non-farm small/micro enterprises.',
        type: 'scheme',
        minAge: 18,
        maxAge: 65,
        occupations: ['Business', 'Women', 'Unemployed'],
        maxMargin: 2000000,
        keywords: ['loan', 'micro', 'business', 'msme', 'mudra']
    },
    {
        id: 6,
        title: 'Urban Green Cover Mandate 2026',
        description: 'Local municipal policy mandating 15% green cover allocation for all new commercial real estate projects exceeding 10,000 sq ft.',
        type: 'policy',
        minAge: 0,
        maxAge: 120,
        occupations: ['Business', 'Any'],
        maxMargin: 2000000,
        keywords: ['environment', 'real estate', 'green', 'policy', 'commercial']
    },
    {
        id: 7,
        title: 'City Vendor Zoning Rules',
        description: 'Guidelines on allocated zones for street vendors and hawkers within city limits to avoid traffic congestion while supporting local trade.',
        type: 'policy',
        minAge: 18,
        maxAge: 120,
        occupations: ['Business', 'Unemployed'],
        maxMargin: 500000,
        keywords: ['vendor', 'street', 'zoning', 'local', 'trade']
    },
    {
        id: 8,
        title: 'Mahila Samman Savings Certificate',
        description: 'A one-time small savings scheme available for a two-year period, offering a fixed interest rate for women and girls.',
        type: 'scheme',
        minAge: 0,
        maxAge: 120,
        occupations: ['Women', 'Student', 'Senior Citizen', 'Any'],
        maxMargin: 2000000,
        keywords: ['savings', 'interest', 'women', 'girl', 'finance']
    },
    {
        id: 9,
        title: 'Local Noise Pollution Ordinance',
        description: 'Strict regulations restricting usage of loudspeakers and heavy machinery noise between 10 PM and 6 AM in residential areas.',
        type: 'policy',
        minAge: 0,
        maxAge: 120,
        occupations: ['Any'],
        maxMargin: 2000000,
        keywords: ['noise', 'pollution', 'residential', 'law', 'night']
    }
];

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

        card.innerHTML = `
            <div class="card-badge">${badge}</div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <div class="card-meta">
                <div class="meta-item"><strong>For:</strong> ${occString}</div>
                <div class="meta-item"><strong>Age:</strong> ${ageString}</div>
                <div class="meta-item"><strong>Max Income:</strong> ${incLimit}</div>
            </div>
            <a href="#" class="apply-btn">${type === 'scheme' ? 'Check Details & Apply' : 'Read Full Policy'}</a>
        `;
        container.appendChild(card);
    });
}

// Initial Render
renderData();
