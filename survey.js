/**
 * Survey & Suggestions JS logic
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyARUCovi6he0lYE6pikBB_doz72Nae2-h0",
    authDomain: "grievance-form-39f6a.firebaseapp.com",
    projectId: "grievance-form-39f6a",
    storageBucket: "grievance-form-39f6a.firebasestorage.app",
    messagingSenderId: "149185682282",
    appId: "1:149185682282:web:785c21c17d3470592ca313",
    measurementId: "G-9V6SPFXDV0"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {

    // --- TABS LOGIC ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all tabs and panels
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            tabPanels.forEach(p => p.classList.add('hidden'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Activate clicked
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const targetPanel = document.getElementById(btn.getAttribute('aria-controls'));
            targetPanel.classList.remove('hidden');
            targetPanel.classList.add('active');
        });
    });

    // --- POLLS LOGIC (DYNAMIC) ---
    const pollsContainer = document.getElementById('polls-container');
    const searchInput = document.getElementById('poll-pincode');
    const searchBtn = document.getElementById('btn-search-polls');

    // Mock Data for Polls
    const mockPolls = [
        {
            id: 1,
            location: "Sector 12",
            pincode: "110001",
            question: "Do you support the proposed solid waste management schedule changes in your sector?",
            closesIn: "5 days",
            votes: "1,402",
            isNew: true,
            options: [
                { value: "yes", label: "Yes, the morning schedule is better.", pct: "62%" },
                { value: "no", label: "No, keep the current schedule.", pct: "28%" },
                { value: "neutral", label: "No strong preference.", pct: "10%" }
            ]
        },
        {
            id: 2,
            location: "Delhi",
            pincode: "110001",
            question: "Which local public park should be prioritized for renovation via the Swachh Bharat funds?",
            closesIn: "12 days",
            votes: "845",
            isNew: false,
            options: [
                { value: "central", label: "Central Park (Sector 12)", pct: "45%" },
                { value: "lakeside", label: "Lake-side Gardens", pct: "35%" },
                { value: "community", label: "Community Grounds (Sector 4)", pct: "20%" }
            ]
        },
        {
            id: 3,
            location: "Mumbai",
            pincode: "400001",
            question: "Should the local market street be converted to a pedestrian-only zone on weekends?",
            closesIn: "2 days",
            votes: "3,120",
            isNew: true,
            options: [
                { value: "yes", label: "Yes, it will reduce traffic.", pct: "55%" },
                { value: "no", label: "No, it will hurt local businesses.", pct: "40%" },
                { value: "maybe", label: "Maybe, try it for a month.", pct: "5%" }
            ]
        },
        {
            id: 4,
            location: "All",
            pincode: "",
            question: "How satisfied are you with the recent digital payment integrations for property tax?",
            closesIn: "20 days",
            votes: "12,450",
            isNew: false,
            options: [
                { value: "satisfied", label: "Very Satisfied, much easier now.", pct: "75%" },
                { value: "neutral", label: "Neutral.", pct: "15%" },
                { value: "dissatisfied", label: "Dissatisfied, ran into technical issues.", pct: "10%" }
            ]
        },
        {
            id: 5,
            location: "Connaught Place",
            pincode: "110002",
            question: "Are you in favor of making the inner circle vehicle-free?",
            closesIn: "8 days",
            votes: "5,022",
            isNew: true,
            options: [
                { value: "yes", label: "Yes, it will be safer for pedestrians.", pct: "70%" },
                { value: "no", label: "No, it will cause parking issues.", pct: "25%" },
                { value: "neutral", label: "No opinion.", pct: "5%" }
            ]
        },
        {
            id: 6,
            location: "Churchgate",
            pincode: "400020",
            question: "Should the frequency of local trains be increased during night hours?",
            closesIn: "15 days",
            votes: "15,200",
            isNew: false,
            options: [
                { value: "yes", label: "Yes, heavily needed.", pct: "85%" },
                { value: "no", label: "No, current timetable is fine.", pct: "10%" },
                { value: "neutral", label: "Not sure.", pct: "5%" }
            ]
        }
    ];

    function renderPolls(filterValue = "") {
        if (!pollsContainer) return;
        pollsContainer.innerHTML = "";

        const query = filterValue.toLowerCase().trim();

        // Filter polls: show if it matches pincode or location exactly, or if it's a general poll ("All" or empty pincode)
        // Check for nearby pincodes (+- 1)
        const isQueryNumeric = !isNaN(query) && query.length > 0;
        const queryNum = isQueryNumeric ? Number(query) : null;

        const filteredPolls = mockPolls.filter(poll => {
            if (!query) return true;

            const isGeneral = poll.location === "All" || !poll.pincode;

            // Text Match
            const matchLocation = poll.location.toLowerCase().includes(query);

            // Numeric Pincode match including +- 1 bounds
            let matchPincode = false;
            let matchNearbyPincode = false;

            if (poll.pincode) {
                // Exact string match
                matchPincode = poll.pincode.includes(query);

                // +-1 proximity match
                if (isQueryNumeric && !isNaN(poll.pincode)) {
                    const pollPinNum = Number(poll.pincode);
                    if (Math.abs(pollPinNum - queryNum) <= 1) {
                        matchNearbyPincode = true;
                    }
                }
            }

            return matchPincode || matchNearbyPincode || matchLocation || isGeneral;
        });

        if (filteredPolls.length === 0) {
            pollsContainer.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--clr-text-muted);">No polls found for your area. Try another location.</p>`;
            return;
        }

        filteredPolls.forEach(poll => {
            // Build options HTML
            const optionsHtml = poll.options.map((opt, idx) => `
        <label class="radio-label poll-option">
          <input type="radio" name="poll${poll.id}" value="${opt.value}" /> ${opt.label}
        </label>
      `).join('');

            // Build results HTML
            const resultsHtml = poll.options.map((opt) => `
        <div class="result-bar-wrap">
          <div class="result-label"><span>${opt.label}</span><span class="pct">${opt.pct}</span></div>
          <div class="result-track"><div class="result-fill" data-width="${opt.pct}"></div></div>
        </div>
      `).join('');

            const badgeHtml = poll.isNew ? `<div class="poll-badge new">New</div>` : '';
            const locationTagHtml = poll.location !== "All" ? `<span class="poll-badge" style="background:var(--clr-navy-light); color:var(--clr-navy); margin-left: 8px;">📍 ${poll.location}</span>` : '';

            const article = document.createElement('article');
            article.className = 'poll-card';
            article.setAttribute('data-poll-id', poll.id);
            article.innerHTML = `
        ${badgeHtml} ${locationTagHtml}
        <h3 class="poll-question">${poll.question}</h3>
        <p class="poll-meta">Closes in ${poll.closesIn} &bull; ${poll.votes} votes</p>
        
        <div class="poll-voting-area">
          <div class="radio-options column">
            ${optionsHtml}
          </div>
          <button class="btn btn-primary btn-vote" disabled>Cast Vote</button>
        </div>
        
        <div class="poll-results hidden">
          <p class="results-title">Current Results</p>
          ${resultsHtml}
          <p class="success-text">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg> Your vote has been recorded
          </p>
        </div>
      `;
            pollsContainer.appendChild(article);
        });

        // Re-bind listeners for the newly added polls
        bindPollCardEvents();
    }

    function bindPollCardEvents() {
        const currentPollCards = document.querySelectorAll('.poll-card');
        currentPollCards.forEach(card => {
            const radioInputs = card.querySelectorAll('input[type="radio"]');
            const voteBtn = card.querySelector('.btn-vote');
            const votingArea = card.querySelector('.poll-voting-area');
            const resultsArea = card.querySelector('.poll-results');
            const resultFills = resultsArea.querySelectorAll('.result-fill');

            radioInputs.forEach(input => {
                input.addEventListener('change', () => {
                    voteBtn.removeAttribute('disabled');
                });
            });

            // Handle vote cast
            voteBtn.addEventListener('click', async () => {
                const selectedOption = Array.from(radioInputs).find(input => input.checked)?.value;
                if (!selectedOption) return;

                votingArea.classList.add('hidden');
                resultsArea.classList.remove('hidden');

                // Animate
                setTimeout(() => {
                    resultFills.forEach(fill => {
                        const widthVal = fill.getAttribute('data-width');
                        fill.style.width = widthVal;
                    });
                }, 50);

                const pollId = card.getAttribute('data-poll-id');
                const pollQuestion = card.querySelector('.poll-question').textContent;

                const pollData = {
                    type: "poll_answer",
                    pollId: pollId,
                    question: pollQuestion,
                    answer: selectedOption,
                    timestamp: serverTimestamp()
                };

                try {
                    await addDoc(collection(db, "feedbacks"), pollData);
                    showToast("Vote successfully recorded! Thank you.");
                } catch (error) {
                    console.error("Error saving vote:", error);
                    showToast("Vote recorded visually, but failed to save to server.");
                }
            });
        });
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            renderPolls(searchInput.value);
        });

        searchInput.addEventListener('keyup', (e) => {
            if (e.key === "Enter") {
                renderPolls(searchInput.value);
            }
        });
    }

    // Initial render of all polls
    renderPolls("");


    // --- FEEDBACK FORM LOGIC ---
    const fbForm = document.getElementById('suggestion-form');
    const fbDesc = document.getElementById('feedback-desc');
    const fbDescCount = document.getElementById('fb-desc-count');

    // Character count
    if (fbDesc) {
        fbDesc.addEventListener('input', () => {
            const len = fbDesc.value.length;
            fbDescCount.textContent = `${len} / 1000`;
            if (len > 950) {
                fbDescCount.classList.add('limit');
            } else {
                fbDescCount.classList.remove('limit');
            }
        });
    }

    if (fbForm) {
        fbForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Basic validation check
            const cat = document.getElementById('feedback-category').value;
            const sub = document.getElementById('feedback-subject').value.trim();
            const desc = document.getElementById('feedback-desc').value.trim();

            let isValid = true;
            if (!cat) {
                document.getElementById('fb-cat-err').textContent = "Please select a category.";
                isValid = false;
            } else {
                document.getElementById('fb-cat-err').textContent = "";
            }

            if (!sub) {
                document.getElementById('fb-sub-err').textContent = "Subject is required.";
                isValid = false;
            } else {
                document.getElementById('fb-sub-err').textContent = "";
            }

            if (desc.length < 20) {
                document.getElementById('fb-desc-err').textContent = "Please provide at least 20 characters of detail.";
                isValid = false;
            } else {
                document.getElementById('fb-desc-err').textContent = "";
            }

            if (!isValid) return;

            // Submit successful
            const submitBtn = document.getElementById('submit-feedback-btn');
            submitBtn.innerHTML = "Submitting...";
            submitBtn.disabled = true;

            const feedbackData = {
                type: "suggestion",
                category: cat,
                location: document.getElementById('feedback-location').value.trim(),
                subject: sub,
                description: desc,
                rating: document.querySelector('input[name="rating"]:checked')?.value || null,
                anonymous: document.getElementById('fb-anonymous').checked,
                timestamp: serverTimestamp()
            };

            try {
                const docRef = await addDoc(collection(db, "feedbacks"), feedbackData);

                // Hide form, show success
                document.getElementById('feedback-form-card').classList.add('hidden');

                // Use Firestore doc ID as the tracking number
                document.getElementById('fb-ref-number').textContent = `SUG-${docRef.id.substring(0, 6).toUpperCase()}-24`;

                const successScreen = document.getElementById('feedback-success-screen');
                successScreen.classList.remove('hidden');

                showToast("Feedback submitted successfully!");
            } catch (error) {
                console.error("Error adding document: ", error);
                showToast("Error submitting feedback. Please try again.");
                submitBtn.innerHTML = "Submit Suggestion";
                submitBtn.disabled = false;
            }
        });
    }

    // --- TOAST NOTIFICATION ---
    let toastTimer;
    function showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

});
