// --- CONFIGURATION ---
const workerUrl = 'https://virtue-production-backend.virtueproductionco.workers.dev';

// Mobile menu toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// FAQ Accordion
const accordionItems = document.querySelectorAll('#faq-accordion button');
accordionItems.forEach(item => {
    item.addEventListener('click', () => {
        const content = item.nextElementSibling;
        const icon = item.querySelector('svg');
        
        accordionItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.nextElementSibling.classList.add('hidden');
                otherItem.querySelector('svg').classList.remove('rotate-180');
            }
        });

        content.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    });
});

// Modal functionality
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('invisible', 'opacity-0');
    modal.querySelector('.modal-content').classList.remove('scale-95');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('opacity-0');
    modal.querySelector('.modal-content').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('invisible');
         // Also hide any feedback messages when closing
        const feedback = modal.querySelector('.form-feedback');
        if (feedback) {
            feedback.style.display = 'none';
        }
    }, 300);
}

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

// Form Setup
const forms = [
    { id: 'contactForm', nameField: 'contact-name', emailField: 'contact-email', messageField: 'contact-message' },
    { id: 'rentalsForm', nameField: 'rental-name', emailField: 'rental-email', messageField: 'rental-message' },
    { id: 'weddingsForm', nameField: 'wedding-name', emailField: 'wedding-email', messageField: 'wedding-message' }
];

forms.forEach(formInfo => {
    const form = document.getElementById(formInfo.id);
    if(form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            if (validateForm(formInfo)) {
                handleFormSubmit(form);
            }
        });
    }
});

function validateForm(formInfo) {
    let isValid = true;
    const nameInput = document.getElementById(formInfo.nameField);
    const emailInput = document.getElementById(formInfo.emailField);
    const messageInput = document.getElementById(formInfo.messageField);

    const nameError = document.getElementById(`${formInfo.nameField}-error`);
    const emailError = document.getElementById(`${formInfo.emailField}-error`);
    const messageError = document.getElementById(`${formInfo.messageField}-error`);
    
    // Reset styles
    nameError.style.display = 'none';
    emailError.style.display = 'none';
    messageError.style.display = 'none';
    nameInput.classList.remove('border-red-500');
    emailInput.classList.remove('border-red-500');
    messageInput.classList.remove('border-red-500');

    if (!nameInput || nameInput.value.trim() === '') {
        nameError.style.display = 'block';
        nameInput.classList.add('border-red-500');
        isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput || !emailRegex.test(emailInput.value)) {
        emailError.style.display = 'block';
        emailInput.classList.add('border-red-500');
        isValid = false;
    }

    if (!messageInput || messageInput.value.trim() === '') {
        messageError.style.display = 'block';
        messageInput.classList.add('border-red-500');
        isValid = false;
    }

    return isValid;
}

async function handleFormSubmit(formElement) {
    const submitButton = formElement.querySelector('button[type="submit"]');
    const feedbackElement = document.getElementById(`${formElement.id}-feedback`);
    
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    if(feedbackElement) feedbackElement.style.display = 'none';

    const formData = new FormData(formElement);
    const data = Object.fromEntries(formData.entries());

    try {
        if (workerUrl === 'PASTE_YOUR_WORKER_URL_HERE' || !workerUrl) {
            throw new Error('Worker URL is not configured.');
        }

        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || `Server responded with status: ${response.status}`);
        }
        
        showFeedback(feedbackElement, 'Thank you! Your message has been sent.', 'success');
        formElement.reset();
        setTimeout(() => closeModal(formElement.closest('.modal').id), 3000); // Close modal after 3 seconds

    } catch (error) {
        console.error('Submission error:', error);
        showFeedback(feedbackElement, `An error occurred: ${error.message}. Please try again.`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Inquiry';
    }
}

function showFeedback(element, message, type) {
    if (element) {
        element.textContent = message;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
    }
}
