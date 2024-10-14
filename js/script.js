// Function to check if the pantry is open
function parseTime(timeString) {
    // Parse a time string like "10:00" to a Date object
    const today = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a Date object with the current date and parsed time
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
}

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

// Fetch pantry data and add markers
fetch('pantries.json')  // Ensure the correct path to the JSON file
  .then(response => response.json())
  .then(data => {
    data.forEach(pantry => {
      // Add markers and popups
        const marker = L.marker([pantry.latitude, pantry.longitude]).addTo(map);

        const openStatus = isPantryOpen(pantry.hours);

        function formatHours(hours) {
            let formattedHours = '<ul>';
            for (const day in hours) {
              const timeSlots = hours[day].join(', ');
              formattedHours += `<li><strong>${day}:</strong> ${timeSlots}</li>`;
            }
            formattedHours += '</ul>';
            return formattedHours;
          }

        const popupContent = `
            <div>
            <h3><strong>${pantry.title}</strong></h3>
            <p>${pantry.address}</p>
            ${pantry.phone ? `<p>${pantry.phone}</p>` : ''}
            ${pantry.website ? `<p><a href="${pantry.website}" target="_blank">${pantry.website}</a></p>` : ''}
            <a href="#pantry-${pantry.latitude}-${pantry.longitude}">View Details</a>
            </div>
        `;
      marker.bindPopup(popupContent);

      // Create HTML for pantry info below the map
      const pantryInfoId = "pantry-" + pantry.latitude + "-" + pantry.longitude;
      const pantryInfo = `
        <div id="${pantryInfoId}" class="pantry">
        <h3><strong>${pantry.title}</strong></h3>
        <p>${pantry.address}</p>
        ${pantry.phone ? `<p>${pantry.phone}</p>` : ''}
        ${pantry.website ? `<p><a href="${pantry.website}" target="_blank">${pantry.website}</a></p>` : ''}
        ${pantry.hours ? `<p><strong>Status:</strong> ${openStatus}</p>` : ''}
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