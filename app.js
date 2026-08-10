/* =========================
   MOVA
   ========================= */

let map = null;
let playerMarker = null;
let playerRange = null;

let coins = Number(localStorage.getItem("movaCoins")) || 0;
let points = Number(localStorage.getItem("movaPoints")) || 0;
let steps = Number(localStorage.getItem("movaSteps")) || 0;

let coinsOnMap = [];
let lastPosition = null;

const GOAL = 5000;
const COLLECTION_RADIUS = 50;


/* =========================
   ELEMENTS
   ========================= */

const pointsEl = document.getElementById("points");
const coinsEl = document.getElementById("coins");
const stepsEl = document.getElementById("steps");

const progressFill = document.getElementById("progressFill");
const stepRing = document.getElementById("stepRing");
const goalCurrent = document.getElementById("goalCurrent");

const distanceEl = document.getElementById("distance");

const locationMessage =
    document.getElementById("locationMessage");


/* =========================
   SAVE
   ========================= */

function saveData() {

    localStorage.setItem("movaCoins", coins);
    localStorage.setItem("movaPoints", points);
    localStorage.setItem("movaSteps", steps);

}


/* =========================
   UI
   ========================= */

function updateUI() {

    pointsEl.textContent = points.toLocaleString("fr-FR");
    coinsEl.textContent = coins.toLocaleString("fr-FR");

    stepsEl.textContent = steps.toLocaleString("fr-FR");

    goalCurrent.textContent =
        Math.min(steps, GOAL).toLocaleString("fr-FR");


    const progress =
        Math.min((steps / GOAL) * 100, 100);

    progressFill.style.width = progress + "%";


    stepRing.style.background = `
        conic-gradient(
            var(--accent) ${progress * 3.6}deg,
            #252a34 ${progress * 3.6}deg
        )
    `;


    document.getElementById("rankingPoints").textContent =
        points.toLocaleString("fr-FR") + " ⭐";

    document.getElementById("profilePoints").textContent =
        points.toLocaleString("fr-FR");

    document.getElementById("profileCoins").textContent =
        coins.toLocaleString("fr-FR");

    document.getElementById("profileSteps").textContent =
        steps.toLocaleString("fr-FR");

}


updateUI();


/* =========================
   NAVIGATION
   ========================= */

document.querySelectorAll(".nav-button").forEach(button => {

    button.addEventListener("click", () => {

        const target = button.dataset.page;

        document.querySelectorAll(".page")
            .forEach(page => page.classList.remove("active-page"));

        document.getElementById(target)
            .classList.add("active-page");


        document.querySelectorAll(".nav-button")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");


        if (target === "mapPage" && map) {

            setTimeout(() => {
                map.invalidateSize();
            }, 100);

        }

    });

});


/* =========================
   MAP
   ========================= */

