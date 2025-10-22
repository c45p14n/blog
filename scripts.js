// Page config
const POSTS_PER_PAGE = 12;
let currentIndex = 0;
let allPostsMetadata = [];
let filteredPosts = [];
let currentSearchTerm = '';
let activeTags = new Set();

// Load post index (just metadata)
async function initializeBlog() {
    const container = document.getElementById('postsContainer');
    
    try {
        const response = await fetch('posts/index.json');
        if (!response.ok) throw new Error('Failed to load posts index');
        
        allPostsMetadata = await response.json();
        filteredPosts = [...allPostsMetadata];
        initializeSearchAndFilter();
        loadFiltersFromURL();
        generateTagCloud();
        loadPosts();
    } 
    
    catch (error) {
        console.error('Error loading posts:', error);
        container.innerHTML = '<div class="loading">Error loading posts. Please try again.</div>';
    }
}

// Initialize search and filter functionality
function initializeSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    if (searchInput) {
        // Debounced search
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearchTerm = e.target.value.toLowerCase().trim();
                applyFilters();
            }, 300);
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentSearchTerm = searchInput.value.toLowerCase().trim();
            applyFilters();
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    // Handle tag clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag') || e.target.classList.contains('tag-cloud-item')) {
            e.stopPropagation();
            const tag = e.target.dataset.tag || e.target.textContent.trim();
            toggleTag(tag);
        }
        
        if (e.target.classList.contains('remove-tag-btn')) {
            e.stopPropagation();
            const tag = e.target.dataset.tag;
            toggleTag(tag);
        }
    });
}

// Toggle tag selection
function toggleTag(tag) {
    if (activeTags.has(tag)) {
        activeTags.delete(tag);
    } else {
        activeTags.add(tag);
    }
    
    updateActiveTagsDisplay();
    updateTagCloudState();
    applyFilters();
    updateURL();
}

// Apply search and tag filters
function applyFilters() {
    currentIndex = 0;
    filteredPosts = [...allPostsMetadata];
    
    // Apply search filter
    if (currentSearchTerm) {
        filteredPosts = filteredPosts.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(currentSearchTerm);
            const excerptMatch = post.excerpt?.toLowerCase().includes(currentSearchTerm);
            const tagsMatch = post.tags?.some(tag => tag.toLowerCase().includes(currentSearchTerm));
            return titleMatch || excerptMatch || tagsMatch;
        });
    }
    
    // Apply tag filter (Or logic)
    if (activeTags.size > 0) {
        filteredPosts = filteredPosts.filter(post => {
            return [...activeTags].some(tag => 
                post.tags?.some(postTag => postTag.toLowerCase() === tag.toLowerCase())
            );
        });
    }
    
    // Clear and reload posts
    const container = document.getElementById('postsContainer');
    container.innerHTML = '';
    
    // Show clear filters button if filters are active
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        clearBtn.style.display = (currentSearchTerm || activeTags.size > 0) ? 'block' : 'none';
    }
    
    loadPosts();
}

// Load and display posts in batches
function loadPosts() {
    const container = document.getElementById('postsContainer');
    
    // Clear loading message on first load
    if (currentIndex === 0) {
        const loadingMsg = container.querySelector('.loading');
        if (loadingMsg) {
            loadingMsg.remove();
        }
    } 
    
    if (filteredPosts.length === 0) {
        if (currentSearchTerm || activeTags.size > 0) {
            container.innerHTML = '<div class="no-results">No posts found matching your search criteria. Try different keywords or tags.</div>';
        } else {
            container.innerHTML = '<div class="loading">No posts yet. Check back soon!</div>';
        }
        return;
    }

    // Calculate posts to show
    const endIndex = Math.min(currentIndex + POSTS_PER_PAGE, filteredPosts.length);
    const postsToShow = filteredPosts.slice(currentIndex, endIndex);

    // Remove existing "Load More" button if present
    const existingButton = document.getElementById('loadMoreBtn');
    if (existingButton) {
        existingButton.remove();
    }

    // Create and append post cards
    postsToShow.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        // Add tags if they exist
        const tagsHTML = post.tags ? 
            `<div class="post-tags">${post.tags.map(tag => 
                `<span class="tag ${activeTags.has(tag) ? 'active' : ''}" data-tag="${tag}">${tag}</span>`
            ).join('')}</div>` 
            : '';
        
        card.innerHTML = `
            <div class="post-date">${formatDate(post.date)}</div>
            <h2 class="post-title">${highlightText(post.title, currentSearchTerm)}</h2>
            <p class="post-excerpt">${highlightText(post.excerpt, currentSearchTerm)}</p>
            ${tagsHTML}
            <a href="${post.file}" class="read-more">READ MORE â†’</a>
        `;
        
        // Add click handler for the entire card
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A' && !e.target.classList.contains('tag')) {
                window.location.href = post.file;
            }
        });
        
        container.appendChild(card);

        // Animate in
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 50);
    });

    // Update current index
    currentIndex = endIndex;

    // Add "Load More" button if there are more posts
    if (currentIndex < filteredPosts.length) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'loadMoreBtn';
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.textContent = `Load More (${filteredPosts.length - currentIndex} remaining)`;
        loadMoreBtn.onclick = loadPosts;
        container.appendChild(loadMoreBtn);
    }
}

