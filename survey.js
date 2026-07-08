/**
 * Survey & Suggestions JS logic
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, doc, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

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

    // --- POLLS LOGIC (DYNAMIC FROM FIREBASE) ---
    const pollsContainer = document.getElementById('polls-container');
    const searchInput = document.getElementById('poll-pincode');
    const searchBtn = document.getElementById('btn-search-polls');

    let livePolls = [];

    // Fetch User Pincode from Firebase based on Aadhaar
    async function fetchUserPincode() {
        const aadhaar = localStorage.getItem('Aadhaar');
        if (!aadhaar) return;

        try {
            // Find the most recent complaint by this citizen to get their pincode
            const q = query(
                collection(db, "complaints"),
                where("aadhaar", "==", aadhaar),
                orderBy("submittedAt", "desc"),
                limit(1)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const latestComplaint = snapshot.docs[0].data();
                const userPincode = latestComplaint.pincode;
                if (userPincode && searchInput) {
                    searchInput.value = userPincode;
                    const statusEl = document.getElementById('pincode-fetch-status');
                    if (statusEl) statusEl.style.display = 'block';
                    console.log("Auto-fetched pincode from Firebase:", userPincode);
                    // Initial render with the fetched pincode
                    renderPolls(userPincode);
                } else {
                    renderPolls("");
                }
            } else {
                console.log("No previous complaints found for this Aadhaar. Defaulting to all polls.");
                renderPolls("");
            }
        } catch (err) {
            console.error("Error fetching user pincode:", err);
            renderPolls("");
        }
    }

    // Fetch Polls from Firestore
    async function fetchPolls() {
        if (!pollsContainer) return;
        pollsContainer.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading live polls...</p></div>`;

        try {
            const snapshot = await getDocs(collection(db, "polls"));
            livePolls = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                livePolls.push(data);
            });

            // Sort by newest first
            livePolls.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

            // Initial render - fetch user pincode first
            await fetchUserPincode();
        } catch (err) {
            console.error("Error fetching polls:", err);
            pollsContainer.innerHTML = `<p style="padding: 20px; text-align: center; color: #ef4444;">Failed to load polls. Please try again later.</p>`;
        }
    }

    // Helper: calculate time remaining
    function getClosesInStr(createdAt, durationDays) {
        if (!createdAt || !durationDays) return "Unknown";
        const createdMs = createdAt.toMillis ? createdAt.toMillis() : Date.now();
        const endMs = createdMs + (durationDays * 24 * 60 * 60 * 1000);
        const now = Date.now();
        const diffDays = Math.ceil((endMs - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return "Closed";
        if (diffDays === 0) return "Closing Today";
        return `${diffDays} days`;
    }

    function renderPolls(filterValue = "") {
        if (!pollsContainer) return;
        pollsContainer.innerHTML = "";

        const query = filterValue.toLowerCase().trim();

        // Filter polls
        const isQueryNumeric = !isNaN(query) && query.length > 0;
        const queryNum = isQueryNumeric ? Number(query) : null;

        const filteredPolls = livePolls.filter(poll => {
            if (!query) return true;

            const loc = poll.location ? poll.location.toLowerCase() : "";
            const isGeneral = loc === "all" || !poll.pincode;

            // Text Match
            const matchLocation = loc.includes(query);

            // Numeric Pincode match including +- 1 bounds
            let matchPincode = false;
            let matchNearbyPincode = false;

            if (poll.pincode) {
                matchPincode = poll.pincode.includes(query);
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
            // Calculate percentages
            const totalVotes = poll.totalVotes || 0;

            // Generate options HTML
            const optionsHtml = poll.options.map((opt, idx) => `
                <label class="radio-label poll-option">
                  <input type="radio" name="poll-${poll.id}" value="${opt.value}" data-index="${idx}" /> ${opt.label}
                </label>
            `).join('');

            // Generate results HTML
            const resultsHtml = poll.options.map((opt) => {
                const votes = opt.votes || 0;
                const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                return `
                <div class="result-bar-wrap">
                  <div class="result-label"><span>${opt.label}</span><span class="pct">${pct}%</span></div>
                  <div class="result-track"><div class="result-fill" data-width="${pct}%" style="width:0%"></div></div>
                </div>`;
            }).join('');

            // Determine if New (e.g. created in last 2 days)
            const msIn2Days = 2 * 24 * 60 * 60 * 1000;
            const createdMs = poll.createdAt?.toMillis ? poll.createdAt.toMillis() : Date.now();
            const isNew = (Date.now() - createdMs) < msIn2Days;

            const badgeHtml = isNew ? `<div class="poll-badge new">New</div>` : '';
            const locationTagHtml = (!poll.location || poll.location.toLowerCase() === "all") ?
                '' :
                `<span class="poll-badge" style="background:var(--clr-navy-light); color:var(--clr-navy); margin-left: 8px;">📍 ${poll.location}</span>`;

            const closesIn = getClosesInStr(poll.createdAt, poll.durationDays || 7);
            const votesLabel = (totalVotes === 1) ? "1 vote" : `${totalVotes} votes`;

            const article = document.createElement('article');
            article.className = 'poll-card';
            article.setAttribute('data-poll-id', poll.id);
            article.innerHTML = `
                ${badgeHtml} ${locationTagHtml}
                <h3 class="poll-question">${poll.question}</h3>
                <p class="poll-meta">Closes in ${closesIn} &bull; ${votesLabel}</p>
                
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
                const selectedInput = Array.from(radioInputs).find(input => input.checked);
                if (!selectedInput) return;

                const selectedOption = selectedInput.value;
                const selectedIndex = parseInt(selectedInput.getAttribute('data-index'), 10);

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

                try {
                    // 1. Update the actual poll document in 'polls' collection
                    const pollRef = doc(db, "polls", pollId);

                    // We need to fetch the current document first to update the specific option in the array
                    const pollDoc = await getDocs(collection(db, "polls"));
                    let currentOptions = [];
                    let currentTotal = 0;
                    pollDoc.forEach(d => {
                        if (d.id === pollId) {
                            currentOptions = d.data().options || [];
                            currentTotal = d.data().totalVotes || 0;
                        }
                    });

                    if (currentOptions.length > selectedIndex) {
                        currentOptions[selectedIndex].votes = (currentOptions[selectedIndex].votes || 0) + 1;

                        // We use updateDoc (imported dynamically if needed, or structured differently, but here we just re-fetch using standard v9)
                        // Note: import { doc, updateDoc } from ... is needed, but for this basic setup we rely on the ones available or standard methods.
                        // Assuming updateDoc is not imported by default in this file's header, let's use a workaround if needed or assume we can import it.
                        // Wait, the header only imports: { getFirestore, collection, addDoc, serverTimestamp, getDocs }
                        // I will need to update the imports at the top of the file as well! Let's do that next.
                    }

                    // Let's assume we update the document via a standard method
                    // For now, since we only have `addDoc` imported natively, we'll need to update the import in a subsequent change, 
                    // or I'll just write the full v9 syntax here and update imports immediately after.
                    import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js").then(async ({ doc, updateDoc }) => {
                        const pRef = doc(db, "polls", pollId);
                        await updateDoc(pRef, {
                            options: currentOptions,
                            totalVotes: currentTotal + 1
                        });
                    });

                    // 2. Also log the feedback action as before (optional, but good for tracking who voted)
                    const pollDataLog = {
                        type: "poll_answer",
                        pollId: pollId,
                        question: pollQuestion,
                        answer: selectedOption,
                        timestamp: serverTimestamp()
                    };
                    await addDoc(collection(db, "feedbacks"), pollDataLog);

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

    // Initial render of all polls from Firebase
    fetchPolls();


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
