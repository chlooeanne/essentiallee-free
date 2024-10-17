function parseTime(timeString) {
    // Parse a time string like "10:00" to a Date object
    const today = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a Date object with the current date and parsed time
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
}

// Function to check if the pantry is open
function isPantryOpen(hours) {
    const now = new Date();
    const currentDay = now.toLocaleString('en-US', { weekday: 'long' });
  
    // Check the current day's hours
    if (hours[currentDay]) {
        const timeSlots = hours[currentDay];
        for (const slot of timeSlots) {
            if (slot === "Closed") {
                continue; // Skip closed entries
            }
            const [start, end] = slot.split('-').map(t => parseTime(t.trim()));
            // Compare current time with start and end times
            if (now >= start && now < end) {
                return true; // Pantry is open
            }
        }
    }
    return false; // Default to closed
}

// Store the original lat, lon, and zoom level
const originalLat = 46.311405;
const originalLon = -86.131208;
const originalZoom = 8;

// Initialize the map with the original settings
var map = L.map('map').setView([originalLat, originalLon], originalZoom);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const markers = {};  // Store markers by pantry ID

// Add checkbox to filter open pantries only
const filterCheckbox = document.createElement('input');
filterCheckbox.type = 'checkbox';
filterCheckbox.id = 'openNowFilter';
filterCheckbox.style.margin = '10px';
filterCheckbox.addEventListener('change', fetchAndDisplayPantries);

const label = document.createElement('label');
label.textContent = 'Show Open Locations Only';
label.setAttribute('for', 'openNowFilter');

document.getElementById('search').appendChild(filterCheckbox);
document.getElementById('search').appendChild(label);

// Fetch pantry data and add markers
function fetchAndDisplayPantries() {
    // Clear the existing markers and pantry info
    Object.values(markers).forEach(marker => marker.remove());
    document.getElementById('pantry-info').innerHTML = "";

    fetch('pantries.json')
      .then(response => response.json())
      .then(data => {
        const showOpenOnly = filterCheckbox.checked;
        data.forEach(pantry => {
            const openStatus = isPantryOpen(pantry.hours);

            // If "Show Open Pantries Only" is checked, filter closed pantries
            if (showOpenOnly && !openStatus) {
                return; // Skip closed pantries if filter is active
            }

            // Add markers and popups
            const marker = L.marker([pantry.latitude, pantry.longitude]).addTo(map);
            const pantryId = `pantry-${pantry.latitude}-${pantry.longitude}`;

            markers[pantryId] = marker;  // Store marker by ID

            const popupContent = `
              <div>
              ${pantry.website ? `<h3><strong><a href="${pantry.website}" target="_blank">${pantry.title}</a></strong></h3>` : `<h3><strong>${pantry.title}</strong></h3>`}
              <p>${pantry.address}</p>
              ${pantry.phone ? `<p>${pantry.phone}</p>` : ''}
              <a href="#${pantryId}" onclick="showDetailsAndHours('${pantryId}')">View Details</a><br>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${pantry.latitude},${pantry.longitude}" target="_blank">Get Directions</a>
              </div>
          `;
            marker.bindPopup(popupContent);

            // Create HTML for pantry info below the map
            const pantryInfo = `
              <div id="${pantryId}" class="pantry">
              ${pantry.website ? `<h3><strong><a href="${pantry.website}" target="_blank">${pantry.title}</a></strong></h3>` : `<h3><strong>${pantry.title}</strong></h3>`}
              <p>${pantry.address}</p>
              ${pantry.phone ? `<p>${pantry.phone}</p>` : ''}
              <p><strong>Status:</strong> ${openStatus ? 'Open' : 'Closed'}</p>
              <button onclick="viewOnMap('${pantryId}')">View on Map</button>
              ${pantry.hours ? 
              `<button class="hours-button" onclick="toggleHours(this)">Show Hours</button>
              <div class="hours-content" style="display:none;">
                  <ul>
                  ${Object.entries(pantry.hours).map(([day, hours]) => 
                      `<li>${day}: ${hours.join(', ')}</li>`).join('')}
                  </ul>
              </div>`
              : ''}
              </div>
              <hr>
              `;
          
            // Append the pantry info to the pantry-info div
            document.getElementById('pantry-info').innerHTML += pantryInfo;
        });
      })
      .catch(error => {
        console.error('Error loading pantry data:', error);
      });
}

// Call fetchAndDisplayPantries on page load
fetchAndDisplayPantries();

// Search functionality

document.getElementById('searchBtn').addEventListener('click', () => {
  const zipcode = document.getElementById('zipcode').value;
  if (zipcode) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${zipcode}&countrycodes=us`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.length > 0) {
          const lat = data[0].lat;
          const lon = data[0].lon;
          map.setView([lat, lon], 12);  // Zoom in on the location
        } else {
          alert("ZIP code not found. Please try again.");
        }
      })
      .catch(error => {
        console.error('Error fetching location:', error);
      });
  } else {
    alert("Please enter a ZIP code.");
  }

});

// Function to show details and automatically trigger the hours display
function showDetailsAndHours(pantryId) {
    const pantryElement = document.getElementById(pantryId);
    if (pantryElement) {
        pantryElement.scrollIntoView({ behavior: 'smooth' });

        const hoursButton = pantryElement.querySelector('.hours-button');
        if (hoursButton && hoursButton.textContent === "Show Hours") {
            toggleHours(hoursButton);
        }
    }
}

// Function to view the pantry on the map, open its popup, and scroll to the top of the map
function viewOnMap(pantryId) {
    const marker = markers[pantryId];
    if (marker) {
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
        map.setView(marker.getLatLng(), 14);
        marker.openPopup();
    }
}

// Function to toggle the display of hours
function toggleHours(button) {
    const hoursContent = button.nextElementSibling;
    if (hoursContent.style.display === "none") {
      hoursContent.style.display = "block";
      button.textContent = "Hide Hours";
    } else {
      hoursContent.style.display = "none";
      button.textContent = "Show Hours";
    }
}

// Reset map view to the original position and zoom
document.getElementById('resetBtn').addEventListener('click', () => {
  map.setView([originalLat, originalLon], originalZoom);
});