// Highlight search terms in text
function highlightText(text, searchTerm) {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Escape special regex characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Generate tag cloud
function generateTagCloud() {
    const tagCloudContainer = document.getElementById('tagCloud');
    if (!tagCloudContainer) return;
    
    // Count tag occurrences
    const tagCounts = {};
    allPostsMetadata.forEach(post => {
        post.tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    
    // Sort by count (descending)
    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1]);
    
    if (sortedTags.length === 0) {
        tagCloudContainer.innerHTML = '<div class="no-tags">No tags available</div>';
        return;
    }
    
    tagCloudContainer.innerHTML = sortedTags.map(([tag, count]) => `
        <button class="tag-cloud-item ${activeTags.has(tag) ? 'active' : ''}" data-tag="${tag}">
            ${tag} <span class="tag-count">(${count})</span>
        </button>
    `).join('');
}

// Update tag cloud active state
function updateTagCloudState() {
    const tagButtons = document.querySelectorAll('.tag-cloud-item');
    tagButtons.forEach(btn => {
        const tag = btn.dataset.tag;
        if (activeTags.has(tag)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Update active tags display
function updateActiveTagsDisplay() {
    const activeTagsContainer = document.getElementById('activeTags');
    if (!activeTagsContainer) return;
    
    if (activeTags.size === 0) {
        activeTagsContainer.innerHTML = '';
        activeTagsContainer.style.display = 'none';
        return;
    }
    
    activeTagsContainer.style.display = 'flex';
    activeTagsContainer.innerHTML = `
        <span class="active-tags-label">Active filters:</span>
        ${[...activeTags].map(tag => `
            <span class="active-tag">
                ${tag}
                <button class="remove-tag-btn" data-tag="${tag}" aria-label="Remove ${tag}">X</button>
            </span>
        `).join('')}
    `;
}

// Clear all filters
function clearAllFilters() {
    currentSearchTerm = '';
    activeTags.clear();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    updateActiveTagsDisplay();
    updateTagCloudState();
    applyFilters();
    updateURL();
}

// Update URL with current filters
function updateURL() {
    const params = new URLSearchParams();
    
    if (currentSearchTerm) {
        params.set('q', currentSearchTerm);
    }
    
    if (activeTags.size > 0) {
        params.set('tags', [...activeTags].join(','));
    }
    
    const newURL = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
    
    history.replaceState(null, '', newURL);
}

// Load filters from URL
function loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    const search = params.get('q');
    if (search) {
        currentSearchTerm = search;
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = search;
    }
    
    const tags = params.get('tags');
    if (tags) {
        tags.split(',').forEach(tag => activeTags.add(tag.trim()));
        updateActiveTagsDisplay();
        updateTagCloudState();
    }
}

// Format date nicely - handles both single dates and date ranges
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    
    // Check if it's a date range (object with start and end)
    if (typeof date === 'object' && date.start && date.end) {
        const start = new Date(date.start);
        const end = new Date(date.end);
        
        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
            // Same month: "12 to 29 August 2025"
            const monthYear = end.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            return `${start.getDate()} to ${end.getDate()} ${monthYear}`;
        } else {
            // Different months: "August 12, 2025 to September 5, 2025"
            const startDate = start.toLocaleDateString('en-US', options);
            const endDate = end.toLocaleDateString('en-US', options);
            return `${startDate} to ${endDate}`;
        }
    }
    
    // Single date
    return new Date(date).toLocaleDateString('en-US', options);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeBlog);
