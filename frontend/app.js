// app.js - Connected to Backend

const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Loading Screen logic (2 seconds)
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }, 2000);

    updateDateTime();
    setInterval(updateDateTime, 1000);

    initNavigation();
    loadDashboardData();
    loadChildrenData();
    loadResourcesData();
    loadStaffData();
    loadDonorsData();
    loadDonationsData();
    loadAllocationsData();
    initModals();
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
                                <button class="btn-icon" title="Edit" onclick='openEditModal("child-modal", "child-form", {id: ${child.id}, name: ${JSON.stringify(child.name)}, dob: "${child.dob}", gender: "${child.gender}", medical: ${JSON.stringify(child.medical || "")}})'><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon delete" title="Delete" onclick="handleDelete('/children', ${child.id}, loadChildrenData)"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
            const childSelect = document.getElementById('allocation-child-select');
            if (childSelect) {
                childSelect.innerHTML = '<option value="">Select a Child</option>' + children.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
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
                                <button class="btn-icon" title="Edit" onclick='openEditModal("resource-modal", "resource-form", {id: ${res.id}, type: ${JSON.stringify(res.type)}, qty: ${res.qty}})'><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon delete" title="Delete" onclick="handleDelete('/resources', ${res.id}, loadResourcesData)"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
            const resourceSelect = document.getElementById('allocation-resource-select');
            if (resourceSelect) {
                resourceSelect.innerHTML = '<option value="">Select a Resource</option>' + resources.map(r => `<option value="${r.id}">${r.type}</option>`).join('');
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
                                <button class="btn-icon" title="Edit" onclick='openEditModal("staff-modal", "staff-form", {id: ${s.id}, name: ${JSON.stringify(s.name)}, role: ${JSON.stringify(s.role)}, contact: ${JSON.stringify(s.contact)}})'><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon delete" title="Delete" onclick="handleDelete('/staff', ${s.id}, loadStaffData)"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
            const staffSelect = document.getElementById('allocation-staff-select');
            if (staffSelect) {
                staffSelect.innerHTML = '<option value="">Select Staff</option>' + staff.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
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
                                <button class="btn-icon" title="Edit" onclick='openEditModal("donor-modal", "donor-form", {id: ${d.id}, name: ${JSON.stringify(d.name)}, contact: ${JSON.stringify(d.contact || "")}, email: ${JSON.stringify(d.email || "")}})'><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon delete" title="Delete" onclick="handleDelete('/donors', ${d.id}, loadDonorsData)"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
            const donorSelect = document.getElementById('donation-donor-select');
            if (donorSelect) {
                donorSelect.innerHTML = '<option value="">Select a Donor</option>' + donors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
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
                        <td>
                            <div class="action-btns">
                                <button class="btn-icon" title="Edit" onclick='openEditModal("allocation-modal", "allocation-form", {id: ${a.id}, child_id: ${a.child_id}, resource_id: ${a.resource_id}, qty: ${a.qty}, staff_id: ${a.staff_id}})'><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon delete" title="Delete" onclick="handleDelete('/allocations', ${a.id}, loadAllocationsData)"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading allocations data:', error);
    }
}

function initModals() {
    const modalMap = {
        'btn-add-child': 'child-modal',
        'btn-add-resource': 'resource-modal',
        'btn-add-staff': 'staff-modal',
        'btn-add-donor': 'donor-modal',
        'btn-record-donation': 'donation-modal',
        'btn-new-allocation': 'allocation-modal'
    };

    // Open Modals
    for (const [btnId, modalId] of Object.entries(modalMap)) {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        if (btn && modal) {
            btn.addEventListener('click', () => {
                modal.classList.add('active');
            });
        }
    }

    // Close Modals
    document.querySelectorAll('.close-btn, .close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const overlay = e.target.closest('.modal-overlay');
            if (overlay) {
                overlay.classList.remove('active');
                const form = overlay.querySelector('form');
                if(form) {
                    form.reset();
                    const idInput = form.querySelector('input[name="id"]');
                    if(idInput) idInput.remove();
                }
            }
        });
    });

    // Form Submissions
    setupFormSubmit('child-form', '/children', loadChildrenData);
    setupFormSubmit('resource-form', '/resources', loadResourcesData);
    setupFormSubmit('staff-form', '/staff', loadStaffData);
    setupFormSubmit('donor-form', '/donors', loadDonorsData);
    setupFormSubmit('donation-form', '/donations', loadDonationsData);
    setupFormSubmit('allocation-form', '/allocations', loadAllocationsData);
}

function setupFormSubmit(formId, endpoint, reloadCallback) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const isEdit = !!data.id;
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${API_BASE_URL}${endpoint}/${data.id}` : `${API_BASE_URL}${endpoint}`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const modal = form.closest('.modal-overlay');
                if (modal) modal.classList.remove('active');
                form.reset();
                if(form.querySelector('input[name="id"]')) {
                    form.querySelector('input[name="id"]').remove();
                }
                reloadCallback();
                loadDashboardData(); // Refresh dashboard stats
            } else {
                const resData = await response.json();
                alert('Error: ' + (resData.error || 'Failed to save data'));
            }
        } catch (err) {
            console.error('Error submitting form:', err);
            alert('Network error. Failed to save data.');
        }
    });
}

async function handleDelete(endpoint, id, reloadCallback) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            reloadCallback();
            loadDashboardData();
        } else {
            const data = await res.json();
            alert('Cannot delete: ' + (data.error || 'Foreign key constraint or unknown error'));
        }
    } catch (err) {
        console.error(err);
        alert('Network error during deletion');
    }
}

function openEditModal(modalId, formId, data) {
    const modal = document.getElementById(modalId);
    const form = document.getElementById(formId);
    if (!modal || !form) return;
    
    // Reset form
    form.reset();
    
    // Set fields
    Object.keys(data).forEach(key => {
        const input = form.elements[key];
        if (input) input.value = data[key];
    });
    
    // Add hidden ID field
    let idInput = form.querySelector('input[name="id"]');
    if (!idInput) {
        idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        form.appendChild(idInput);
    }
    idInput.value = data.id;
    
    modal.classList.add('active');
}

function updateDateTime() {
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    if(!timeEl || !dateEl) return;

    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
