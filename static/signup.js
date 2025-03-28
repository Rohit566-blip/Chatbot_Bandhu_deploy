document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');

    // Handle form submission
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const termsAccepted = termsCheckbox.checked;

        // Basic validation
        if (!name || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (!termsAccepted) {
            alert('Please accept the terms and conditions');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Password validation (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            alert('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
            return;
        }

        // Here you would typically make an API call to your backend
        console.log('Signup attempt:', { name, email });
        
        // For demo purposes, redirect to login page
        window.location.href = '/login';
    });

    // Add input validation feedback
    [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
        input.addEventListener('input', function() {
            if (this.value.trim()) {
                this.classList.add('valid');
            } else {
                this.classList.remove('valid');
            }
        });
    });

    // Password match validation
    confirmPasswordInput.addEventListener('input', function() {
        if (this.value === passwordInput.value) {
            this.setCustomValidity('');
        } else {
            this.setCustomValidity('Passwords must match');
        }
    });

    // Terms and conditions link
    document.querySelector('.terms a').addEventListener('click', function(e) {
        e.preventDefault();
        // Here you would typically show terms and conditions modal or navigate to terms page
        alert('Terms and conditions page will be displayed here');
    });
}); 