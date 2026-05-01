// app.js - Connected to Backend

const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadDashboardData();
    loadChildrenData();
    loadResourcesData();
    loadStaffData();
    loadDonorsData();
    loadDonationsData();
    loadAllocationsData();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(sec => sec.classList.add('hidden'));
            
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if(targetSection) {
                targetSection.classList.remove('hidden');
            }
        });
    });
}

async function loadDashboardData() {
    try {
        // Fetch Stats
        const statsRes = await fetch(`${API_BASE_URL}/dashboard/stats`);
        if(statsRes.ok) {
            const stats = await statsRes.json();
            // Update UI manually based on the fetched stats
            // We select by nth-child to match our HTML structure
            const statValues = document.querySelectorAll('.stat-value');
            if(statValues.length >= 4) {
                statValues[0].textContent = stats.totalChildren;
                statValues[1].textContent = `₹${parseFloat(stats.totalDonations).toLocaleString('en-IN')}`;
                statValues[2].textContent = stats.resourcesAvailable;
                statValues[3].textContent = stats.allocationsToday;
            }
        }

        // Fetch Recent Donations
        const donationsRes = await fetch(`${API_BASE_URL}/donations/recent`);
        if(donationsRes.ok) {
            const donations = await donationsRes.json();
            const donationsBody = document.getElementById('recent-donations-body');
            if(donationsBody) {
                donationsBody.innerHTML = donations.map(donation => `
                    <tr>
                        <td><strong>${donation.donor}</strong></td>
                        <td>₹${parseFloat(donation.amount).toLocaleString('en-IN')}</td>
                        <td>${donation.date}</td>
                        <td><span class="status-badge status-success">${donation.status}</span></td>
                    </tr>
                `).join('');
            }
        }

        // Fetch Low Resources Alert
        const lowResRes = await fetch(`${API_BASE_URL}/resources/low`);
        if(lowResRes.ok) {
            const lowResources = await lowResRes.json();
            const resourcesList = document.getElementById('low-resources-list');
            if(resourcesList) {
                if (lowResources.length === 0) {
                    resourcesList.innerHTML = '<li class="resource-item"><p style="color:var(--success)">All resources are well stocked!</p></li>';
                } else {
                    resourcesList.innerHTML = lowResources.map(res => `
                        <li class="resource-item">
                            <div class="resource-info">
                                <h4>${res.type}</h4>
                                <p>Needs restock soon</p>
                            </div>
                            <div class="resource-qty">${res.qty} units</div>
                        </li>
                    `).join('');
                }
            }
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadChildrenData() {
    try {
        const res = await fetch(`${API_BASE_URL}/children`);
        if(res.ok) {
            const children = await res.json();
            const tbody = document.getElementById('children-body');
            if(tbody) {
                tbody.innerHTML = children.map(child => `
                    <tr>
                        <td>#${child.id.toString().padStart(3, '0')}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(child.name)}&background=random&color=fff" alt="${child.name}" style="width: 32px; height: 32px; border-radius: 50%;">
                                <strong>${child.name}</strong>
                            </div>
                        </td>
                        <td>${child.dob}</td>
                        <td>${child.gender}</td>
                        <td>${child.medical}</td>
                        <td>
                            <div class="action-btns">
                                <button class="btn-icon" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading children data:', error);
    }
}

async function loadResourcesData() {
    try {
        const res = await fetch(`${API_BASE_URL}/resources`);
        if(res.ok) {
            const resources = await res.json();
            const tbody = document.getElementById('resources-body');
            if(tbody) {
                tbody.innerHTML = resources.map(res => `
                    <tr>
                        <td>#${res.id.toString().padStart(3, '0')}</td>
                        <td><strong>${res.type}</strong></td>
                        <td>${res.qty}</td>
                        <td>
                            <span class="status-badge ${res.qty < 100 ? 'status-warning' : 'status-success'}">
                                ${res.qty < 100 ? 'Low Stock' : 'In Stock'}
                            </span>
                        </td>
                        <td>
                            <div class="action-btns">
                                <button class="btn-icon" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading resources data:', error);
    }
}

async function loadStaffData() {
    try {
        const res = await fetch(`${API_BASE_URL}/staff`);
        if(res.ok) {
            const staff = await res.json();
            const tbody = document.getElementById('staff-body');
            if(tbody) {
                tbody.innerHTML = staff.map(s => `
                    <tr>
                        <td>#${s.id.toString().padStart(3, '0')}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random&color=fff" alt="${s.name}" style="width: 32px; height: 32px; border-radius: 50%;">
                                <strong>${s.name}</strong>
                            </div>
                        </td>
                        <td>${s.role}</td>
                        <td>${s.contact}</td>
                        <td>
                            <div class="action-btns">
                                <button class="btn-icon" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading staff data:', error);
    }
}

async function loadDonorsData() {
    try {
        const res = await fetch(`${API_BASE_URL}/donors`);
        if(res.ok) {
            const donors = await res.json();
            const tbody = document.getElementById('donors-body');
            if(tbody) {
                tbody.innerHTML = donors.map(d => `
                    <tr>
                        <td>#${d.id.toString().padStart(3, '0')}</td>
                        <td><strong>${d.name}</strong></td>
                        <td>${d.contact || 'N/A'}</td>
                        <td>${d.email || 'N/A'}</td>
                        <td>
                            <div class="action-btns">
                                <button class="btn-icon" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading donors data:', error);
    }
}

async function loadDonationsData() {
    try {
        const res = await fetch(`${API_BASE_URL}/donations`);
        if(res.ok) {
            const donations = await res.json();
            const tbody = document.getElementById('donations-body');
            if(tbody) {
                tbody.innerHTML = donations.map(d => `
                    <tr>
                        <td>#${d.id.toString().padStart(3, '0')}</td>
                        <td><strong>${d.donor}</strong></td>
                        <td>₹${parseFloat(d.amount).toLocaleString('en-IN')}</td>
                        <td>${d.date}</td>
                        <td><span class="status-badge status-success">Completed</span></td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading donations data:', error);
    }
}

async function loadAllocationsData() {
    try {
        const res = await fetch(`${API_BASE_URL}/allocations`);
        if(res.ok) {
            const allocations = await res.json();
            const tbody = document.getElementById('allocations-body');
            if(tbody) {
                tbody.innerHTML = allocations.map(a => `
                    <tr>
                        <td>#${a.id.toString().padStart(3, '0')}</td>
                        <td><strong>${a.child}</strong></td>
                        <td>${a.resource}</td>
                        <td>${a.qty}</td>
                        <td>${a.date}</td>
                        <td>${a.staff}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading allocations data:', error);
    }
}
