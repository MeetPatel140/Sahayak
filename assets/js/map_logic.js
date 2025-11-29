var map;
var userMarker;
var helperMarkers = [];

function initializeMap() {
    if (!document.getElementById('map')) return;
    
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    // Get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            map.setView([lat, lng], 14);
            
            userMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: '<div style="background: #0D9488; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"></div>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            }).addTo(map);
            
            loadHelpersOnMap(lat, lng);
            
        }, function(error) {
            console.error('Geolocation error:', error);
        });
    }
}

function loadHelpersOnMap(userLat, userLng) {
    fetch(`api/get_helpers.php?lat=${userLat}&lng=${userLng}`)
    .then(response => response.json())
    .then(helpers => {
        // Clear existing helper markers
        helperMarkers.forEach(marker => map.removeLayer(marker));
        helperMarkers = [];
        
        // Add helper markers
        helpers.forEach((helper, index) => {
            // Generate random nearby coordinates for demo (in real app, use actual helper locations)
            const helperLat = userLat + (Math.random() - 0.5) * 0.02;
            const helperLng = userLng + (Math.random() - 0.5) * 0.02;
            
            const helperMarker = L.marker([helperLat, helperLng], {
                icon: L.divIcon({
                    className: 'helper-marker',
                    html: '<div style="background: #0D9488; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3);"></div>',
                    iconSize: [18, 18],
                    iconAnchor: [9, 9]
                })
            }).addTo(map);
            
            helperMarker.bindPopup(`
                <div style="padding: 8px; min-width: 150px;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${helper.full_name}</div>
                    <div style="font-size: 12px; color: #6B7280; margin-bottom: 4px;">${helper.skill_tags}</div>
                    <div style="font-size: 14px; color: #0D9488; font-weight: 600;">₹${helper.base_rate}/hr • ${helper.distance.toFixed(1)}km</div>
                </div>
            `);
            
            helperMarkers.push(helperMarker);
        });
    })
    .catch(error => {
        console.error('Error loading helpers on map:', error);
    });
}

function addHelperMarker(lat, lng, name, skills, rate) {
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'helper-marker',
            html: '<div style="background: #0D9488; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3);"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        })
    }).addTo(map);
    
    marker.bindPopup(`
        <div style="padding: 8px;">
            <div style="font-weight: 600;">${name}</div>
            <div style="font-size: 12px; color: #6B7280;">${skills}</div>
            <div style="color: #0D9488; font-weight: 600;">₹${rate}/hr</div>
        </div>
    `);
    
    return marker;
}

function updateUserLocation(lat, lng) {
    if (userMarker) {
        userMarker.setLatLng([lat, lng]);
        map.setView([lat, lng], 14);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeMap, 300);
});