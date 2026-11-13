/**
 * Gram Panchayat Nangwada - Interactive Application Script
 * Candidate: Chainaram Loth (चैनाराम लोठ)
 * Server Port: 1234
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initWorksFilterAndSearch();
    initComplaintSystem();
    initBackToTop();
    checkBackendHealth();
});

/* ==========================================================================
   1. NAVIGATION & MOBILE DRAWER
   ========================================================================== */
function initNavigation() {
    const header = document.getElementById('header');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');
    const drawerLinks = document.querySelectorAll('.drawer-link');
    const navLinks = document.querySelectorAll('.nav-link');

    // Sticky Header on Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        highlightActiveNav();
    });

    // Toggle Mobile Drawer
    function openDrawer() {
        mobileDrawer.classList.add('active');
        drawerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        mobileDrawer.classList.remove('active');
        drawerOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

    drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeDrawer();
        });
    });

    // Active Link Highlighting based on scroll position
    function highlightActiveNav() {
        const sections = document.querySelectorAll('section[id], header[id]');
        const scrollPos = window.scrollY + 120;

        sections.forEach(sec => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            const id = sec.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

/* ==========================================================================
   2. TOP 20 DEVELOPMENT WORKS FILTER & SEARCH
   ========================================================================== */
function initWorksFilterAndSearch() {
    const searchInput = document.getElementById('workSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const filterPills = document.querySelectorAll('.filter-pill');
    const workCards = document.querySelectorAll('.work-card');
    const noResults = document.getElementById('noResultsNotice');

    let currentCategory = 'all';
    let currentSearchTerm = '';

    function applyFilterAndSearch() {
        let visibleCount = 0;

        workCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            const cardTitle = card.querySelector('.work-title').textContent.toLowerCase();
            const cardDesc = card.querySelector('.work-desc').textContent.toLowerCase();
            const cardNumber = card.getAttribute('data-number');

            const matchesCategory = (currentCategory === 'all' || cardCategory === currentCategory);
            const matchesSearch = !currentSearchTerm || 
                cardTitle.includes(currentSearchTerm) || 
                cardDesc.includes(currentSearchTerm) ||
                cardNumber === currentSearchTerm;

            if (matchesCategory && matchesSearch) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (visibleCount === 0) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
    }

    // Category Click Handlers
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.getAttribute('data-category');
            applyFilterAndSearch();
        });
    });

    // Search Input Handler
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.trim().toLowerCase();
            if (currentSearchTerm.length > 0) {
                clearBtn.style.display = 'block';
            } else {
                clearBtn.style.display = 'none';
            }
            applyFilterAndSearch();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearchTerm = '';
            clearBtn.style.display = 'none';
            applyFilterAndSearch();
            searchInput.focus();
        });
    }
}

/* ==========================================================================
   3. CITIZEN COMPLAINT & TRACKER SYSTEM
   ========================================================================== */
