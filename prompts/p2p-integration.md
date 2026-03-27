# Prompt: P2P-Synchronisation mit PeerJS

## Zeitpunkt
Ende Maerz 2026, waehrend US-19

## Kontext
Fuer das Thema "Dezentrale Systeme" wollten wir zeigen dass die App auch ohne zentralen Server funktionieren kann. PeerJS war naheliegend weil es WebRTC abstrahiert und im Browser laeuft.

## Prompt (sinngemaess)
"Wir haben eine Vue 3 Einkaufslisten-App mit REST Backend. Jetzt wollen wir zusaetzlich P2P-Sync einbauen damit zwei Clients direkt miteinander kommunizieren koennen. PeerJS scheint passend. Wie integrieren wir das sauber neben der bestehenden Server-Sync? Der Server soll weiterhin die Source of Truth sein."

## Ergebnis
- PeerJS als Dependency mit einfachem Singleton-Service (`p2pService.ts`)
- Peer-ID basiert auf Listen-ID + Zufallssuffix fuer Eindeutigkeit
- Manuelles Verbinden ueber Dialog wo man die Peer-ID des anderen eingibt
- Nachrichten werden als JSON ueber DataConnection gesendet
- P2P ist ergaenzend zum Server-Sync, nicht als Ersatz
- Composable `useP2P.ts` kuemmert sich um Lifecycle (init on mount, destroy on unmount)

## Was wir daraus mitgenommen haben
WebRTC ist fuer echte dezentrale Kommunikation gut, aber NAT Traversal bleibt ein Problem. Ohne TURN Server funktioniert es nur im selben Netzwerk zuverlaessig. Fuer eine Schuldemonstration reicht das aber aus. In der Praxis wuerden wir einen TURN Server aufsetzen oder auf eine Loesung wie libp2p wechseln.
