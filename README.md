# Krysselista – Barnehageapp (PRO203 Smidig prosjekt)

Dette er en enkel mobilapp for barnehager laget i React Native / Expo.

  Foresatte kan:
  - Logge inn og se sine egne barn
  - Se status (Levert / Hentet), avdeling og «Dagen i dag»-tekst
  - Registrere sykdom og legge inn ferie
  - Legge inn ønsket sovetid for barnet
  - Se når barnet har sovet
  - Se bilder fra dagen for barnets avdeling
  - Sende beskjeder til avdelingen (dagspåminnelser)
  - Få påminnelser om aktiviteter

  Ansatte kan:
  - Logge inn som ansatt
  - Se avdelinger og barn i hver avdeling
  - Registrere Levert / Hentet
  - Skrive «Dagen i dag»-tekst for avdelingen
  - Legge til bilder for avdelingen
  - Endre profilbilde på barn
  - Registrere søvn
  - Sende beskjeder til foreldre
  - Sende ut felles påminnelser til alle foresatte på en avdeling

All data i appen er testdata.

## Hvordan kjøre appen

1. Node.js (LTS-versjon, feks. 20.x)  
   Last ned fra: https://nodejs.org

2. Expo Go på telefon (for å teste på mobil):
   - Android: Google Play
   - iOS: App Store

3. Pakk ut ZIP-filen et valgfritt sted på maskinen.

4. Åpne en terminal/PowerShell og gå inn i prosjektmappen (cd frostbyte-app).

5. I terminal/PowerShell, kjør "npm install" og deretter "npx expo start"

6. En QR-kode vises i terminalen, gå inn i Expo Go på telefonen, og skann QR-koden.
   For mobil: sørg for at telefon og PC er på samme nettverk.
   For web: trykk w i terminalen for å åpne appen i nettleseren.

### Innlogging

Ansatt: 
brukernavn - ansatt@test.no
passord - ansattpassord

Mamma (med to barn):
brukernavn - mamma@test.no
passord - mammapassord

Pappa (med et barn):
brukernavn - pappa@test.no
passord - pappapassord

Admin
brukernavn - admin@test.no
passord - admin123