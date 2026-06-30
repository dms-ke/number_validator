// ---- No flag mapping needed ----
// (countryFlags removed)

const form = document.getElementById('phoneForm');
const resultDiv = document.getElementById('result');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const phoneNumber = document.getElementById('phoneInput').value.trim();
  if (!phoneNumber) {
    resultDiv.innerHTML = '<span class="error">Please enter a phone number.</span>';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Checking...';
  resultDiv.innerHTML = '<span class="loading">Validating... please wait.</span>';

  try {
    const response = await fetch('/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await response.json();

    if (response.ok) {
      let html = '';
      if (data.valid) {
        // Flag removed – just plain country name
        html += `<div class="valid">✅ Valid number</div>`;
        html += `<span class="info"><strong>Country:</strong> ${data.countryName} (${data.regionCode})</span><br>`;
        html += `<span class="info"><strong>National number:</strong> ${data.nationalNumber}</span><br>`;
        html += `<span class="info"><strong>Country calling code:</strong> +${data.countryCode}</span><br>`;
        html += `<span class="info"><strong>International format:</strong> ${data.internationalFormat}</span><br>`;
        html += `<span class="info"><strong>E.164 format:</strong> ${data.e164Format}</span>`;
      } else {
        html += `<div class="invalid">❌ Invalid number</div>`;
        html += `<span class="error">${data.message || 'Number does not appear to be valid for any country.'}</span>`;
      }
      resultDiv.innerHTML = html;
    } else {
      if (response.status === 429) {
        resultDiv.innerHTML = `<span class="invalid">⏳ Too many requests. Please try again later.</span>`;
      } else {
        resultDiv.innerHTML = `<span class="invalid">Error: ${data.error || 'Something went wrong.'}</span>`;
      }
    }
  } catch (error) {
    resultDiv.innerHTML = `<span class="invalid">Network error: ${error.message}</span>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Validate';
  }
});