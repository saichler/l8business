// Business Directory Application
class BusinessDirectory {
    constructor() {
        this.businesses = [];
        this.filteredBusinesses = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentView = 'grid';
        this.filters = {
            city: '',
            state: '',
            segment: '',
            search: ''
        };
        this.sortBy = 'name';

        this.init();
    }

    async init() {
        this.showLoading(true);
        await this.loadData();
        this.setupEventListeners();
        this.renderBusinesses();
        this.setupParallax();
        this.showLoading(false);
    }

    async loadData() {
        try {
            // Fetch data from backend API
            const response = await fetch('/api/businesses');
            const data = await response.json();

            this.businesses = data.list || [];
            this.stats = data.stats || {};

            this.filteredBusinesses = [...this.businesses];
            this.updateStats();
            this.populateFilters();
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to empty array if API fails
            this.businesses = [];
            this.filteredBusinesses = [];
        }
    }

    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', this.debounce((e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        }, 300));

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

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderBusinesses();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredBusinesses.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderBusinesses();
            }
        });

        // Modal
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('businessModal').addEventListener('click', (e) => {
            if (e.target.id === 'businessModal') {
                this.closeModal();
            }
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
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    setupParallax() {
        window.addEventListener('scroll', () => {
            const parallaxElements = document.querySelectorAll('.parallax-layer-back');
            parallaxElements.forEach(el => {
                const speed = 0.5;
                const yPos = -(window.scrollY * speed);
                el.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    populateFilters() {
        const cities = new Set();
        const states = new Set();
        const segments = new Set();

        this.businesses.forEach(business => {
            if (business.city) cities.add(business.city);
            if (business.state) states.add(business.state);
            if (business.segment) segments.add(business.segment);
        });

        this.populateSelect('cityFilter', Array.from(cities).sort());
        this.populateSelect('stateFilter', Array.from(states).sort());
        this.populateSelect('segmentFilter', Array.from(segments).sort());
    }

    populateSelect(id, options) {
        const select = document.getElementById(id);
        const placeholder = select.querySelector('option[value=""]');
        select.innerHTML = '';
        select.appendChild(placeholder);

        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        });
    }

    applyFilters() {
        this.filteredBusinesses = this.businesses.filter(business => {
            let matches = true;

            if (this.filters.city && business.city !== this.filters.city) {
                matches = false;
            }

            if (this.filters.state && business.state !== this.filters.state) {
                matches = false;
            }

            if (this.filters.segment && business.segment !== this.filters.segment) {
                matches = false;
            }

            if (this.filters.search) {
                const searchFields = [
                    business.name,
                    business.owner,
                    business.city,
                    business.state,
                    business.segment,
                    business.address
                ].map(f => (f || '').toLowerCase());

                matches = matches && searchFields.some(field =>
                    field.includes(this.filters.search)
                );
            }

            return matches;
        });

        this.sortBusinesses();
        this.currentPage = 1;
        this.renderBusinesses();
    }

    sortBusinesses() {
        this.filteredBusinesses.sort((a, b) => {
            let aVal = a[this.sortBy] || '';
            let bVal = b[this.sortBy] || '';

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
    }

    clearFilters() {
        this.filters = {
            city: '',
            state: '',
            segment: '',
            search: ''
        };

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
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageBusinesses = this.filteredBusinesses.slice(start, end);

        grid.innerHTML = '';

        if (pageBusinesses.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No businesses found matching your criteria.</p>';
            return;
        }

        pageBusinesses.forEach(business => {
            const card = this.createBusinessCard(business);
            grid.appendChild(card);
        });

        this.updatePagination();
    }

    createBusinessCard(business) {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.onclick = () => this.showBusinessDetails(business);

        card.innerHTML = `
            <div class="business-card-header">
                <div>
                    <div class="business-name">${this.escapeHtml(business.name || 'N/A')}</div>
                    ${business.owner ? `<div style="color: var(--text-light); font-size: 0.875rem;">Owner: ${this.escapeHtml(business.owner)}</div>` : ''}
                </div>
                ${business.segment ? `<span class="business-segment">${this.escapeHtml(business.segment)}</span>` : ''}
            </div>
            <div class="business-info">
                ${business.address ? `
                    <div class="business-info-item">
                        <span class="info-icon">📍</span>
                        <span>${this.escapeHtml(business.address)}</span>
                    </div>
                ` : ''}
                ${business.city || business.state || business.zip ? `
                    <div class="business-info-item">
                        <span class="info-icon">🌆</span>
                        <span>${[business.city, business.state, business.zip].filter(Boolean).map(v => this.escapeHtml(v)).join(', ')}</span>
                    </div>
                ` : ''}
                ${business.phone ? `
                    <div class="business-info-item">
                        <span class="info-icon">📞</span>
                        <span>${this.escapeHtml(business.phone)}</span>
                    </div>
                ` : ''}
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
            <h2 style="color: var(--primary-color); margin-bottom: 1.5rem;">${this.escapeHtml(business.name || 'N/A')}</h2>
            <div style="display: grid; gap: 1rem;">
                ${this.createDetailRow('Owner', business.owner)}
                ${this.createDetailRow('Address', business.address)}
                ${this.createDetailRow('City', business.city)}
                ${this.createDetailRow('State', business.state)}
                ${this.createDetailRow('ZIP Code', business.zip)}
                ${this.createDetailRow('Phone', business.phone)}
                ${this.createDetailRow('Industry', business.segment)}
                ${this.createDetailRow('Start Date', business.start_date)}
                ${this.createDetailRow('End Date', business.end_date)}
                ${this.createDetailRow('Certificate Number', business.certificate_number)}
                ${this.createDetailRow('Tax ID', business.tax_id)}
                ${this.createDetailRow('Source', business.source)}
            </div>
        `;

        modal.classList.add('active');
    }

    createDetailRow(label, value) {
        if (!value) return '';
        return `
            <div style="display: grid; grid-template-columns: 150px 1fr; gap: 1rem; padding: 0.75rem; background: var(--bg-light); border-radius: 0.375rem;">
                <strong style="color: var(--text-dark);">${label}:</strong>
                <span style="color: var(--text-light);">${this.escapeHtml(value)}</span>
            </div>
        `;
    }

    closeModal() {
        document.getElementById('businessModal').classList.remove('active');
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredBusinesses.length / this.itemsPerPage);

        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('totalPages').textContent = totalPages;

        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages || totalPages === 0;

        // Scroll to top of grid
        document.getElementById('directory').scrollIntoView({ behavior: 'smooth' });
    }

    switchView(view) {
        this.currentView = view;
        const grid = document.getElementById('businessGrid');

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        if (view === 'list') {
            grid.classList.add('list-view');
        } else {
            grid.classList.remove('list-view');
        }
    }

    updateStats() {
        const totalBusinesses = this.businesses.length;
        const cities = new Set(this.businesses.map(b => b.city).filter(Boolean));
        const segments = new Set(this.businesses.map(b => b.segment).filter(Boolean));

        this.animateNumber('totalBusinesses', totalBusinesses);
        this.animateNumber('totalCities', cities.size);
        this.animateNumber('totalSegments', segments.size);

        // Update charts if available
        this.renderCharts();
    }

    animateNumber(elementId, target) {
        const element = document.getElementById(elementId);
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

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
        // Simple bar chart for industries
        this.renderIndustryChart();
        this.renderGeoChart();
    }

    renderIndustryChart() {
        const canvas = document.getElementById('industryChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const segmentCounts = {};

        this.businesses.forEach(b => {
            if (b.segment) {
                segmentCounts[b.segment] = (segmentCounts[b.segment] || 0) + 1;
            }
        });

        const sortedSegments = Object.entries(segmentCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        this.drawBarChart(ctx, canvas, sortedSegments, 'Industry Distribution');
    }

    renderGeoChart() {
        const canvas = document.getElementById('geoChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const cityCounts = {};

        this.businesses.forEach(b => {
            if (b.city) {
                cityCounts[b.city] = (cityCounts[b.city] || 0) + 1;
            }
        });

        const sortedCities = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        this.drawBarChart(ctx, canvas, sortedCities, 'Top Cities');
    }

    drawBarChart(ctx, canvas, data, title) {
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 300;
        const padding = 40;
        const barWidth = (width - padding * 2) / data.length;

        ctx.clearRect(0, 0, width, height);

        const maxValue = Math.max(...data.map(d => d[1]));

        // Draw bars
        data.forEach((item, index) => {
            const barHeight = (item[1] / maxValue) * (height - padding * 2);
            const x = padding + index * barWidth;
            const y = height - padding - barHeight;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x + 5, y, barWidth - 10, barHeight);

            // Draw labels
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';

            // Value on top of bar
            ctx.fillText(item[1], x + barWidth / 2, y - 5);

            // Label below
            ctx.save();
            ctx.translate(x + barWidth / 2, height - padding + 15);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(item[0].substring(0, 15), 0, 0);
            ctx.restore();
        });
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.add('active');
        } else {
            spinner.classList.remove('active');
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BusinessDirectory();
});
