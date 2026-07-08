'use strict';

/* ================================================================
   PGMS 2.0 — ADMIN POLLS SCRIPT
   Handles the creation of new public polls and saving to Firestore
================================================================ */

function el(id) { return document.getElementById(id); }

document.addEventListener('DOMContentLoaded', () => {

    const form = el('poll-form');
    const optionsContainer = el('options-container');
    const addOptionBtn = el('add-option-btn');
    const submitBtn = el('submit-btn');
    const errorText = el('form-error');

    // 1. Dynamic Options Management
    addOptionBtn.addEventListener('click', () => {
        const optionRows = optionsContainer.querySelectorAll('.option-row');
        if (optionRows.length >= 10) {
            alert("Maximum of 10 options allowed.");
            return;
        }

        const newRow = document.createElement('div');
        newRow.className = 'option-row';
        newRow.innerHTML = `
            <input type="text" class="form-input option-input" placeholder="Option ${optionRows.length + 1}" required>
            <button type="button" class="btn-remove" title="Remove Option">✕</button>
        `;
        optionsContainer.appendChild(newRow);

        updateRemoveButtons();
    });

    // Event delegation for dynamically added remove buttons
    optionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove')) {
            const row = e.target.closest('.option-row');
            row.remove();
            updateRemoveButtons();
            updateOptionPlaceholders();
        }
    });

    function updateRemoveButtons() {
        const rows = optionsContainer.querySelectorAll('.option-row');
        rows.forEach((row, index) => {
            const btn = row.querySelector('.btn-remove');
            // Hide remove button if there are only 2 options left (minimum required)
            if (rows.length <= 2) {
                btn.classList.add('hidden');
            } else {
                btn.classList.remove('hidden');
            }
        });
    }

    function updateOptionPlaceholders() {
        const inputs = optionsContainer.querySelectorAll('.option-input');
        inputs.forEach((input, index) => {
            input.placeholder = `Option ${index + 1}`;
        });
    }

    // Initialize button states
    updateRemoveButtons();

    // 2. Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorText.classList.add('hidden');
        errorText.textContent = '';

        // Gather Data
        const question = el('poll-question').value.trim();
        let location = el('poll-location').value.trim();
        const pincode = el('poll-pincode').value.trim();
        const duration = parseInt(el('poll-duration').value, 10);

        // Options
        const optionInputs = optionsContainer.querySelectorAll('.option-input');
        const optionsList = Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(val => val !== '');

        // Validation
        if (optionsList.length < 2) {
            showError("Please provide at least two valid options.");
            return;
        }

        // Format location nicely
        location = location.charAt(0).toUpperCase() + location.slice(1);

        // Prepare document
        const pollData = {
            question: question,
            location: location,
            pincode: pincode,
            durationDays: duration,
            isActive: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            totalVotes: 0,
            options: optionsList.map(optLabel => ({
                label: optLabel,
                value: optLabel.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                votes: 0
            }))
        };

        // UI State
        submitBtn.disabled = true;
        submitBtn.textContent = 'Publishing...';

        try {
            await window.db.collection('polls').add(pollData);
            showSuccess();
        } catch (err) {
            console.error("Error creating poll:", err);
            showError("Failed to publish poll. Check console for details.");
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publish Poll';
        }

    });

    function showError(msg) {
        errorText.textContent = msg;
        errorText.classList.remove('hidden');
    }

    function showSuccess() {
        el('poll-form').closest('.form-container').classList.add('hidden');
        el('success-message').classList.remove('hidden');
    }

    // 3. Reset Form after success
    el('create-another-btn').addEventListener('click', () => {
        form.reset();

        // Reset options to exactly 2 empty inputs
        optionsContainer.innerHTML = '';
        for (let i = 1; i <= 2; i++) {
            const newRow = document.createElement('div');
            newRow.className = 'option-row';
            newRow.innerHTML = `
                <input type="text" class="form-input option-input" placeholder="Option ${i}" required>
                <button type="button" class="btn-remove hidden" title="Remove Option">✕</button>
            `;
            optionsContainer.appendChild(newRow);
        }
        updateRemoveButtons();

        submitBtn.disabled = false;
        submitBtn.textContent = 'Publish Poll';

        el('success-message').classList.add('hidden');
        el('poll-form').closest('.form-container').classList.remove('hidden');

        window.scrollTo(0, 0);
    });

});
