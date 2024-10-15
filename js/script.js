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
                return 'Open';
            }
        }
        return 'Closed'; // If no slots matched, return Closed
    }
    return 'Closed'; // Default to closed if the day has no hours
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

// Fetch pantry data and add markers
fetch('pantries.json')
  .then(response => response.json())
  .then(data => {
    data.forEach(pantry => {
      // Add markers and popups
        const marker = L.marker([pantry.latitude, pantry.longitude]).addTo(map);
        const pantryId = `pantry-${pantry.latitude}-${pantry.longitude}`;

        markers[pantryId] = marker;  // Store marker by ID

        const openStatus = isPantryOpen(pantry.hours);

        const popupContent = `
            <div>
            ${pantry.website ? `<h3><strong><a href="${pantry.website}" target="_blank">${pantry.title}</a></strong></h3>` : `<h3><strong>${pantry.title}</strong></h3>`}
            <p>${pantry.address}</p>
            ${pantry.phone ? `<p>${pantry.phone}</p>` : ''}
            <a href="#${pantryId}" onclick="showDetailsAndHours('${pantryId}')">View Details</a>
            </div>
        `;
      marker.bindPopup(popupContent);

      // Create HTML for pantry info below the map
      const pantryInfo = `
        <div id="${pantryId}" class="pantry">
        ${pantry.website ? `<h3><strong><a href="${pantry.website}" target="_blank">${pantry.title}</a></strong></h3>` : `<h3><strong>${pantry.title}</strong></h3>`}
        <p>${pantry.address}</p>
        ${pantry.phone ? `<p>${pantry.phone}</p>` : ''}
        ${pantry.hours ? `<p><strong>Status:</strong> ${openStatus}</p>` : ''}
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

// Function to show details and automatically trigger the hours display
function showDetailsAndHours(pantryId) {
    // Scroll the user to the corresponding pantry section in the pantry-info div
    const pantryElement = document.getElementById(pantryId);
    if (pantryElement) {
        pantryElement.scrollIntoView({ behavior: 'smooth' });

        // Find the "Show Hours" button and simulate a click if it's not already showing hours
        const hoursButton = pantryElement.querySelector('.hours-button');
        if (hoursButton && hoursButton.textContent === "Show Hours") {
            toggleHours(hoursButton);
        }
    }
}

// Function to view the pantry on the map, open its popup, and scroll to the top of the map
function viewOnMap(pantryId) {
    const marker = markers[pantryId];  // Get the marker by pantry ID
    if (marker) {
        // Scroll the user to the map container
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });

        // Center the map on the marker
        map.setView(marker.getLatLng(), 14);

        // Open the popup for the marker
        marker.openPopup();
    }
}

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

// Reset map view to the original position and zoom
document.getElementById('resetBtn').addEventListener('click', () => {
  map.setView([originalLat, originalLon], originalZoom);  // Reset to the initial view
});


// Function to toggle the display of hours
function toggleHours(button) {
    const hoursContent = button.nextElementSibling; // Select the next sibling (the hours content)
    if (hoursContent.style.display === "none") {
      hoursContent.style.display = "block"; // Show hours
      button.textContent = "Hide Hours"; // Change button text
    } else {
      hoursContent.style.display = "none"; // Hide hours
      button.textContent = "Show Hours"; // Change button text
    }
  }