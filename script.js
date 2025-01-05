const map = L.map('map').setView([-37.809364, 144.970061], 13); // Default location: Melbourne
const markersMap = new Map();

async function loadPOIs() {
    const url = 'https://script.google.com/macros/s/AKfycbxkTDf_Wmjt9QIqj8fh8zhJ-OT00VWaVuBx4qsV9r07caBw47RVjYgnXmCBSCnEPaQu/exec'; // Replace with your script URL

    try {
        const response = await fetch(url);
        const pois = await response.json();

        // Loop through each POI and create a marker on the map
        pois.forEach(poi => {
            //const marker = L.marker([poi.lat, poi.lng]).addTo(map);

            // Determine the color based on the rating
            const markerColor = getColorByRating(poi.rating);

                // Create a circle marker with the determined color
            const marker = L.circleMarker([poi.lat, poi.lng], {
                    radius: 8, // Size of the marker
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.8,
                }).addTo(map);



            // Add tooltip to show name and rating on hover
        const ratingText = poi.rating ? `Rating: ${poi.rating}` : 'No rating yet';
        marker.bindTooltip(`<b>${poi.name}</b><br>${ratingText}`, {
                    permanent: false,
                    direction: 'buttom',
                });
            //marker.bindPopup(`<b>${poi.name}</b><br>Rating: ${poi.rating}`);

        // Add the marker to markersMap
            const key = `${poi.lat.toFixed(5)},${poi.lng.toFixed(5)}`;
            markersMap.set(key, marker);


        marker.on('click', function () {

               ratePOI(poi.lat, poi.lng); // Pass the marker's lat and lng to ratePOI
        });

        });
    } catch (error) {
        console.error('Error loading POIs:', error);
    }
}

// Call the function to load POIs when the page is loaded
window.onload = function() {
    loadPOIs();
};

const mapTitle = L.control({ position: 'topright' });
mapTitle.onAdd = function () {
    const div = L.DomUtil.create('div', 'map-title');
    div.innerHTML = '<h2>My Web Map</h2>';
    div.style.backgroundColor = 'white';
    div.style.padding = '5px';
    div.style.border = '2px solid black';
    return div;
};
mapTitle.addTo(map);

//L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//}).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a> &amp; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);


map.on('click', function (e) {
    const coords = e.latlng;
    //const marker = L.marker([coords.lat, coords.lng]).addTo(map);
    const key = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`; // Create a unique key for each location

    // Check if the location already has a marker
    if (markersMap.has(key)) {
        //alert('This point already exists! Click on the marker to rate it.');
        return;
    }

    // Prompt for POI details
    const name = prompt('Enter POI name:');
    //const description = prompt('Enter POI description:');
    let rating = prompt('Rate this POI (1 to 5):');

    while (isNaN(rating) || rating < 1 || rating > 5 ) {

        alert('Please enter a valid number between 1 and 5.');
        rating = prompt('Rate this POI (1 to 5):');
    }

    if (name && rating) {
        //marker.bindPopup(`<b>${name}</b><br>Rating: ${rating}`).openPopup();
        console.log(`Saving POI: Name: ${name}, Latitude: ${coords.lat}, Longitude: ${coords.lng}`);

        savePOI(coords.lat, coords.lng, name, rating);
        loadPOIs();
    }

});

async function savePOI(lat, lng, name, rating) {
    const url = 'https://script.google.com/macros/s/AKfycbxkTDf_Wmjt9QIqj8fh8zhJ-OT00VWaVuBx4qsV9r07caBw47RVjYgnXmCBSCnEPaQu/exec'; // Replace with the actual URL
    const data = { lat, lng, name, rating };

    try {
        const response = await fetch(url, {
            redirect: "follow",
            method: 'POST',
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('POI saved:', result);
    } catch (error) {
        console.error('Error saving POI:', error);
    }
}



// Rating an existing POI
async function ratePOI(lat, lng) {
    console.log('ratePoI');
    let rating = prompt('Rate this POI (1 to 5):');
    while (isNaN(rating) || rating < 1 || rating > 5) {
        alert('Please enter a valid number between 1 and 5.');
        rating = prompt('Rate this POI (1 to 5):');
    }
    if (rating) {
        const url = 'https://script.google.com/macros/s/AKfycbxkTDf_Wmjt9QIqj8fh8zhJ-OT00VWaVuBx4qsV9r07caBw47RVjYgnXmCBSCnEPaQu/exec'; // Replace with your script URL
        const data = { lat, lng, rating };

        try {
            const response = await fetch(url, {
                redirect: "follow",
                method: 'POST',
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Rating saved:', result);

            // Reload POIs to update average rating

            loadPOIs();
        } catch (error) {
            console.error('Error saving rating:', error);
        }
    }
}


function getColorByRating(rating) {
    if (!rating) return '#808080'; // Default gray for unrated POIs
    if (rating < 2) return '#FF0000'; // Red for low ratings
    if (rating < 4) return '#FFA500'; // Orange for medium ratings
    loadPOIs();
    return '#008000'; // Green for high ratings
}


// Function to check if a point exists
function pointExists(lat, lng) {
    return existingPoints.some(point =>
        Math.abs(point.lat - lat) <= tolerance && Math.abs(point.lng - lng) <= tolerance
    );
}
