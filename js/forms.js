// --- Global Turnstile Callback Functions ---

// This function is called by Turnstile when the challenge is successfully completed.
window.onTurnstileSuccess = function (token) {
    const activeForm = document.querySelector('.modal:not(.invisible) form');
    if (activeForm) {
        // Enable the submit button now that we have a valid token.
        const submitButton = activeForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
        }
        // Also hide any "please wait" messages.
        const feedback = activeForm.querySelector('.form-feedback');
        if (feedback && feedback.textContent.includes('Verifying')) {
             feedback.style.display = 'none';
        }
    }
};

// This function is called if the Turnstile challenge expires.
window.onTurnstileExpire = function () {
    const activeForm = document.querySelector('.modal:not(.invisible) form');
    if (activeForm) {
        // Disable the submit button again.
        const submitButton = activeForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
        }
        showFeedback(activeForm.id, 'Verification expired. The page may need to be reloaded.', 'error');
    }
}


// --- Modal Functionality ---

async function openModal(modalId, contentUrl) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const contentContainer = document.getElementById(`${modalId}Content`);
    if (!contentContainer) return;

    // Show modal with a loading state
    contentContainer.innerHTML = '<p class="text-center p-8">Loading...</p>';
    modal.classList.remove('invisible', 'opacity-0');
    modal.querySelector('.modal-content').classList.remove('scale-95');

    try {
        const response = await fetch(contentUrl);
        if (!response.ok) throw new Error('Could not load form.');
        
        const html = await response.text();
        contentContainer.innerHTML = html;

        const form = contentContainer.querySelector('form');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                handleFormSubmit(form);
            });
             // Show a message while Turnstile loads
            showFeedback(form.id, 'Verifying you are human, please wait...', 'info');
        }
        
        // Render the Turnstile widget
        if (window.turnstile) {
            const turnstileDiv = contentContainer.querySelector('.cf-turnstile');
            if(turnstileDiv) {
                const widgetId = turnstile.render(turnstileDiv);
                turnstileDiv.dataset.widgetId = widgetId;
            }
        }

    } catch (error) {
        console.error('Error loading modal content:', error);
        contentContainer.innerHTML = `<p class="text-center p-8 text-red-600">Error: ${error.message}</p>`;
    }
}


function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('opacity-0');
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('scale-95');
        }
        setTimeout(() => {
            modal.classList.add('invisible');
            const contentContainer = document.getElementById(`${modalId}Content`);
            if (contentContainer) {
                contentContainer.innerHTML = '';
            }
        }, 300);
    }
}

// Global listeners for closing modals
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            if (!modal.classList.contains('invisible')) {
                closeModal(modal.id);
            }
        });
    }
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(event) {
        if (event.target === this) {
            closeModal(this.id);
        }
    });
});

