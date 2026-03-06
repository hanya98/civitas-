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
    let targetId = null;
    let instruction = "";

    if (cmd.includes("about") || cmd.includes("civitas") || cmd.includes("who are you")) {
        targetId = "about-gov"; // We need to add this ID to the section
        instruction = "Civitas is a digital platform for grievance redressal and transparency.";
    } 
    else if (cmd.includes("complaint") || cmd.includes("register") || cmd.includes("grievance")) {
        targetId = "services-dropdown"; // We will add an ID to the services link
        instruction = "You can register complaints under the Services menu.";
    }
    else if (cmd.includes("news") || cmd.includes("what's new") || cmd.includes("update")) {
        targetId = "whats-new-section"; 
        instruction = "Here are the latest civic infrastructure updates.";
    }
    else if (cmd.includes("impact") || cmd.includes("work") || cmd.includes("result")) {
        targetId = "impact-section";
        instruction = "Explore our civic impact and infrastructure monitoring.";
    }
    else if (cmd.includes("login") || cmd.includes("admin") || cmd.includes("citizen")) {
        targetId = "login-area";
        instruction = "You can login as a Citizen or Admin in the top right.";
    }

    // EXECUTE VISUAL HIGHLIGHT
    if (targetId && document.getElementById(targetId)) {
        showSpotlight(targetId, instruction);
        speak(instruction);
    } else {
        speak("I heard " + cmd + ". Try asking about 'Impact', 'News', or 'About Civitas'.");
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