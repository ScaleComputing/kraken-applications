// Custom JavaScript for Kraken Applications documentation

document.addEventListener('DOMContentLoaded', function() {
    // Add copy functionality to YAML examples
    addCopyButtons();
    
    // Add resource type badges
    addResourceBadges();
    
    // Initialize interactive examples
    initializeInteractiveExamples();
    
    // Add manifest validation
    addManifestValidation();
});

// Add resource type badges to manifest examples
function addResourceBadges() {
    const yamlBlocks = document.querySelectorAll('.language-yaml');
    
    yamlBlocks.forEach(function(block) {
        const content = block.textContent;
        
        // Check for resource types
        if (content.includes('type: virdomain')) {
            addBadge(block, 'VirDomain', 'virdomain');
        }
        if (content.includes('type: virtual_disk')) {
            addBadge(block, 'Asset', 'asset');
        }
        if (content.includes('cloud_init_data:')) {
            addBadge(block, 'Cloud-Init', 'cloud-init');
        }
    });
}

function addBadge(block, text, type) {
    const badge = document.createElement('span');
    badge.className = `resource-badge ${type}`;
    badge.textContent = text;
    
    const container = block.closest('.highlight');
    if (container) {
        const header = container.querySelector('.highlight-header') || 
                      createBadgeHeader(container);
        header.appendChild(badge);
    }
}

function createBadgeHeader(container) {
    const header = document.createElement('div');
    header.className = 'highlight-header';
    header.style.cssText = `
        padding: 0.5rem 1rem;
        background: var(--md-code-bg-color);
        border-bottom: 1px solid var(--md-default-fg-color--lightest);
        border-radius: 0.5rem 0.5rem 0 0;
    `;
    container.insertBefore(header, container.firstChild);
    return header;
}

// Initialize interactive examples
function initializeInteractiveExamples() {
    const interactiveBlocks = document.querySelectorAll('[data-interactive]');
    
    interactiveBlocks.forEach(function(block) {
        const type = block.getAttribute('data-interactive');
        
        if (type === 'memory-calculator') {
            addMemoryCalculator(block);
        } else if (type === 'manifest-validator') {
            addManifestValidator(block);
        }
    });
}

// Add memory calculator widget
function addMemoryCalculator(container) {
    const calculator = document.createElement('div');
    calculator.className = 'memory-calculator';
    calculator.innerHTML = `
        <h4>Memory Calculator</h4>
        <div>
            <label>Memory (GB): <input type="number" id="memory-gb" value="4" min="1" max="256"></label>
            <p>Bytes: <code id="memory-bytes">4294967296</code></p>
        </div>
    `;
    
    const input = calculator.querySelector('#memory-gb');
    const output = calculator.querySelector('#memory-bytes');
    
    input.addEventListener('input', function() {
        const gb = parseFloat(input.value);
        const bytes = Math.round(gb * 1024 * 1024 * 1024);
        output.textContent = bytes.toString();
    });
    
    container.appendChild(calculator);
}

// Add manifest validation
function addManifestValidation() {
    const yamlBlocks = document.querySelectorAll('.language-yaml');
    
    yamlBlocks.forEach(function(block) {
        const content = block.textContent;
        
        // Check for memory format
        const memoryMatch = content.match(/memory:\s*(\d+)/);
        if (memoryMatch && !content.includes(`memory: "${memoryMatch[1]}"`)) {
            warnings.push('Memory should be specified as string (e.g., "4294967296")');
        }
        
        if (warnings.length > 0) {
            addValidationWarnings(block, warnings);
        }
    });
}

function addValidationWarnings(block, warnings) {
    const container = block.closest('.highlight');
    const warningDiv = document.createElement('div');
    warningDiv.className = 'validation-warnings';
    warningDiv.style.cssText = `
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 0.5rem;
        padding: 0.75rem;
        margin-top: 0.5rem;
        font-size: 0.9em;
    `;
    
    warningDiv.innerHTML = `
        <strong>⚠️ Validation Warnings:</strong>
        <ul>
            ${warnings.map(w => `<li>${w}</li>`).join('')}
        </ul>
    `;
    
    container.appendChild(warningDiv);
}

// Add search enhancements
function enhanceSearch() {
    const searchInput = document.querySelector('.md-search__input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            
            // Highlight matching terms in navigation
            const navItems = document.querySelectorAll('.md-nav__item');
            navItems.forEach(function(item) {
                const link = item.querySelector('.md-nav__link');
                if (link) {
                    const text = link.textContent.toLowerCase();
                    if (query && text.includes(query)) {
                        link.style.background = 'var(--md-accent-fg-color--transparent)';
                    } else {
                        link.style.background = '';
                    }
                }
            });
        });
    }
}

// Initialize search enhancements
document.addEventListener('DOMContentLoaded', enhanceSearch);

// Add smooth scrolling for anchor links
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.md-search__input');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Escape to close search
    if (e.key === 'Escape') {
        const searchInput = document.querySelector('.md-search__input');
        if (searchInput && document.activeElement === searchInput) {
            searchInput.blur();
        }
    }
});
