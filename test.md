
# Mobil applikation för frågarflöde
Kort utvärdering av lösningar för att skapa ett frågare ärende i Lednignskollen
anpassad för mobil.

1. mycket av frågarflöde 2.0 utvecklingen kan återanvändas
1. centraliserad uppgradering
1. hejkasdh
  1. ingen installation krävs
  1. ingen installation krävs
  1. ingen installation krävs

## Mobil anpassad webb-sida
### Fördelar
1. mycket av frågarflöde 2.0 utvecklingen kan återanvändas
1. centraliserad uppgradering
1. hejkasdh
  1. ingen installation krävs
  1. ingen installation krävs
  1. ingen installation krävs

### Nackdelar
- kan inte på ett snyggt sätt distribueras via "App Stores"
- ingen åtkomst till hårdvaru-/plattforms- API
- sämre grafiskintegration och användarupplevelse

## Mobil-app (med PhoneGap)
PhoneGap funkar så att den packar och skapar en applikation av din
HTML/CSS/JavaScript tillsammans med en webbläsare. Det innebär att
applikationen i princip är en vanlig webb-sida fast distribueras som en "app".

### Fördelar
- kan distribueras i "App Stores"
- skrivs i HTML/CSS/JavaScript och kan distribueras som mobil-webb
- viss JavaScript logik kan gå att återanvända

### Nackdelar
- går inte att återanvända MVC struktur eller server aktiva sidor
- uppgraderingar av klienten kan inte garanteras
- prestandan kan bli dålig vid ritning av geometrier

## Mobil-app (native/compile to native)
### Fördelar
- prestanda vid rita på karta
- konsekvent "look and feel" för varje plattform

### Nackdelar
- går inte att återanvända MVC struktur eller server aktiva sidor
- uppgraderingar av klienten kan inte garanteras
- betydligt längre utvecklingstid
- större chans för inkompatibilitet mellan hårdvara
- kan inte återanvända Leaflet kod

### Ramverk
- Titanium (JavaScript)
- MonoTouch/Mono for Android (C#)

