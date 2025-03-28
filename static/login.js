document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const socialButtons = document.querySelectorAll('.social-button');

    // Handle form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const remember = rememberCheckbox.checked;

        // Basic validation
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Here you would typically make an API call to your backend
        console.log('Login attempt:', { email, remember });
        
        // For demo purposes, redirect to chat page
        window.location.href = '/chat';
    });

    // Handle social login buttons
    socialButtons.forEach(button => {
        button.addEventListener('click', function() {
            const platform = this.classList.contains('google') ? 'Google' : 'Facebook';
            console.log(`${platform} login clicked`);
            // Here you would implement social login logic
        });
    });

    // Handle forgot password
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) {
            alert('Please enter your email address first');
            return;
        }
        console.log('Forgot password for:', email);
        // Here you would implement password reset logic
    });

    // Add input validation feedback
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('input', function() {
            if (this.value.trim()) {
                this.classList.add('valid');
            } else {
                this.classList.remove('valid');
            }
        });
    });
}); 