// --- CONFIGURATION ---
const workerUrl = 'https://virtue-production-backend.virtueproductionco.workers.dev';

// --- Form Validation and Submission ---

function validateForm(form) {
    let isValid = true;
    // Clear previous errors
    form.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));
    form.querySelectorAll('.text-red-500').forEach(el => el.classList.remove('text-red-500'));

    const requiredInputs = form.querySelectorAll('[required]');
    
    requiredInputs.forEach(input => {
        let fieldIsValid = true;
        let fieldContainer = input.closest('div');

        if (input.type === 'radio') {
            const radioGroup = form.querySelectorAll(`input[name="${input.name}"]`);
            if (![...radioGroup].some(radio => radio.checked)) { fieldIsValid = false; }
        } else if (input.type === 'checkbox') {
            const checkboxGroup = form.querySelectorAll(`input[name="${input.name}"]`);
             if (input.required && ![...checkboxGroup].some(checkbox => checkbox.checked)) { fieldIsValid = false; }
        } else if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) { fieldIsValid = false; }
        } else if (input.value.trim() === '') {
            fieldIsValid = false;
        }

        if (!fieldIsValid) {
            isValid = false;
            if (input.type === 'radio' || input.type === 'checkbox') {
                const groupLabel = fieldContainer.querySelector('.form-label');
                if (groupLabel) { groupLabel.classList.add('text-red-500'); }
                else { fieldContainer.classList.add('text-red-500'); }
            } else {
                input.classList.add('border-red-500');
            }
        }
    });

    return isValid;
}

async function handleFormSubmit(formElement) {
    if (!validateForm(formElement)) {
        showFeedback(formElement.id, 'Please fill out all required fields marked with *', 'error');
        return;
    }

    // This check is now a fallback, as the primary verification happens in modals.js
    if (!turnstileToken) {
        showFeedback(formElement.id, 'Could not verify you are human. Please wait a moment and try again.', 'error');
        return;
    }

    const submitButton = formElement.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    showFeedback(formElement.id, '', 'none');

    const formData = new FormData(formElement);
    const data = Object.fromEntries(formData.entries());

    // Add the globally stored Turnstile token to our data payload
    data['cf-turnstile-response'] = turnstileToken;

    // Special handling for checkboxes
    const checkboxGroups = {};
    formElement.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (!checkboxGroups[cb.name]) { checkboxGroups[cb.name] = []; }
        if (cb.checked) { checkboxGroups[cb.name].push(cb.value); }
    });

    for (const key in checkboxGroups) {
        data[key] = checkboxGroups[key].length > 0 ? checkboxGroups[key] : [];
    }


    try {
        if (!workerUrl) throw new Error('Worker URL is not configured.');

        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || `Server responded with status: ${response.status}`);
        }
        
        showFeedback(formElement.id, 'Thank you! Your message has been sent.', 'success');
        
        if (window.turnstile) {
            const widget = formElement.querySelector('.cf-turnstile');
            if (widget && widget.dataset.widgetId) {
                turnstile.reset(widget.dataset.widgetId);
            }
        }
        setTimeout(() => closeModal(formElement.closest('.modal').id), 3000);

    } catch (error) {
        console.error('Submission error:', error);
        showFeedback(formElement.id, `An error occurred: ${error.message}`, 'error');
    } finally {
        submitButton.disabled = false;
        if(formElement.id === 'weddingsForm'){
            submitButton.textContent = 'Submit Application';
        } else {
            submitButton.textContent = 'Submit Inquiry';
        }
    }
}

function showFeedback(formId, message, type) {
    const feedbackElement = document.getElementById(`${formId}-feedback`);
    if (feedbackElement) {
        feedbackElement.textContent = message;
        feedbackElement.className = `form-feedback ${type}`;
        feedbackElement.style.display = message ? 'block' : 'none';
    }
}

