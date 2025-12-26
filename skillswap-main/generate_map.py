import folium
from folium.plugins import MarkerCluster
import mysql.connector
from geopy.geocoders import Nominatim
import pycountry
import time
import os
from decimal import Decimal

# Frontend URL voor deeplink naar boeken
FRONTEND_BASE = os.environ.get('FRONTEND_BASE_URL', 'http://localhost:5173')
# Backend URL om imageUrl volledig te maken indien relatief
BACKEND_BASE = os.environ.get('BACKEND_BASE_URL', 'http://localhost:3000')

# Eenvoudige DB-config uit env (plaats geen wachtwoorden in code)
config = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'skillswap'),
}

def haal_data_op():
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            id,
            title,
            address,
            city,
            country,
            latitude,
            longitude,
            imageUrl
        FROM listings
        WHERE deletedAt IS NULL
    """)
    data = cursor.fetchall()
    conn.close()
    return data

def update_coordinaten(id, lat, lon):
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE listings SET latitude = %s, longitude = %s WHERE id = %s",
        (lat, lon, id)
    )
    conn.commit()
    conn.close()

def genereer_map():
    geolocator = Nominatim(user_agent="skillswap-map")
    data = haal_data_op()

    # Default: Brussel
    kaart = folium.Map(location=[50.85, 4.35], zoom_start=5)
    cluster = MarkerCluster().add_to(kaart)

    for rij in data:
        lat = rij['latitude']
        lon = rij['longitude']
        # Trim de tekstvelden zodat lege strings niet als adres tellen
        address = (rij.get('address') or '').strip()
        city = (rij.get('city') or '').strip()
        country = (rij.get('country') or '').strip()

        # Prisma/SQL Decimal -> float
        if isinstance(lat, Decimal):
            lat = float(lat)
        if isinstance(lon, Decimal):
            lon = float(lon)

        # Geolocatie ophalen indien nodig
        if lat is None or lon is None:
            land = country
            if land:
                try:
                    country_obj = pycountry.countries.lookup(land)
                    land = country_obj.name
                except Exception:
                    pass

            # Eerst adres, dan stad, dan land
            locatie_parts = [p for p in [address, city, land] if p]
            locatie = ", ".join(locatie_parts)

            if not locatie:
                continue  # geen locatie-informatie

            try:
                loc = geolocator.geocode(locatie)
                if loc:
                    lat, lon = loc.latitude, loc.longitude
                    update_coordinaten(rij['id'], lat, lon)
                    time.sleep(1)  # respecteer Nominatim rate limiting
                else:
                    continue
            except Exception:
                continue

        image_html = ""
        if rij.get('imageUrl'):
            img = rij["imageUrl"]
            if img.startswith('/'):
                img = f"{BACKEND_BASE}{img}"
            image_html = f'<br><img src="{img}" width="150"/>'

        detail_url = f"{FRONTEND_BASE}/listings/{rij['id']}"

        # Voor weergave: toon alleen het echte adres; geen fallback naar stad/land
        display_address = address or "-"

        popup_html = f"""
        <div style="font-family: Arial; font-size: 13px; padding: 6px; width: 200px;">
            <strong>{rij['title']}</strong><br>
            Adres: {display_address}<br>
            Stad: {city or '-'}<br>
            Land: {country or '-'}
            {image_html}<br>
            <a href="{detail_url}" target="_blank" style="display:inline-block;margin-top:6px;padding:6px 10px;background:#0f172a;color:#e2e8f0;text-decoration:none;border-radius:6px;font-weight:700;">Boek deze listing</a>
        </div>
        """

        folium.Marker(
            location=[lat, lon],
            popup=folium.Popup(popup_html, max_width=250, min_width=150)
        ).add_to(cluster)

    # map.html in dezelfde map als server.js
    out_path = os.path.join(os.path.dirname(__file__), "map.html")
    kaart.save(out_path)
    print("map.html opgeslagen op:", out_path)

if __name__ == "__main__":
    genereer_map()
