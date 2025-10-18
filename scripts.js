const POSTS_PER_PAGE = 12;
let currentIndex = 0;
let allPostsMetadata = []; // Just titles, dates, excerpts

// Load post index (lightweight - just metadata)
async function initializeBlog() {
    const container = document.getElementById('postsContainer');
    
    try {
        const response = await fetch('posts/index.json');
        if (!response.ok) throw new Error('Failed to load posts index');
        
        allPostsMetadata = await response.json();
        loadPosts();
    } catch (error) {
        console.error('Error loading posts:', error);
        container.innerHTML = '<div class="loading">Error loading posts. Please try again later.</div>';
    }
}

// Load and display posts in batches
function loadPosts() {
    const container = document.getElementById('postsContainer');
    
    // Clear loading message on first load
    if (currentIndex === 0) {
        container.innerHTML = '';
    }

    if (allPostsMetadata.length === 0) {
        container.innerHTML = '<div class="loading">No posts yet. Check back soon!</div>';
        return;
    }

    // Calculate posts to show
    const endIndex = Math.min(currentIndex + POSTS_PER_PAGE, allPostsMetadata.length);
    const postsToShow = allPostsMetadata.slice(currentIndex, endIndex);

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
            `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` 
            : '';
        
        card.innerHTML = `
            <div class="post-date">${formatDate(post.date)}</div>
            <h2 class="post-title">${post.title}</h2>
            <p class="post-excerpt">${post.excerpt}</p>
            ${tagsHTML}
            <a href="${post.file}" class="read-more">READ MORE →</a>
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
    if (currentIndex < allPostsMetadata.length) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'loadMoreBtn';
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.textContent = `Load More (${allPostsMetadata.length - currentIndex} remaining)`;
        loadMoreBtn.onclick = loadPosts;
        container.appendChild(loadMoreBtn);
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
