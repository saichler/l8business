// Business Directory Application with Login
class BusinessApp {
    constructor() {
        this.bearerToken = localStorage.getItem('bearerToken') || null;
        this.businesses = [];
        this.filteredBusinesses = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalRecords = 0;
        this.currentView = 'grid';
        this.filters = { city: '', state: '', segment: '', search: '' };
        this.sortBy = 'name';
        this.metadata = null;

        this.init();
    }

    init() {
        // Check if user is already logged in
        if (this.bearerToken) {
            this.showApp();
        } else {
            // Redirect to login page
            window.location.href = '/login/';
        }
    }

    async showApp() {
        document.getElementById('appContainer').style.display = 'block';
        this.showLoading(true);
        await this.loadData();
        this.setupAppListeners();
        this.renderBusinesses();
        this.setupParallax();
        this.showLoading(false);
    }

    logout() {
        this.bearerToken = null;
        localStorage.removeItem('bearerToken');
        window.location.href = '/login/';
    }

    async loadData(page = 0, applyFilters = false) {
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (this.bearerToken) {
                headers['Authorization'] = `Bearer ${this.bearerToken}`;
            }

            let whereClause = 'where taxid=*';
            if (applyFilters) {
                if (this.filters.city) {
                    const val = this.filters.city.includes(' ') ? `'${this.filters.city}'` : this.filters.city;
                    whereClause += ` and city=${val}`;
                }
                if (this.filters.state) {
                    const val = this.filters.state.includes(' ') ? `'${this.filters.state}'` : this.filters.state;
                    whereClause += ` and state=${val}`;
                }
                if (this.filters.segment) {
                    const val = this.filters.segment.includes(' ') ? `'${this.filters.segment}'` : this.filters.segment;
                    whereClause += ` and segment=${val}`;
                }
                if (this.filters.search) {
                    const val = this.filters.search.includes(' ') ? `'*${this.filters.search}*'` : `*${this.filters.search}*`;
                    whereClause += ` and name=${val}`;
                }
            }

            const queryBody = {
                text: `select * from L8Business ${whereClause} limit ${this.itemsPerPage} page ${page}`
            };

            const url = `/service/0/Business?body=${encodeURIComponent(JSON.stringify(queryBody))}`;
            const response = await fetch(url, { method: 'GET', headers });
            const data = await response.json();

            this.businesses = data.list || [];

            // Only process metadata from page 0
            if (page === 0) {
                this.metadata = data.metadata || null;
                if (this.metadata?.keyCount?.counts?.Total) {
                    this.totalRecords = this.metadata.keyCount.counts.Total;
                }
                if (this.metadata) {
                    this.updateStats();
                    this.populateFilters();
                }
            }

            this.filteredBusinesses = [...this.businesses];
        } catch (error) {
            console.error('Error loading data:', error);
            this.businesses = [];
            this.filteredBusinesses = [];
            this.totalRecords = 0;
        }
    }

    setupAppListeners() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Search
        document.getElementById('searchInput').addEventListener('input',
            this.debounce((e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300)
        );

        // Filters
        document.getElementById('cityFilter').addEventListener('change', (e) => {
            this.filters.city = e.target.value;
            this.applyFilters();
        });

        document.getElementById('stateFilter').addEventListener('change', (e) => {
            this.filters.state = e.target.value;
            this.applyFilters();
        });

        document.getElementById('segmentFilter').addEventListener('change', (e) => {
            this.filters.segment = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.currentTarget.dataset.view));
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', async () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.showLoading(true);
                const hasFilters = this.filters.city || this.filters.state || this.filters.segment || this.filters.search;
                await this.loadData(this.currentPage - 1, hasFilters);
                this.renderBusinesses();
                this.showLoading(false);
            }
        });

        document.getElementById('nextPage').addEventListener('click', async () => {
            const totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.showLoading(true);
                const hasFilters = this.filters.city || this.filters.state || this.filters.segment || this.filters.search;
                await this.loadData(this.currentPage - 1, hasFilters);
                this.renderBusinesses();
                this.showLoading(false);
            }
        });

        // Modal
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('businessModal').addEventListener('click', (e) => {
            if (e.target.id === 'businessModal') this.closeModal();
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    setupParallax() {
        window.addEventListener('scroll', () => {
            document.querySelectorAll('.parallax-layer-back').forEach(el => {
                el.style.transform = `translateY(${-(window.scrollY * 0.5)}px)`;
            });
        });
    }

    populateFilters() {
        if (this.metadata?.valueCount) {
            const cityValues = this.metadata.valueCount.city?.counts
                ? Object.keys(this.metadata.valueCount.city.counts).sort() : [];
            const stateValues = this.metadata.valueCount.state?.counts
                ? Object.keys(this.metadata.valueCount.state.counts).sort() : [];
            const segmentValues = this.metadata.valueCount.segment?.counts
                ? Object.keys(this.metadata.valueCount.segment.counts).sort() : [];

            this.populateSelect('cityFilter', cityValues);
            this.populateSelect('stateFilter', stateValues);
            this.populateSelect('segmentFilter', segmentValues);
        }
    }

    populateSelect(id, options) {
        const select = document.getElementById(id);
        const currentValue = select.value;
        const placeholder = select.querySelector('option[value=""]');
        select.innerHTML = '';
        select.appendChild(placeholder);

        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        });

        if (currentValue && options.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    async applyFilters() {
        this.currentPage = 1;
        this.showLoading(true);
        await this.loadData(0, true);
        this.renderBusinesses();
        this.showLoading(false);
    }

    clearFilters() {
        this.filters = { city: '', state: '', segment: '', search: '' };
        document.getElementById('searchInput').value = '';
        document.getElementById('cityFilter').value = '';
        document.getElementById('stateFilter').value = '';
        document.getElementById('segmentFilter').value = '';
        document.getElementById('sortBy').value = 'name';
        this.sortBy = 'name';
        this.applyFilters();
    }

    renderBusinesses() {
        const grid = document.getElementById('businessGrid');
        grid.innerHTML = '';

        if (this.filteredBusinesses.length === 0) {
            grid.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem;">No businesses found.</p>';
            return;
        }

        this.filteredBusinesses.forEach(business => {
            grid.appendChild(this.createBusinessCard(business));
        });

        this.updatePagination();
    }

    createBusinessCard(business) {
        const card = document.createElement('div');
        card.className = 'bservice-card';
        card.onclick = () => this.showBusinessDetails(business);

        card.innerHTML = `
            <div class="business-card-header">
                <div>
                    <div class="business-name">${this.escapeHtml(business.name || 'N/A')}</div>
                    ${business.owner ? `<div style="color:var(--text-light);font-size:0.875rem;">Owner: ${this.escapeHtml(business.owner)}</div>` : ''}
                </div>
                ${business.segment ? `<span class="business-segment">${this.escapeHtml(business.segment)}</span>` : ''}
            </div>
            <div class="business-info">
                ${business.address ? `<div class="business-info-item"><span class="info-icon">&#128205;</span><span>${this.escapeHtml(business.address)}</span></div>` : ''}
                ${business.city || business.state || business.zip ? `<div class="business-info-item"><span class="info-icon">&#127961;</span><span>${[business.city, business.state, business.zip].filter(Boolean).map(v => this.escapeHtml(v)).join(', ')}</span></div>` : ''}
                ${business.phone ? `<div class="business-info-item"><span class="info-icon">&#128222;</span><span>${this.escapeHtml(business.phone)}</span></div>` : ''}
            </div>
            <div class="business-card-footer">
                ${business.start_date ? `<span>Est. ${this.escapeHtml(business.start_date)}</span>` : '<span></span>'}
                ${business.certificate_number ? `<span>Cert: ${this.escapeHtml(business.certificate_number)}</span>` : '<span></span>'}
            </div>
        `;
        return card;
    }

    showBusinessDetails(business) {
        const modal = document.getElementById('businessModal');
        const modalBody = document.getElementById('modalBody');

        modalBody.innerHTML = `
            <h2 style="color:var(--primary-color);margin-bottom:1.5rem;">${this.escapeHtml(business.name || 'N/A')}</h2>
            <div style="display:grid;gap:1rem;">
                ${this.createDetailRow('Owner', business.owner)}
                ${this.createDetailRow('Address', business.address)}
                ${this.createDetailRow('City', business.city)}
                ${this.createDetailRow('State', business.state)}
                ${this.createDetailRow('ZIP Code', business.zip)}
                ${this.createDetailRow('Phone', business.phone)}
                ${this.createDetailRow('Industry', business.segment)}
                ${this.createDetailRow('Start Date', business.start_date)}
                ${this.createDetailRow('End Date', business.end_date)}
                ${this.createDetailRow('Certificate', business.certificate_number)}
                ${this.createDetailRow('Tax ID', business.tax_id)}
                ${this.createDetailRow('Source', business.source)}
            </div>
        `;
        modal.classList.add('active');
    }

    createDetailRow(label, value) {
        if (!value) return '';
        return `<div style="display:grid;grid-template-columns:150px 1fr;gap:1rem;padding:0.75rem;background:var(--bg-light);border-radius:0.375rem;">
            <strong style="color:var(--text-dark);">${label}:</strong>
            <span style="color:var(--text-light);">${this.escapeHtml(value)}</span>
        </div>`;
    }

    closeModal() {
        document.getElementById('businessModal').classList.remove('active');
    }

    updatePagination() {
        const totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages || totalPages === 0;
        document.getElementById('directory').scrollIntoView({ behavior: 'smooth' });
    }

    switchView(view) {
        this.currentView = view;
        const grid = document.getElementById('businessGrid');
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        grid.classList.toggle('list-view', view === 'list');
    }

    updateStats() {
        const total = this.totalRecords;
        let cities = 0, segments = 0;

        if (this.metadata?.valueCount) {
            cities = this.metadata.valueCount.city?.counts ? Object.keys(this.metadata.valueCount.city.counts).length : 0;
            segments = this.metadata.valueCount.segment?.counts ? Object.keys(this.metadata.valueCount.segment.counts).length : 0;
        }

        this.animateNumber('totalBusinesses', total);
        this.animateNumber('totalCities', cities);
        this.animateNumber('totalSegments', segments);
        this.renderCharts();
    }

    animateNumber(elementId, target) {
        const element = document.getElementById(elementId);
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    }

    renderCharts() {
        this.renderChart('industryChart', this.businesses, 'segment');
        this.renderChart('geoChart', this.businesses, 'city');
    }

    renderChart(canvasId, data, field) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const counts = {};
        data.forEach(b => { if (b[field]) counts[b[field]] = (counts[b[field]] || 0) + 1; });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 300;
        const padding = 40;
        const barWidth = (width - padding * 2) / sorted.length;

        ctx.clearRect(0, 0, width, height);
        const maxValue = Math.max(...sorted.map(d => d[1]));

        sorted.forEach((item, index) => {
            const barHeight = (item[1] / maxValue) * (height - padding * 2);
            const x = padding + index * barWidth;
            const y = height - padding - barHeight;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x + 5, y, barWidth - 10, barHeight);

            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item[1], x + barWidth / 2, y - 5);

            ctx.save();
            ctx.translate(x + barWidth / 2, height - padding + 15);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(item[0].substring(0, 15), 0, 0);
            ctx.restore();
        });
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.classList.toggle('active', show);
    }

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => new BusinessApp());
