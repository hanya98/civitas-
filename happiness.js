import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyARUCovi6he0lYE6pikBB_doz72Nae2-h0",
    authDomain: "grievance-form-39f6a.firebaseapp.com",
    projectId: "grievance-form-39f6a",
    storageBucket: "grievance-form-39f6a.firebasestorage.app",
    messagingSenderId: "149185682282",
    appId: "1:149185682282:web:785c21c17d3470592ca313"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data structure to map pincodes to coordinates and labels
const PINCODE_COORDS = {
    // Delhi & NCR
    '110001': { lat: 28.6139, lng: 77.2090, label: 'Connaught Place, New Delhi' },
    '110002': { lat: 28.6200, lng: 77.2100, label: 'Darya Ganj, New Delhi' },
    '110003': { lat: 28.6100, lng: 77.2050, label: 'Civil Lines, New Delhi' },
    '110004': { lat: 28.6020, lng: 77.2070, label: 'President Estate, New Delhi' },
    '110005': { lat: 28.6340, lng: 77.2180, label: 'Kamla Nagar, New Delhi' },
    '110006': { lat: 28.6545, lng: 77.2250, label: 'Delhi University, New Delhi' },
    '110007': { lat: 28.6670, lng: 77.2160, label: 'Model Town, New Delhi' },
    '110008': { lat: 28.6528, lng: 77.1979, label: 'Patel Nagar, New Delhi' },
    '110009': { lat: 28.6415, lng: 77.2020, label: 'Paharganj, New Delhi' },
    '110010': { lat: 28.5900, lng: 77.2090, label: 'Pragati Maidan, New Delhi' },
    '110011': { lat: 28.5991, lng: 77.1900, label: 'Moti Bagh, New Delhi' },
    '110016': { lat: 28.5700, lng: 77.1800, label: 'Hauz Khas, New Delhi' },
    '110020': { lat: 28.5672, lng: 77.2100, label: 'Nehru Place, New Delhi' },
    '110025': { lat: 28.5400, lng: 77.2500, label: 'Okhla, New Delhi' },
    '110044': { lat: 28.5600, lng: 77.2800, label: 'Sarita Vihar, New Delhi' },
    '110048': { lat: 28.5494, lng: 77.1850, label: 'Saket, New Delhi' },
    '110049': { lat: 28.5615, lng: 77.1860, label: 'Green Park, New Delhi' },
    '110058': { lat: 28.6256, lng: 77.0945, label: 'Janakpuri, New Delhi' },
    '110065': { lat: 28.5170, lng: 77.2520, label: 'Kalkaji, New Delhi' },
    '110075': { lat: 28.5823, lng: 77.0500, label: 'Dwarka, New Delhi' },
    '110085': { lat: 28.7256, lng: 77.1205, label: 'Rohini, New Delhi' },
    '110092': { lat: 28.6538, lng: 77.2990, label: 'Shahdara, New Delhi' },

    // Mumbai & Maharashtra
    '400001': { lat: 18.9388, lng: 72.8354, label: 'Fort, Mumbai' },
    '400020': { lat: 18.9322, lng: 72.8264, label: 'Churchgate, Mumbai' },
    '400050': { lat: 19.0640, lng: 72.8400, label: 'Bandra West, Mumbai' },
    '400051': { lat: 19.0558, lng: 72.8526, label: 'Bandra East, Mumbai' },
    '400053': { lat: 19.1136, lng: 72.8348, label: 'Andheri West, Mumbai' },
    '400076': { lat: 19.1176, lng: 72.9060, label: 'Powai, Mumbai' },
    '400092': { lat: 19.2288, lng: 72.8541, label: 'Borivali West, Mumbai' },
    '411001': { lat: 18.5204, lng: 73.8567, label: 'Pune GPO' },

    // Hyderabad & Telangana
    '500001': { lat: 17.3850, lng: 78.4867, label: 'Hyderabad GPO' },
    '500032': { lat: 17.4401, lng: 78.3489, label: 'Gachibowli, Hyderabad' },
    '500033': { lat: 17.4156, lng: 78.4347, label: 'Banjara Hills, Hyderabad' },
    '500034': { lat: 17.4300, lng: 78.4063, label: 'Jubilee Hills, Hyderabad' },
    '500081': { lat: 17.4435, lng: 78.3772, label: 'HITEC City, Hyderabad' },

    // Bangalore & Karnataka
    '560001': { lat: 12.9716, lng: 77.5946, label: 'Bangalore GPO' },
    '560004': { lat: 12.9406, lng: 77.5738, label: 'Basavanagudi, Bangalore' },
    '560011': { lat: 12.9250, lng: 77.5938, label: 'Jayanagar, Bangalore' },
    '560034': { lat: 12.9279, lng: 77.6271, label: 'Koramangala, Bangalore' },
    '560037': { lat: 12.9591, lng: 77.7126, label: 'Marathahalli, Bangalore' },
    '560038': { lat: 12.9784, lng: 77.6408, label: 'Indiranagar, Bangalore' },
    '560066': { lat: 12.9698, lng: 77.7499, label: 'Whitefield, Bangalore' },

    // Others
    '600001': { lat: 13.0827, lng: 80.2707, label: 'Chennai GPO' },
    '700001': { lat: 22.5726, lng: 88.3639, label: 'Kolkata GPO' },
    '302001': { lat: 26.9124, lng: 75.7873, label: 'Jaipur GPO' },
    '226001': { lat: 26.8467, lng: 80.9462, label: 'Lucknow GPO' },
    '380001': { lat: 23.0225, lng: 72.5714, label: 'Ahmedabad GPO' }
};

