document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('errorMessage');
  
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      window.location.href = data.redirectUrl;
    } else {
      errorDiv.textContent = data.message;
      errorDiv.classList.remove('d-none');
    }
  } catch (error) {
    errorDiv.textContent = 'An error occurred. Please try again.';
    errorDiv.classList.remove('d-none');
  }
});
