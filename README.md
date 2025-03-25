# Marine Service Projektstyringssystem

Dette er et webbaseret projektstyringssystem udviklet til en marineservicevirksomhed. Systemet er designet til at hjælpe virksomheden med at digitalisere deres projektstyring og maskinbooking.

## Funktionaliteter

### Projektstyring

- **Nye Projekter**: Import af nye projekter fra Microsoft Business Central, redigering og godkendelse
- **Projektoversigt**: Visning af igangværende og ikke påbegyndte projekter
- **Afsluttede Projekter**: Visning af projekter afsluttet indenfor de sidste 2 uger

### Projektdata

Hvert projekt indeholder:

- Startdato
- Deadline
- Pris
- Dækningsbidrag (fra Microsoft Business Central)
- Forventede arbejdstimer
- Inspektioner (hvis det er et klasseprojekt)

### Statusindikatorer

Projekterne vises med en statusindikator baseret på dækningsbidraget:

- Grøn: 50%+
- Gul: 49-30%
- Rød: Under 30%

### Medarbejderoversigt

- Visning af virksomhedens medarbejdere
- Se og redigere medarbejdernes navne og kompetencer

### Maskinbooking

- Dynamisk tilføjelse af maskiner
- Interaktiv kalendervisning for maskinbookinger
- Booking af maskiner for præcise tidspunkter (time og minut)
- Booking på tværs af flere dage
- Validering af tidsrum for at undgå overlappende bookinger
- Filtrering af kalenderen efter specifik maskine
- Oversigt over alle bookinger med mulighed for at se detaljer og slette bookinger

## Tekniske detaljer

### Frontend

- HTML, CSS og JavaScript
- Forberedt til fremtidig integration med Microsoft Business Central API
- Responsivt design der fungerer på både desktop og mobile enheder

### Installation og opstart

1. Download eller klon projektet til din computer
2. Installer afhængigheder med `npm install`
3. Start applikationen med `npm start`
4. Åbn http://localhost:3000 i din browser

### Udvikling

Projektet er organiseret som følger:

- `index.html`: Hovedside med brugergrænsefladen
- `css/style.css`: Styling for applikationen
- `js/app.js`: JavaScript-kode med hovedfunktionalitet
- `js/calendar.js`: Kalenderkomponent for maskinbooking
- `assets/`: Mappe til billeder og andre ressourcer

## Fremtidige udviklinger

- Integration med Microsoft Business Central
- Fuld implementering af drag-and-drop funktionalitet til maskinbooking
- Tilføjelse af autentificering og brugerroller
- Medarbejdertilknytning til bookinger

## Sprog

- Kode, kommentarer og variabelnavne er på engelsk
- Brugergrænsefladen er på dansk
