let map;
let playerMarker;

let points = Number(localStorage.getItem("movaPoints")) || 0;
let coins = Number(localStorage.getItem("movaCoins")) || 0;

document.getElementById("points").textContent = points;
document.getElementById("coins").textContent = coins;


// Initialisation de la carte
map = L.map("map").setView([50.8503, 4.3517], 13);


// Carte OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


// Trouver la position du joueur
if ("geolocation" in navigator) {

    navigator.geolocation.watchPosition(

        function(position) {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            const playerPosition = [latitude, longitude];

            map.setView(playerPosition, 16);

            if (!playerMarker) {

                playerMarker = L.marker(playerPosition)
                    .addTo(map)
                    .bindPopup("📍 Tu es ici !")
                    .openPopup();

            } else {

                playerMarker.setLatLng(playerPosition);

            }

            document.getElementById("locationMessage").textContent =
                "📍 Position trouvée !";

            createCoins(latitude, longitude);

        },

        function(error) {

            document.getElementById("locationMessage").textContent =
                "⚠️ Impossible d'obtenir ta position.";

        },

        {
            enableHighAccuracy: true,
            maximumAge: 5000
        }
    );

} else {

    document.getElementById("locationMessage").textContent =
        "⚠️ Ton appareil ne permet pas la géolocalisation.";

}


// Créer des pièces autour du joueur
function createCoins(latitude, longitude) {

    if (document.querySelector(".mova-coin")) {
        return;
    }

    const positions = [

        [latitude + 0.0015, longitude + 0.0010],
        [latitude - 0.0010, longitude + 0.0015],
        [latitude + 0.0020, longitude - 0.0015],
        [latitude - 0.0020, longitude - 0.0010]

    ];

    positions.forEach(function(position) {

        const coin = L.marker(position, {
            icon: L.divIcon({
                className: "mova-coin",
                html: "🪙",
                iconSize: [30, 30]
            })
        }).addTo(map);

        coin.on("click", function() {

            coins += 50;
            points += 100;

            localStorage.setItem("movaCoins", coins);
            localStorage.setItem("movaPoints", points);

            document.getElementById("coins").textContent = coins;
            document.getElementById("points").textContent = points;

            map.removeLayer(coin);

            alert("🪙 Pièce récupérée ! +50 pièces\n⭐ +100 points");

        });

    });

}
