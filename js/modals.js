// --- State for Turnstile Token ---
let turnstileToken = null;

// The callback function that Turnstile will call upon success
// This function needs to be globally accessible, so we attach it to the window object.
window.onTurnstileSuccess = function (token) {
    turnstileToken = token;
    // We can also find the hidden input in the active form and set its value
    const activeForm = document.querySelector('.modal:not(.invisible) form');
    if (activeForm) {
        let hiddenInput = activeForm.querySelector('[name="cf-turnstile-response"]');
        if (hiddenInput) {
            hiddenInput.value = token;
        }
    }
};


// --- Modal Functionality ---

async function openModal(modalId, contentUrl) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const contentContainer = document.getElementById(`${modalId}Content`);
    if (!contentContainer) return;

    // Reset turnstile token when a new modal opens
    turnstileToken = null;

    // Show modal with a loading state
    contentContainer.innerHTML = '<p class="text-center p-8">Loading...</p>';
    modal.classList.remove('invisible', 'opacity-0');
    modal.querySelector('.modal-content').classList.remove('scale-95');

    try {
        const response = await fetch(contentUrl);
        if (!response.ok) throw new Error('Could not load form.');
        
        const html = await response.text();
        contentContainer.innerHTML = html;

        // The form now exists in the DOM, so we can attach the event listener
        const form = contentContainer.querySelector('form');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                handleFormSubmit(form); // Assumes handleFormSubmit is in forms.js
            });
        }
        
        // Render the Turnstile widget if it exists in the loaded content
        if (window.turnstile) {
            const turnstileDiv = contentContainer.querySelector('.cf-turnstile');
            if(turnstileDiv) {
                // Explicitly render the widget and capture its ID
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
            // Clear content when closing to ensure forms are fresh on next open
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
        // Close if the click is on the modal backdrop, not the content
        if (event.target === this) {
            closeModal(this.id);
        }
    });
});

