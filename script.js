const input = document.getElementById('code-input');
const preview = document.getElementById('preview');
const buttons = document.querySelectorAll('.toggle-btn');

// Yung apat na buttons
const btnHtml = document.getElementById('btn-html');
const btnCss = document.getElementById('btn-css');
const btnJs = document.getElementById('btn-js');
const btnFull = document.getElementById('btn-full');

function updatePreview(mode) {
  // Kunin yung code ng user
  const raw = input.value;

  // I-extract ang HTML, CSS, JS
  const htmlMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const cssMatch = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const jsMatch = raw.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

  const htmlContent = htmlMatch ? htmlMatch[1] : raw;
  const cssContent = cssMatch ? cssMatch[1] : '';
  const jsContent = jsMatch ? jsMatch[1] : '';

  let output = '';

  if (mode === 'html') {
    output = htmlContent;
  } else if (mode === 'css') {
    output = `<style>${cssContent}</style>${htmlContent}`;
  } else if (mode === 'js') {
    output = `${htmlContent}<script>${jsContent}<\/script>`;
  } else {
    output = `<style>${cssContent}</style>${htmlContent}<script>${jsContent}<\/script>`;
  }

  preview.srcdoc = output;
}

// Button clicks
btnHtml.addEventListener('click', () => {
  setActive(btnHtml);
  updatePreview('html');
});

btnCss.addEventListener('click', () => {
  setActive(btnCss);
  updatePreview('css');
});

btnJs.addEventListener('click', () => {
  setActive(btnJs);
  updatePreview('js');
});

btnFull.addEventListener('click', () => {
  setActive(btnFull);
  updatePreview('full');
});

// Update preview habang nagta-type
input.addEventListener('input', () => {
  updatePreview('full');
});

function setActive(activeBtn) {
  buttons.forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}

const breakdownBtn = document.getElementById('breakdown-btn');
const breakdownResult = document.getElementById('breakdown-result');

breakdownBtn.addEventListener('click', async () => {
  const code = input.value.trim();

  if (!code) {
    alert('Mag-paste muna ng code!');
    return;
  }

  breakdownBtn.textContent = '⏳ Analyzing...';
  breakdownBtn.disabled = true;
  breakdownResult.innerHTML = '';

  const prompt = `A user pasted this website code. Break it down into HTML, CSS, and JavaScript parts and explain each one in simple, beginner-friendly language.

CODE:
${code.substring(0, 4000)}

Respond ONLY in this JSON format (no markdown, no backticks):
{
  "html": { "explanation": "..." },
  "css": { "explanation": "..." },
  "js": { "explanation": "..." },
  "summary": "One sentence about what this code does overall."
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    const raw = data.content.map(c => c.text || '').join('');
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

    const sections = [
      { label: '📄 HTML', key: 'html' },
      { label: '🎨 CSS', key: 'css' },
      { label: '⚡ JavaScript', key: 'js' }
    ];

    let html = `<div class="breakdown-card">
      <div class="breakdown-card-header">💡 Summary</div>
      <div class="breakdown-card-body">${parsed.summary}</div>
    </div>`;

    for (const s of sections) {
      html += `<div class="breakdown-card">
        <div class="breakdown-card-header">${s.label}</div>
        <div class="breakdown-card-body">${parsed[s.key].explanation}</div>
      </div>`;
    }

    breakdownResult.innerHTML = html;

  } catch (e) {
    breakdownResult.innerHTML = '<p style="color:red;">Something went wrong. Try again!</p>';
  }

  breakdownBtn.textContent = '🧠 Break it down';
  breakdownBtn.disabled = false;
});