function initComplaintSystem() {
    const complaintForm = document.getElementById('complaintForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitSpinner = document.getElementById('submitSpinner');
    const successBox = document.getElementById('complaintSuccessMsg');
    const generatedTicketId = document.getElementById('generatedTicketId');
    const photoInput = document.getElementById('complaintPhoto');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const refreshBtn = document.getElementById('refreshComplaintsBtn');
    const trackerSearchInput = document.getElementById('trackerSearchInput');
    const complaintsListContainer = document.getElementById('complaintsListContainer');

    let base64Photo = '';

    // Handle File Input Change
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileNameDisplay.textContent = `चुनी गई फोटो: ${file.name} (${Math.round(file.size / 1024)} KB)`;
                const reader = new FileReader();
                reader.onload = function(event) {
                    base64Photo = event.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                fileNameDisplay.textContent = 'फोटो चुनें या यहाँ खींच कर लाएँ (JPG, PNG)';
                base64Photo = '';
            }
        });
    }

    // Form Submit Handler
    if (complaintForm) {
        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate inputs
            const name = document.getElementById('citizenName').value.trim();
            const mobile = document.getElementById('citizenMobile').value.trim();
            const ward = document.getElementById('citizenWard').value;
            const category = document.getElementById('complaintCategory').value;
            const description = document.getElementById('complaintDesc').value.trim();

            let isValid = true;

            // Name validation
            if (!name || name.length < 2) {
                showError('nameError', 'कृपया नागरिक का पूरा नाम दर्ज करें।');
                isValid = false;
            } else {
                clearError('nameError');
            }

            // Mobile validation (10 digits)
            const mobileRegex = /^[6-9]\d{9}$/;
            if (!mobileRegex.test(mobile)) {
                showError('mobileError', 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
                isValid = false;
            } else {
                clearError('mobileError');
            }

            // Ward validation
            if (!ward) {
                showError('wardError', 'कृपया अपने वार्ड का चयन करें।');
                isValid = false;
            } else {
                clearError('wardError');
            }

            // Category validation
            if (!category) {
                showError('catError', 'कृपया समस्या की श्रेणी चुनें।');
                isValid = false;
            } else {
                clearError('catError');
            }

            // Description validation
            if (!description || description.length < 8) {
                showError('descError', 'कृपया समस्या का कम से कम 8-10 शब्दों में विवरण लिखें।');
                isValid = false;
            } else {
                clearError('descError');
            }

            if (!isValid) return;

            // Submit Process
            submitBtn.style.display = 'none';
            submitSpinner.style.display = 'inline-flex';

            const complaintData = {
                name,
                mobile,
                ward,
                category,
                description,
                photo: base64Photo
            };

            try {
                // Call real backend API on port 1234
                const response = await fetch('/api/complaints', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(complaintData)
                });

                if (response.ok) {
                    const result = await response.json();
                    handleSubmissionSuccess(result.trackingId || `NGW-2026-${Math.floor(1000 + Math.random() * 9000)}`);
                } else {
                    throw new Error('Server returned non-200');
                }
            } catch (err) {
                console.warn('Backend API submission note:', err);
                // Fallback to local storage persistence
                const localId = `NGW-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                const localEntry = {
                    id: localId,
                    name: complaintData.name,
                    mobile: complaintData.mobile.replace(/(\d{5})\d{5}/, '$1XXXXX'),
                    ward: complaintData.ward,
                    category: complaintData.category,
                    description: complaintData.description,
                    date: new Date().toLocaleString('hi-IN'),
                    status: 'दर्ज की गई (समीक्षाधीन)',
                    statusColor: 'blue'
                };

                let savedList = [];
                try {
                    const stored = localStorage.getItem('ngw_complaints');
                    if (stored) savedList = JSON.parse(stored);
                } catch(e) {}
                savedList.unshift(localEntry);
                localStorage.setItem('ngw_complaints', JSON.stringify(savedList));

                handleSubmissionSuccess(localId);
            } finally {
                submitBtn.style.display = 'inline-flex';
                submitSpinner.style.display = 'none';
            }
        });
    }

    function handleSubmissionSuccess(ticketId) {
        generatedTicketId.textContent = ticketId;
        successBox.style.display = 'block';
        complaintForm.reset();
        fileNameDisplay.textContent = 'फोटो चुनें या यहाँ खींच कर लाएँ (JPG, PNG)';
        base64Photo = '';

        // Refresh complaints list
        loadComplaints();

        // Scroll into view
        successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showError(elementId, msg) {
        const errEl = document.getElementById(elementId);
        if (errEl) {
            errEl.textContent = msg;
            errEl.style.display = 'block';
        }
    }

    function clearError(elementId) {
        const errEl = document.getElementById(elementId);
        if (errEl) {
            errEl.textContent = '';
            errEl.style.display = 'none';
        }
    }

    // Load Complaints List
    async function loadComplaints() {
        complaintsListContainer.innerHTML = '<div class="complaint-card-skeleton"><i class="fa-solid fa-spinner fa-spin"></i> समस्याएँ लोड हो रही हैं...</div>';
        
        let complaints = [];

        try {
            const res = await fetch('/api/complaints');
            if (res.ok) {
                complaints = await res.json();
            } else {
                throw new Error('API fetch failed');
            }
        } catch (e) {
            // Fallback to local storage or fallback defaults
            try {
                const stored = localStorage.getItem('ngw_complaints');
                if (stored) complaints = JSON.parse(stored);
            } catch(err) {}

            if (!complaints || complaints.length === 0) {
                complaints = [
                    {
                        id: "NGW-2026-1001",
                        name: "रामेश्वर लाल शर्मा",
                        ward: "वार्ड नं. 03",
                        category: "पानी",
                        description: "हमारे मोहल्ले में पानी की पाइपलाइन में लीकेज है जिससे पीने का पानी सड़क पर बह रहा है।",
                        date: "2026-11-10",
                        status: "कार्रवाई प्रगति पर",
                        statusColor: "orange"
                    },
                    {
                        id: "NGW-2026-1002",
                        name: "सुरेश कुमार जाट",
                        ward: "वार्ड नं. 07",
                        category: "सड़क",
                        description: "गाँव के मुख्य स्कूल के पास सड़क में बड़े गड्ढे हैं, मरम्मत आवश्यक है।",
                        date: "2026-11-11",
                        status: "प्राथमिकता सूची में दर्ज",
                        statusColor: "blue"
                    },
                    {
                        id: "NGW-2026-1003",
                        name: "श्रीमती संजू देवी",
                        ward: "वार्ड नं. 11",
                        category: "पेंशन",
                        description: "बुजुर्गों की पेंशन पोर्टल पर तकनीकी कारण से रुकी हुई है, कृपया शिविर लगाकर चालू करवाएँ।",
                        date: "2026-11-12",
                        status: "समाधान प्रक्रिया में",
                        statusColor: "green"
                    }
                ];
            }
        }

        renderComplaintsList(complaints);
    }

    function renderComplaintsList(list) {
        if (!list || list.length === 0) {
            complaintsListContainer.innerHTML = '<p class="text-center" style="padding: 20px; color: #6b7280;">वर्तमान में कोई दर्ज समस्या नहीं है।</p>';
            return;
        }

        const filterVal = trackerSearchInput ? trackerSearchInput.value.trim().toLowerCase() : '';

        const filtered = list.filter(item => {
            if (!filterVal) return true;
            return (item.id && item.id.toLowerCase().includes(filterVal)) ||
                   (item.category && item.category.toLowerCase().includes(filterVal)) ||
                   (item.ward && item.ward.toLowerCase().includes(filterVal)) ||
                   (item.name && item.name.toLowerCase().includes(filterVal));
        });

        if (filtered.length === 0) {
            complaintsListContainer.innerHTML = '<p class="text-center" style="padding: 20px; color: #6b7280;">कोई परिणाम नहीं मिला।</p>';
            return;
        }

        let html = '';
        filtered.forEach(item => {
            const colorClass = item.statusColor || 'blue';
            html += `
                <div class="complaint-item-card">
                    <div class="item-top">
                        <span class="item-id"><i class="fa-solid fa-ticket"></i> ${item.id}</span>
                        <span class="item-cat">${item.category}</span>
                    </div>
                    <p class="item-desc">${escapeHtml(item.description)}</p>
                    <div class="item-footer">
                        <span><i class="fa-solid fa-map-pin"></i> ${escapeHtml(item.ward)} | ${escapeHtml(item.name || 'नागरिक')}</span>
                        <span class="item-status ${colorClass}">${escapeHtml(item.status || 'दर्ज')}</span>
                    </div>
                </div>
            `;
        });

        complaintsListContainer.innerHTML = html;
    }

    // Refresh button event
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.classList.add('fa-spin');
            loadComplaints().then(() => {
                setTimeout(() => refreshBtn.classList.remove('fa-spin'), 600);
            });
        });
    }

    // Tracker search event
    if (trackerSearchInput) {
        trackerSearchInput.addEventListener('input', () => {
            loadComplaints();
        });
    }

    // Initial load
    loadComplaints();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m];
    });
}

/* ==========================================================================
   4. BACKEND HEALTH CHECK BANNER
   ========================================================================== */
async function checkBackendHealth() {
    const bannerText = document.getElementById('backendStatusText');
    const indicator = document.querySelector('.status-indicator');

    try {
        const res = await fetch('/api/complaints', { method: 'GET' });
        if (res.ok) {
            if (bannerText) bannerText.textContent = '🟢 लाइव सर्वर डेटाबेस कनेक्टेड (Localhost Port 1234)';
            if (indicator) indicator.className = 'status-indicator live';
        } else {
            throw new Error('Not running via server');
        }
    } catch(e) {
        if (bannerText) {
            bannerText.textContent = '🟡 डेमो मोड (स्थानीय स्टोरेज) — वास्तविक सर्वर के लिए start-server.bat चलाएँ';
        }
        if (indicator) {
            indicator.className = 'status-indicator demo';
        }
    }
}

/* ==========================================================================
   5. BACK TO TOP BUTTON
   ========================================================================== */
function initBackToTop() {
    const backBtn = document.getElementById('backToTopBtn');
    if (!backBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 350) {
            backBtn.classList.add('show');
        } else {
            backBtn.classList.remove('show');
        }
    });

    backBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
