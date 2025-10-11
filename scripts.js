// Blog post configuration
// Add your posts here in reverse chronological order (newest first)
const posts = [
    {
        id: 'post-4',
        title: 'Why I’m Leaving Major Social Medias — and the SHADY part of the Internet',
        date: '2025-10-11',
        excerpt: '',
        file: 'posts/Why_I_am_Leaving_Major_Social_Medias-and_the_SHADY_part_of_the_Internet.html'
    },
    {
        id: 'post-3',
        title: 'Beginner-friendly C++ basics guide',
        date: '2025-10-10',
        excerpt: '',
        file: 'posts/Beginner-friendly_C++_basics_guide.html'
    },
    {
        id: 'post-2',
        title: 'Tame Your Git: Cleaner History, Painless Merges',
        date: '2025-10-07',
        excerpt: '',
        file: 'posts/TameYourGit.html'
    },
    {
        id: 'post-1',
        title: 'Welcome to My Digital Space',
        date: '2025-10-07',
        excerpt: '',
        file: 'posts/post-1.html'
    }
];

// Pagination settings
const POSTS_PER_PAGE = 12;
let currentIndex = 0;

// Load and display posts in batches
function loadPosts() {
    const container = document.getElementById('postsContainer');
    
    // Clear loading message on first load
    if (currentIndex === 0) {
        container.innerHTML = '';
    }

    if (posts.length === 0) {
        container.innerHTML = '<div class="loading">No posts yet. Check back soon!</div>';
        return;
    }

    // Calculate posts to show
    const endIndex = Math.min(currentIndex + POSTS_PER_PAGE, posts.length);
    const postsToShow = posts.slice(currentIndex, endIndex);

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
        card.innerHTML = `
            <div class="post-date">${formatDate(post.date)}</div>
            <h2 class="post-title">${post.title}</h2>
            <p class="post-excerpt">${post.excerpt}</p>
            <a href="${post.file}" class="read-more">READ MORE →</a>
        `;
        
        // Add click handler for the entire card
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A') {
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
    if (currentIndex < posts.length) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'loadMoreBtn';
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.textContent = `Load More (${posts.length - currentIndex} remaining)`;
        loadMoreBtn.onclick = loadPosts;
        container.appendChild(loadMoreBtn);
    }
}

// Format date nicely
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Initialize
document.addEventListener('DOMContentLoaded', loadPosts);
