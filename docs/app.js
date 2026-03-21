let allNews = [];
let categories = [];
let dates = [];
let currentCategory = 'all';
let currentDate = null;
let searchQuery = '';

async function loadData(dateFile = null) {
    try {
        const url = dateFile ? `archive/${dateFile}.json` : 'data.json';
        const response = await fetch(url);
        const data = await response.json();
        allNews = dateFile ? data.news : data.news;
        if (!dateFile) {
            categories = data.categories;
            dates = data.dates;
            renderCategories();
            renderArchive();
        }
        renderNews();
    } catch (error) {
        console.error('加载数据失败:', error);
        document.getElementById('news-list').innerHTML = '<div class="no-results">加载数据失败，请刷新页面重试</div>';
    }
}

function renderCategories() {
    const container = document.querySelector('.filters');
    const existingAll = container.querySelector('[data-category="all"]');
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.category = cat;
        btn.textContent = cat;
        btn.addEventListener('click', () => filterByCategory(cat));
        container.appendChild(btn);
    });
}

function renderArchive() {
    const container = document.getElementById('archive-list');
    container.innerHTML = '';
    
    dates.forEach(date => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = formatDate(date);
        a.dataset.date = date;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            loadArchive(date);
        });
        li.appendChild(a);
        container.appendChild(li);
    });
}

function formatDate(date) {
    const [year, month, day] = date.split('-');
    return `${month}/${day}`;
}

function filterByCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    renderNews();
}

function loadArchive(date) {
    currentDate = currentDate === date ? null : date;
    document.querySelectorAll('#archive-list a').forEach(a => {
        a.classList.toggle('active', a.dataset.date === currentDate);
    });
    
    if (currentDate) {
        loadData(currentDate);
    } else {
        loadData();
    }
}

function filterByTag(tag) {
    const searchInput = document.getElementById('search-input');
    searchInput.value = tag;
    searchQuery = tag;
    renderNews();
}

function renderNews() {
    const container = document.getElementById('news-list');
    
    let filtered = allNews;
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(n => n.category === currentCategory);
    }
    
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(n => 
            n.title.toLowerCase().includes(q) ||
            n.summary.toLowerCase().includes(q) ||
            n.tags.some(t => t.toLowerCase().includes(q))
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-results">没有找到符合条件的新闻</div>';
        return;
    }
    
    container.innerHTML = filtered.map(news => `
        <article class="news-card">
            <div class="news-meta">
                <span class="news-date">${news.date}</span>
                <span class="news-category">${news.category}</span>
                <span class="news-heat">热度 ${news.heat.toLocaleString()}</span>
            </div>
            <h2 class="news-title">
                <a href="${news.url}" target="_blank" rel="noopener">${escapeHtml(news.title)}</a>
            </h2>
            <p class="news-summary">${escapeHtml(news.summary)}</p>
            <div class="news-tags">
                ${news.tags.map(tag => `<span class="tag" onclick="filterByTag('${escapeHtml(tag)}')">${escapeHtml(tag)}</span>`).join('')}
            </div>
        </article>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderNews();
});

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    const allBtn = document.querySelector('.filter-btn[data-category="all"]');
    if (allBtn) {
        allBtn.addEventListener('click', () => filterByCategory('all'));
    }
});