// Words that typically imply positive sentiment in a poll option
const POSITIVE_WORDS = ['yes', 'agree', 'satisfied', 'excellent', 'good', 'support', 'improve', 'better'];

let map = null;

// Initialize the map centered on India
function initMap() {
    map = L.map("happiness-map").setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

// Derive a happiness score from 0-100 for a single poll option based on language
function getPollOptionScore(optionLabel) {
    const label = optionLabel.toLowerCase();

    // Check for positive words
    for (let word of POSITIVE_WORDS) {
        if (label.includes(word)) return 100;
    }

    // Check for explicitly negative words
    if (label.includes('no') || label.includes('disagree') || label.includes('poor') || label.includes('bad') || label.includes('dissatisfied')) return 0;

    // Neutral fallback
    return 50;
}

// Fetch all Data and Calculate Scores
async function calculateHappinessIndex() {
    const pincodeScores = {}; // Format: { "110001": { pollTotal: 0, pollCount: 0, fbTotal: 0, fbCount: 0 } }

    try {
        // 1. Fetch Polls
        const pollsSnapshot = await getDocs(collection(db, "polls"));
        pollsSnapshot.forEach(doc => {
            const poll = doc.data();
            if (!poll.pincode || poll.totalVotes === 0) return; // Skip polls with no location or votes

            // Allow multiple comma-separated pincodes in a poll
            const pincodes = typeof poll.pincode === 'string' ? poll.pincode.split(',').map(p => p.trim()) : [poll.pincode];

            pincodes.forEach(pin => {
                if (!pincodeScores[pin]) {
                    pincodeScores[pin] = { pollTotal: 0, pollCount: 0, fbTotal: 0, fbCount: 0 };
                }

                let pollScoreSum = 0;
                let totalPollVotes = 0;

                // Calculate average happiness of this specific poll
                (poll.options || []).forEach(opt => {
                    const weight = getPollOptionScore(opt.label);
                    const votes = opt.votes || 0;
                    pollScoreSum += (weight * votes);
                    totalPollVotes += votes;
                });

                if (totalPollVotes > 0) {
                    const avgPollScore = pollScoreSum / totalPollVotes;
                    pincodeScores[pin].pollTotal += avgPollScore;
                    pincodeScores[pin].pollCount += 1;
                }
            });
        });

        // 2. Fetch Feedbacks
        const feedbackSnapshot = await getDocs(collection(db, "feedbacks"));
        feedbackSnapshot.forEach(doc => {
            const fb = doc.data();
            // Try to extract a pincode from the "location" string simply by looking for 6 digits
            // (Since feedbacks don't have a structured pincode field right now)
            let pin = null;
            if (fb.location) {
                const match = fb.location.match(/\b\d{6}\b/);
                if (match) pin = match[0];
            }

            // If they provided a 1-5 star rating
            if (pin && fb.rating) {
                if (!pincodeScores[pin]) {
                    pincodeScores[pin] = { pollTotal: 0, pollCount: 0, fbTotal: 0, fbCount: 0 };
                }

                // Convert 1-5 stars to 0-100 scale
                // 1 = 0, 2 = 25, 3 = 50, 4 = 75, 5 = 100
                const ratingNum = parseInt(fb.rating, 10);
                const fbScore = (ratingNum - 1) * 25;

                pincodeScores[pin].fbTotal += fbScore;
                pincodeScores[pin].fbCount += 1;
            }
        });

        // 3. Final calculation per pincode
        const finalRankings = [];

        // Loop through all pincodes we have data for, AND all default pincodes (to show them even if empty)
        const allPins = new Set([...Object.keys(pincodeScores), ...Object.keys(PINCODE_COORDS)]);

        allPins.forEach(pin => {
            const data = pincodeScores[pin] || { pollTotal: 0, pollCount: 0, fbTotal: 0, fbCount: 0 };

            // If we have no data, give a neutral/default baseline score to make the map look populated
            // (e.g., between 50-70 based on pseudo-random to make it look realistic for a demo)
            let score = 0;
            let hasData = false;

            if (data.pollCount > 0 || data.fbCount > 0) {
                hasData = true;
                let pollAvg = data.pollCount > 0 ? (data.pollTotal / data.pollCount) : null;
                let fbAvg = data.fbCount > 0 ? (data.fbTotal / data.fbCount) : null;

                if (pollAvg !== null && fbAvg !== null) {
                    score = (pollAvg + fbAvg) / 2; // 50/50 blend
                } else if (pollAvg !== null) {
                    score = pollAvg;
                } else if (fbAvg !== null) {
                    score = fbAvg;
                }
            } else {
                // Generate a consistent pseudo-random default score between 45 and 85
                const num = parseInt(pin, 10);
                score = 45 + ((num * 13) % 40);
            }

            // Map to coordinates
            const loc = PINCODE_COORDS[pin] || { lat: null, lng: null, label: `Pincode ${pin}` };

            finalRankings.push({
                pincode: pin,
                label: loc.label,
                lat: loc.lat,
                lng: loc.lng,
                score: Math.round(score),
                hasData: hasData
            });
        });

        // 4. Sort by score (descending)
        finalRankings.sort((a, b) => b.score - a.score);

        renderResults(finalRankings);

    } catch (error) {
        console.error("Error calculating happiness index:", error);
        document.getElementById('leaderboard-container').innerHTML = `<p style="color:var(--red); padding: 20px;">Failed to process data. Please try again.</p>`;
    }
}

// Get appropriate color based on score
function getScoreColor(score) {
    if (score >= 70) return '#006937'; // Green
    if (score >= 40) return '#d4770b'; // Yellow/Orange
    return '#c0392b'; // Red
}

function getScoreClass(score) {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-med';
    return 'score-low';
}

// Render map markers and leaderboard UI
function renderResults(rankings) {
    const listContainer = document.getElementById('leaderboard-container');
    listContainer.innerHTML = '';

    // Bounds collection to zoom map
    const bounds = [];

    rankings.forEach((city, index) => {
        // --- 1. Plot on Map ---
        if (city.lat && city.lng) {
            const color = getScoreColor(city.score);

            // Custom marker visualizing the score
            const markerIcon = L.divIcon({
                className: 'happiness-marker',
                html: `<div style="
                          width: 32px; height: 32px;
                          background: ${color};
                          color: white; font-weight: bold; font-family: sans-serif;
                          font-size: 11px;
                          border: 2px solid white;
                          border-radius: 50%;
                          display: flex; align-items: center; justify-content: center;
                          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                      ">${city.score}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const dataStatus = city.hasData ? '<span style="color: green; font-size:0.8rem;">Live Data</span>' : '<span style="color: gray; font-size:0.8rem;">Simulated Baseline</span>';

            const popupContent = `
                <div style="font-family:'Noto Sans',sans-serif; min-width: 160px; text-align: center;">
                    <h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: #1a3a6b;">${city.label}</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: #718096;">Pincode: ${city.pincode}</p>
                    <div style="margin: 10px 0;">
                        <span style="font-size: 2rem; font-weight: bold; color: ${color};">${city.score}</span>
                        <span style="font-size: 0.9rem; color: #718096;">/ 100</span>
                    </div>
                    ${dataStatus}
                </div>
            `;

            const marker = L.marker([city.lat, city.lng], { icon: markerIcon })
                .bindPopup(popupContent)
                .addTo(map);

            bounds.push([city.lat, city.lng]);
        }

        // --- 2. Add to Leaderboard (Only Top 10) ---
        if (index < 10) {
            let rankClass = '';
            if (index === 0) rankClass = 'rank-1';
            else if (index === 1) rankClass = 'rank-2';
            else if (index === 2) rankClass = 'rank-3';

            const item = document.createElement('div');
            item.className = 'city-item';

            // Fly to location on map click
            item.addEventListener('click', () => {
                if (city.lat && city.lng) {
                    map.flyTo([city.lat, city.lng], 12);
                }
            });

            item.innerHTML = `
                <div class="rank ${rankClass}">#${index + 1}</div>
                <div class="city-info">
                    <h4 class="city-name">${city.label}</h4>
                    <p class="city-meta">Pin: ${city.pincode}</p>
                </div>
                <div class="score-circle ${getScoreClass(city.score)}">
                    ${city.score}
                </div>
            `;
            listContainer.appendChild(item);
        }
    });

    // Zoom map to fit all points
    if (bounds.length > 0) {
        map.fitBounds(L.latLngBounds(bounds).pad(0.1));
    }
}

// Start sequence when page loads
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    calculateHappinessIndex();
});
