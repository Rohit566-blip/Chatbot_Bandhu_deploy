// Form elements
const loginForm = document.querySelector('.login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('remember');
const googleBtn = document.querySelector('.social-button.google');
const facebookBtn = document.querySelector('.social-button.facebook');

// Validation patterns
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Form submission handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset previous error states
    resetErrors();
    
    // Validate inputs
    let isValid = validateInputs();
    
    if (isValid) {
        try {
            // Show loading state
            const submitBtn = loginForm.querySelector('.login-button');
            submitBtn.innerHTML = '<span class="loading">Logging in...</span>';
            submitBtn.disabled = true;
            
            // Collect form data
            const formData = {
                email: emailInput.value.trim(),
                password: passwordInput.value,
                rememberMe: rememberMeCheckbox.checked
            };
            
            // Simulate API call (replace with your actual API endpoint)
            await simulateApiCall(formData);
            
            // Show success message
            showNotification('Success! Redirecting to dashboard...', 'success');
            
            // Redirect after successful login (replace with your dashboard URL)
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);
            
        } catch (error) {
            showNotification(error.message || 'Login failed. Please try again.', 'error');
            submitBtn.innerHTML = 'Login';
            submitBtn.disabled = false;
        }
    }
});

// Input validation
function validateInputs() {
    let isValid = true;
    
    // Email validation
    if (emailInput.value.trim() === '') {
        showError(emailInput, 'Email is required');
        isValid = false;
    } else if (!emailPattern.test(emailInput.value.trim())) {
        showError(emailInput, 'Please enter a valid email');
        isValid = false;
    }
    
    // Password validation
    if (passwordInput.value === '') {
        showError(passwordInput, 'Password is required');
        isValid = false;
    }
    
    return isValid;
}

// Error handling
function showError(input, message) {
    const formGroup = input.parentElement;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    formGroup.appendChild(errorDiv);
    formGroup.classList.add('error');
}

function resetErrors() {
    document.querySelectorAll('.error-message').forEach(error => error.remove());
    document.querySelectorAll('.form-group.error').forEach(group => group.classList.remove('error'));
}

// Notification handling
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Social authentication handlers
googleBtn.addEventListener('click', () => {
    showNotification('Google authentication coming soon!', 'info');
});

facebookBtn.addEventListener('click', () => {
    showNotification('Facebook authentication coming soon!', 'info');
});

// Simulate API call (replace with actual API call)
function simulateApiCall(data) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) { // 90% success rate for demo
                resolve({ success: true });
            } else {
                reject(new Error('Invalid credentials. Please try again.'));
            }
        }, 1500);
    });
}

// Initialize form
document.addEventListener('DOMContentLoaded', () => {
    // Clear any existing values
    emailInput.value = '';
    passwordInput.value = '';
    rememberMeCheckbox.checked = false;
}); 