function initMap() {

    map = L.map("map").setView(
        [50.8503, 4.3517],
        15
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    startGPS();

}


initMap();


/* =========================
   GPS
   ========================= */

function startGPS() {

    if (!navigator.geolocation) {

        locationMessage.textContent =
            "⚠️ GPS indisponible";

        return;
    }


    navigator.geolocation.watchPosition(

        position => {

            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;


            const currentPosition =
                [lat, lng];


            locationMessage.textContent =
                "📍 Position trouvée";


            if (!playerMarker) {

                playerMarker = L.marker(
                    currentPosition,
                    {
                        icon: L.divIcon({
                            className: "",
                            html: `<div class="player-icon"></div>`,
                            iconSize: [22, 22],
                            iconAnchor: [11, 11]
                        })
                    }
                ).addTo(map);


                playerMarker.bindPopup(
                    "📍 Tu es ici"
                );


                playerRange = L.circle(
                    currentPosition,
                    {
                        radius: COLLECTION_RADIUS,
                        className: "player-zone",
                        color: "#999",
                        fillColor: "#999",
                        fillOpacity: .08,
                        weight: 1
                    }
                ).addTo(map);


                map.setView(
                    currentPosition,
                    17
                );


                createCoins(lat, lng);

            } else {

                playerMarker.setLatLng(
                    currentPosition
                );

                playerRange.setLatLng(
                    currentPosition
                );

            }


            checkCoins(currentPosition);

        },

        error => {

            locationMessage.textContent =
                "⚠️ Autorise la localisation";

        },

        {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 10000
        }

    );

}


/* =========================
   COINS
   ========================= */

function createCoins(lat, lng) {

    if (coinsOnMap.length > 0) {
        return;
    }


    const positions = [

        [lat + .0008, lng + .0008],
        [lat - .0010, lng + .0006],
        [lat + .0012, lng - .0010],
        [lat - .0007, lng - .0012]

    ];


    positions.forEach((position, index) => {

        const zone = L.circle(
            position,
            {
                radius: COLLECTION_RADIUS,
                color: "#ffd83d",
                fillColor: "#ffd83d",
                fillOpacity: .08,
                weight: 1,
                dashArray: "5 6"
            }
        ).addTo(map);


        const marker = L.marker(
            position,
            {
                icon: createCoinIcon(false)
            }
        ).addTo(map);


        marker.bindTooltip(
            "🪙 À récupérer",
            {
                direction: "top",
                offset: [0, -15]
            }
        );


        const coin = {
            marker,
            zone,
            position,
            collected: false,
            ready: false
        };


        coinsOnMap.push(coin);

    });

}


/* =========================
   COIN ICON
   ========================= */

function createCoinIcon(ready) {

    return L.divIcon({

        className: "",

        html: `
            <div class="coin-icon ${ready ? "ready" : ""}">
                ${ready ? "✓" : "🪙"}
            </div>
        `,

        iconSize: [36, 36],
        iconAnchor: [18, 18]

    });

}


/* =========================
   CHECK DISTANCE
   ========================= */

function checkCoins(playerPosition) {

    coinsOnMap.forEach(coin => {

        if (coin.collected) {
            return;
        }


        const distance =
            map.distance(
                playerPosition,
                coin.position
            );


        const inside =
            distance <= COLLECTION_RADIUS;


        if (inside && !coin.ready) {

            coin.ready = true;

            coin.marker.setIcon(
                createCoinIcon(true)
            );


            coin.zone.setStyle({

                color: "#999",
                fillColor: "#999",
                fillOpacity: .18

            });


            coin.marker.unbindTooltip();


            coin.marker.bindTooltip(
                "✓ RÉCUPÉRABLE",
                {
                    permanent: true,
                    direction: "top",
                    offset: [0, -20]
                }
            );


            coin.marker.on(
                "click",
                () => collectCoin(coin)
            );

        }

    });

}


/* =========================
   COLLECT COIN
   ========================= */

function collectCoin(coin) {

    if (
        coin.collected ||
        !coin.ready
    ) {
        return;
    }


    coin.collected = true;


    coins += 50;
    points += 100;


    saveData();
    updateUI();


    map.removeLayer(
        coin.marker
    );

    map.removeLayer(
        coin.zone
    );


    alert(
        "🪙 PIÈCE RÉCUPÉRÉE !\n\n" +
        "+50 pièces\n" +
        "+100 points"
    );

}


/* =========================
   PEDOMETRE
   ========================= */

let lastAcceleration = 0;
let lastStepTime = 0;


function startPedometer() {

    if (!window.DeviceMotionEvent) {

        console.log(
            "Capteur de mouvement indisponible."
        );

        return;
    }


    window.addEventListener(
        "devicemotion",
        event => {

            const acceleration =
                event.accelerationIncludingGravity;


            if (!acceleration) {
                return;
            }


            const x = acceleration.x || 0;
            const y = acceleration.y || 0;
            const z = acceleration.z || 0;


            const magnitude =
                Math.sqrt(
                    x * x +
                    y * y +
                    z * z
                );


            const now =
                Date.now();


            /*
             * Détection très simple pour le prototype.
             * Ce n'est PAS encore un compteur
             * de pas médicalement précis.
             */

            if (
                magnitude > 12 &&
                lastAcceleration <= 12 &&
                now - lastStepTime > 350
            ) {

                steps++;

                lastStepTime = now;

                saveData();
                updateUI();

            }


            lastAcceleration =
                magnitude;

        }
    );

}


startPedometer();


/* =========================
   VALIDATION DES PAS
   ========================= */

document
    .getElementById("validateSteps")
    .addEventListener(
        "click",
        () => {

            const reached =
                [1000, 2500, 5000, 7500, 10000]
                .filter(level => steps >= level);


            if (reached.length === 0) {

                alert(
                    "👟 Continue !\n\n" +
                    "Atteins au moins 1 000 pas " +
                    "pour débloquer ton premier palier."
                );

                return;
            }


            const highest =
                reached[reached.length - 1];


            let reward = 50;


            if (highest >= 10000) {
                reward = 750;
            } else if (highest >= 7500) {
                reward = 400;
            } else if (highest >= 5000) {
                reward = 250;
            } else if (highest >= 2500) {
                reward = 100;
            }


            points += reward;

            saveData();
            updateUI();


            document.getElementById(
                "rewardTitle"
            ).textContent =
                highest.toLocaleString("fr-FR") +
                " PAS";


            document.getElementById(
                "rewardAmount"
            ).textContent =
                "+" +
                reward +
                " ⭐";


            document.getElementById(
                "rewardOverlay"
            ).classList.add("show");

        }
    );


document
    .getElementById("closeReward")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("rewardOverlay")
                .classList.remove("show");

        }
    );
