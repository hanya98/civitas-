const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.interimResults = false;

const voiceBtn = document.getElementById('voiceBtn');
const voiceOverlay = document.getElementById('voice-overlay');

function startListening() {
    try {
        recognition.start();
        voiceBtn.classList.add('listening');
        console.log("Assistant listening...");
    } catch (e) {
        console.log("Recognition already started or blocked.");
    }
}

recognition.onresult = (event) => {
    voiceBtn.classList.remove('listening');
    const command = event.results[0][0].transcript.toLowerCase();
    console.log("Command received: " + command);
    handleVoiceCommand(command);
};

recognition.onerror = () => {
    voiceBtn.classList.remove('listening');
    console.error("Speech recognition error.");
};

function handleVoiceCommand(cmd) {
    const isHindi = recognition.lang === 'hi-IN';

    const routes = [
        { keys: ["contact", "address", "phone", "reach", "संपर्क"], url: "contact.html", text: "Opening the contact page." },
        { keys: ["home", "main", "start", "मुख्य"], url: "index.html", text: "Going back to home." },
        { keys: ["service", "register", "complaint", "grievance", "शिकायत"], url: "citizen.html", text: "Redirecting to complaint registration." },
        { keys: ["status", "track", "check", "स्थिति"], url: "tracking.html", text: "Opening complaint tracking." },
        { keys: ["news", "update", "bulletin", "समाचार"], url: "https://newsroom-seedtosuccess.onrender.com/", text: "Opening the newsroom." },
        { keys: ["happy", "feedback", "index", "खुशी"], url: "happiness.html", text: "Opening happiness index feedback." }
    ];

    let matched = routes.find(route => route.keys.some(k => cmd.includes(k)));

    if (matched) {
        speak(matched.text);
        setTimeout(() => {
            window.location.href = matched.url;
        }, 1500);
    } else {
        const fallback = "I'm sorry, I couldn't find that page. Try saying 'Contact' or 'Services'.";
        speak(fallback);
    }
}

function showSpotlight(id, text) {
    const el = document.getElementById(id);
    const rect = el.getBoundingClientRect();
    
    const top = rect.top + window.scrollY;
    const left = rect.left + window.scrollX;

    voiceOverlay.style.display = 'block';
    voiceOverlay.innerHTML = `
        <div class="highlight-ring" style="
            top: ${top - 10}px; 
            left: ${left - 10}px; 
            width: ${rect.width + 20}px; 
            height: ${rect.height + 20}px;">
        </div>
        <div class="voice-indicator" style="
            top: ${top + rect.height + 20}px; 
            left: ${left}px;">
            👆 ${text}
        </div>
    `;

    setTimeout(() => {
        voiceOverlay.style.display = 'none';
    }, 6000);
}

function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
}

window.onscroll = () => { 
    if(voiceOverlay) voiceOverlay.style.display = 'none'; 

};

