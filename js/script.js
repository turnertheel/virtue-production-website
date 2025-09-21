// --- CONFIGURATION ---
const workerUrl = 'https://virtue-production-backend.virtueproductionco.workers.dev';

document.addEventListener('DOMContentLoaded', () => {

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Close mobile menu when a link is clicked
    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // FAQ Accordion
    const accordionItems = document.querySelectorAll('#faq-accordion button');
    accordionItems.forEach(item => {
        item.addEventListener('click', () => {
            const content = item.nextElementSibling;
            const icon = item.querySelector('svg');
            
            const isVisible = !content.classList.contains('hidden');

            // Close all other items
            accordionItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.nextElementSibling.classList.add('hidden');
                    otherItem.querySelector('svg').classList.remove('rotate-180');
                }
            });

            // Toggle the clicked item
            if (!isVisible) {
                content.classList.remove('hidden');
                icon.classList.add('rotate-180');
            } else {
                 content.classList.add('hidden');
                 icon.classList.remove('rotate-180');
            }
        });
    });

    // --- Form Setup ---
    const formsToSetup = [
        'rentalsForm',
        'weddingsForm',
        'contactForm'
    ];

    formsToSetup.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', function(event) {
                event.preventDefault();
                handleFormSubmit(form);
            });
        }
    });
});


// --- Modal Functionality ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('invisible', 'opacity-0');
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('scale-95');
        }
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
            // Reset form state on close
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
                const feedback = form.querySelector('.form-feedback');
                if(feedback) feedback.style.display = 'none';
                // Remove all error states
                form.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));
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


// --- Form Validation and Submission ---

function validateForm(form) {
    let isValid = true;
    // Hide all previous error messages
    form.querySelectorAll('.form-input, .form-radio, .form-checkbox').forEach(input => {
        input.classList.remove('border-red-500');
    });

    const requiredInputs = form.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        let fieldIsValid = true;
        if (input.type === 'radio') {
            const radioGroup = form.querySelectorAll(`input[name="${input.name}"]`);
            if (![...radioGroup].some(radio => radio.checked)) {
                fieldIsValid = false;
            }
        } else if (input.type === 'checkbox') {
             const checkboxGroup = form.querySelectorAll(`input[name="${input.name}"]`);
            if (![...checkboxGroup].some(checkbox => checkbox.checked)) {
                fieldIsValid = false;
            }
        } else if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                fieldIsValid = false;
            }
        } else if (input.value.trim() === '') {
            fieldIsValid = false;
        }

        if (!fieldIsValid) {
            isValid = false;
            input.classList.add('border-red-500');
            // Find the parent container to highlight the whole group for radios/checkboxes
            const fieldContainer = input.closest('div');
            if(fieldContainer) {
                 fieldContainer.querySelectorAll('label').forEach(label => label.classList.add('text-red-500'));
            }
        } else {
             const fieldContainer = input.closest('div');
             if(fieldContainer) {
                 fieldContainer.querySelectorAll('label').forEach(label => label.classList.remove('text-red-500'));
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

    const submitButton = formElement.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    showFeedback(formElement.id, '', 'none'); // Clear previous feedback

    const formData = new FormData(formElement);
    const data = Object.fromEntries(formData.entries());

    // Handle checkboxes, which FormData doesn't handle well for multiple values
    const checkboxGroups = {};
    formElement.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (!checkboxGroups[cb.name]) {
            checkboxGroups[cb.name] = [];
        }
        if (cb.checked) {
            checkboxGroups[cb.name].push(cb.value);
        }
    });
    // Add checkbox groups to the data payload
    for(const key in checkboxGroups) {
        data[key] = checkboxGroups[key];
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
        feedbackElement.className = `form-feedback ${type}`; // Applies success/error styles
        feedbackElement.style.display = message ? 'block' : 'none';
    }
}

