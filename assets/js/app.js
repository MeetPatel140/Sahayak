let userLocation = null;
let locationPermissionGranted = false;
let locationCheckAttempted = false;

function toggleMode(isHelperMode) {
    const newMode = isHelperMode ? 'helper' : 'customer';
    
    fetch('api/set_mode.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `mode=${newMode}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.reload();
        } else {
            alert("Could not switch mode. Please try again.");
            document.getElementById('mode-toggle').checked = !isHelperMode;
        }
    });
}

function postTask(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    if (userLocation) {
        formData.append('lat', userLocation.lat);
        formData.append('lng', userLocation.lng);
    }
    
    fetch('api/post_task.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Task posted! Finding helpers...', 'success');
            event.target.reset();
            loadNearbyHelpers();
        } else {
            showToast('Failed: ' + data.message, 'error');
        }
    });
}

function loadNearbyHelpers() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            userLocation = {lat, lng};
            locationPermissionGranted = true;
            hideLocationAlert();
            
            fetch(`api/get_helpers.php?lat=${lat}&lng=${lng}`)
            .then(response => response.json())
            .then(helpers => {
                const helpersList = document.getElementById('helpers-list');
                if (!helpersList) return;
                
                if (helpers.length === 0) {
                    helpersList.innerHTML = '<div class="text-gray-400 text-center py-4">No helpers nearby</div>';
                    return;
                }
                
                helpersList.innerHTML = '<h3 class="font-bold mb-3 text-gray-900">Available Helpers</h3>';
                helpers.forEach(helper => {
                    const helperDiv = document.createElement('div');
                    helperDiv.className = 'helper-card';
                    helperDiv.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="font-semibold text-gray-900">${helper.full_name}</div>
                                <div class="text-sm text-gray-500">${helper.skill_tags}</div>
                                <div class="text-sm text-teal-600 font-medium mt-1">₹${helper.base_rate}/hr • ${helper.distance.toFixed(1)}km</div>
                            </div>
                            <button onclick="contactHelper('${helper.full_name}')" class="bg-teal-600 text-white px-4 py-2 rounded-full text-sm">
                                Call
                            </button>
                        </div>
                    `;
                    helpersList.appendChild(helperDiv);
                });
                document.getElementById('helpers-panel').classList.remove('hidden');
            });
        }, function(error) {
            locationPermissionGranted = false;
            showLocationAlert();
        });
    } else {
        showLocationAlert();
    }
}

function loadNearbyTasks() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            locationPermissionGranted = true;
            hideLocationAlert();
            
            fetch(`api/get_tasks.php?lat=${lat}&lng=${lng}`)
            .then(response => response.json())
            .then(data => {
                const tasksList = document.getElementById('tasks-list');
                if (!tasksList) return;
                
                if (data.success && data.tasks.length > 0) {
                    tasksList.innerHTML = '';
                    data.tasks.forEach(task => {
                        const taskDiv = document.createElement('div');
                        taskDiv.className = 'task-card';
                        taskDiv.innerHTML = `
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <div class="font-bold text-lg text-teal-600">₹${task.agreed_price}</div>
                                        <div class="text-xs text-gray-400">${task.distance.toFixed(1)}km</div>
                                    </div>
                                    <div class="text-sm text-gray-600 mb-2">${task.description}</div>
                                    <div class="text-xs text-gray-400">by ${task.customer_name}</div>
                                </div>
                                <button onclick="acceptTask(${task.task_id})" class="bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-medium">
                                    Accept
                                </button>
                            </div>
                        `;
                        tasksList.appendChild(taskDiv);
                    });
                } else {
                    tasksList.innerHTML = '<div class="text-gray-400 text-center py-8"><i class="fas fa-search text-4xl mb-3 opacity-30"></i><div class="text-sm">No tasks nearby</div></div>';
                }
            });
        }, function(error) {
            locationPermissionGranted = false;
            showLocationAlert();
        });
    } else {
        showLocationAlert();
    }
}

function acceptTask(taskId) {
    fetch('api/accept_task.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `task_id=${taskId}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Task accepted!', 'success');
            loadNearbyTasks();
        } else {
            showToast('Failed: ' + data.message, 'error');
        }
    });
}

function updateLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            locationPermissionGranted = true;
            hideLocationAlert();
            
            fetch('api/update_location.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: `lat=${lat}&lng=${lng}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast('Location updated successfully! You are now visible to customers.', 'success');
                    loadNearbyTasks();
                } else {
                    showToast('Failed to update location: ' + data.message, 'error');
                }
            });
        }, function(error) {
            locationPermissionGranted = false;
            showLocationAlert();
        });
    } else {
        showLocationAlert();
    }
}

function loadMyTasks() {
    fetch('api/my_tasks.php')
    .then(response => response.json())
    .then(data => {
        const myTasksList = document.getElementById('my-tasks-list');
        if (!myTasksList) return;
        
        if (data.success && data.tasks.length > 0) {
            myTasksList.innerHTML = '';
            data.tasks.forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.className = 'task-card';
                
                const statusStyles = {
                    'pending': 'status-pending',
                    'accepted': 'status-accepted',
                    'in_progress': 'status-in_progress',
                    'completed': 'status-completed',
                    'cancelled': 'status-cancelled'
                };
                
                taskDiv.innerHTML = `
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="font-bold text-teal-600">₹${task.agreed_price}</span>
                            <span class="text-xs px-2 py-1 rounded-full ${statusStyles[task.status]}">${task.status}</span>
                        </div>
                        <div class="text-sm text-gray-600 mb-1">${task.description}</div>
                        <div class="text-xs text-gray-400">${new Date(task.created_at).toLocaleDateString()}</div>
                    </div>
                `;
                myTasksList.appendChild(taskDiv);
            });
        } else {
            myTasksList.innerHTML = '<div class="text-gray-400 text-center py-4">No tasks yet</div>';
        }
    });
}

function contactHelper(helperName) {
    alert(`Contact feature coming soon! Helper: ${helperName}`);
}

function showLocationAlert() {
    if (!locationCheckAttempted) {
        const alertDiv = document.getElementById('location-alert');
        if (alertDiv) {
            alertDiv.classList.remove('hidden');
        }
    }
}

function hideLocationAlert() {
    const alertDiv = document.getElementById('location-alert');
    if (alertDiv) {
        alertDiv.classList.add('hidden');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 text-sm font-medium ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-gray-900 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function checkLocationPermission() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                locationPermissionGranted = true;
                locationCheckAttempted = true;
                hideLocationAlert();
            },
            function(error) {
                locationPermissionGranted = false;
                locationCheckAttempted = true;
                if (error.code === error.PERMISSION_DENIED) {
                    showLocationAlert();
                }
            }
        );
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkLocationPermission();
    
    if (document.getElementById('customer-view')) {
        setTimeout(() => loadNearbyHelpers(), 1000);
    }
    
    if (document.getElementById('helper-view')) {
        loadNearbyTasks();
        updateLocation();
    }
    
    setInterval(() => {
        if (document.getElementById('helper-view')) {
            loadNearbyTasks();
        }
    }, 15000);
});