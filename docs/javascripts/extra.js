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

// Add copy buttons to code blocks
function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre > code');
    
    codeBlocks.forEach(function(codeBlock) {
        const button = document.createElement('button');
        button.className = 'md-clipboard md-icon';
        button.title = 'Copy to clipboard';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
            </svg>
        `;
        
        button.addEventListener('click', function() {
            const text = codeBlock.textContent;
            navigator.clipboard.writeText(text).then(function() {
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                    </svg>
                `;
                setTimeout(function() {
                    button.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
                        </svg>
                    `;
                }, 2000);
            });
        });
        
        const pre = codeBlock.parentElement;
        pre.style.position = 'relative';
        pre.appendChild(button);
    });
}

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
        
        // Basic validation
        const warnings = [];
        
        if (!content.includes('type: Application')) {
            warnings.push('Missing "type: Application" declaration');
        }
        
        if (!content.includes('version:')) {
            warnings.push('Missing version specification');
        }
        
        if (!content.includes('metadata:')) {
            warnings.push('Missing metadata section');
        }
        
        if (!content.includes('spec:')) {
            warnings.push('Missing spec section');
        }
        
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