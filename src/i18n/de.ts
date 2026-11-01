import type { Messages } from './en';

export const de: Messages = {
  'home.reserved': 'Reservierte Räume',
  'home.reservedHint':
    'Dein eigener Raum mit festen Links. Links für Moderation, Sprecher und Zuschauer. Ohne Konto.',
  'home.allRooms': 'Meine Räume ({count})',
  'home.openRoomHint': 'Öffnet die Links und Aktionen dieses Raums.',
  'home.otherServer': 'Server: {server}',
  'home.roomAfterJoin': 'Der Raumname erscheint nach dem Beitreten.',
  'home.room': 'Raum: {room}',
  'home.save': 'In „Meine Räume“ speichern',
  'home.joinAs': 'Beitreten als {role}',
  'home.inputHelp':
    'Füge einen beliebigen meet.ffmuc.net-Link ein: Raumlink, Moderations- oder Sprecherlink oder Verwaltungslink. Oder gib einen Raumnamen ein.',
  'room.removeHint': 'Vergisst den Raum nur auf diesem Gerät.',
  'room.deleteHint': 'Löscht den Raum auf dem Server für alle.',
  'room.rotateHint':
    'Neue Moderations- und Sprecherlinks. Die alten funktionieren nicht mehr.',
  'room.extendHint': 'Den Raum länger behalten.',
  'room.joinHostHint': 'Öffnet das Meeting mit Moderationsrechten.',
  'room.actions': 'Aktionen',
  'room.shareTap': 'Tippe auf einen Link, um ihn zu teilen.',
  'role.manageHint':
    'Gut aufbewahren. Damit verlängerst du den Raum, erstellst neue Links oder löschst den Raum.',
  'role.openHint': 'Ein normaler Meetingraum. Alle haben die gleichen Rechte.',
  'role.viewerHint': 'Zum Teilen mit allen anderen.',
  'role.speakerHint':
    'Für Leute, die direkt mitreden sollen, ohne Moderationsrechte.',
  'role.hostHint':
    'Für dich und Co-Moderatoren. Wer diesen Link hat, moderiert den Raum.',
  'role.manage': 'Verwalten',
  'role.open': 'Offener Raum',
  'rooms.importHint':
    'Füge den Verwaltungslink oder den Moderationslink deines Raums ein.',
  'rooms.createHint':
    'Ein neuer Raum mit Links für Moderation, Sprecher und Zuschauer.',
  'rooms.intro':
    'Ein eigener Raum mit festen Links. Drei Zugangsstufen: Moderation, Sprecher und Zuschauer. Ohne Konto.',
  'app.name': 'Freifunk Meet',
  'settings.title': 'Einstellungen',
  'settings.meeting': 'Meetings',
  'settings.name': 'Dein Name',
  'settings.namePlaceholder': 'Name für andere',
  'settings.nameHelp':
    'Andere sehen diesen Namen im Meeting. Er bleibt auf diesem Gerät.',
  'settings.audioMuted': 'Mit Mikrofon aus starten',
  'settings.videoMuted': 'Mit Kamera aus starten',
  'settings.appearance': 'Darstellung',
  'settings.theme': 'Design',
  'settings.themeSystem': 'System',
  'settings.themeLight': 'Hell',
  'settings.themeDark': 'Dunkel',
  'settings.themeHelp':
    'System nutzt den hellen oder dunklen Modus deines Geräts.',
  'reminder.title': 'Raum „{room}“ läuft bald ab',
  'reminder.body3':
    'Dein Raum läuft in 3 Tagen ab. Tippe hier, um ihn zu verlängern.',
  'reminder.body1':
    'Dein Raum läuft morgen ab. Tippe hier, um ihn zu verlängern.',
  'common.cancel': 'Abbrechen',
  'common.close': 'Schließen',
  'common.ok': 'OK',
  'common.back': 'Zurück',
  'common.retry': 'Nochmal versuchen',
  'duration.hours': '{n} Stunden',
  'duration.day': '1 Tag',
  'duration.days': '{n} Tage',
  'duration.week': '1 Woche',
  'duration.weeks': '{n} Wochen',
  'duration.year': '1 Jahr',
  'duration.years': '{n} Jahre',
  'rooms.title': 'Meine Räume',
  'rooms.empty': 'Auf diesem Gerät sind noch keine Räume.',
  'rooms.create': 'Raum reservieren',
  'rooms.import': 'Vorhandenen Raum hinzufügen',
  'rooms.expires': 'Gültig bis {date}',
  'rooms.expired': 'Abgelaufen am {date}',
  'create.title': 'Raum reservieren',
  'create.duration': 'Laufzeit',
  'create.submit': 'Reservieren',
  'create.info':
    'Vor dem Reservieren macht die App einen kurzen Rechencheck gegen Spam. Das kann einige Sekunden dauern.',
  'pow.working': 'Rechencheck gegen Spam … {percent} %',
  'pow.sending': 'Wird gesendet …',
  'import.title': 'Vorhandenen Raum hinzufügen',
  'import.label': 'Verwaltungslink oder Moderationslink',
  'import.submit': 'Zu „Meine Räume“ hinzufügen',
  'import.speaker':
    'Das ist ein Sprecherlink. Zum Verwalten brauchst du den Verwaltungs- oder Moderationslink.',
  'import.notHost': 'Das ist kein Verwaltungs- oder Moderationslink.',
  'room.status.active': 'Aktiv',
  'room.status.expired': 'Abgelaufen',
  'room.status.deleted': 'Gelöscht',
  'room.status.replaced': 'Durch neue Links ersetzt',
  'room.joinHost': 'Als Moderation beitreten',
  'room.share': 'Links',
  'room.extend': 'Verlängern',
  'room.rotate': 'Neue Links erstellen',
  'room.rotateConfirm':
    'Die alten Moderations- und Sprecherlinks funktionieren danach nicht mehr. Wer mit diesen Links im Meeting ist, muss neu beitreten. Der Zuschauerlink bleibt gleich.',
  'room.delete': 'Raum löschen',
  'room.deleteConfirm':
    'Der Raum wird auf dem Server gelöscht. Alle Links funktionieren nicht mehr. Das kann nicht rückgängig gemacht werden.',
  'room.remove': 'Von diesem Gerät entfernen',
  'room.removeConfirm':
    'Die App vergisst diesen Raum. Der Raum bleibt auf dem Server. Ohne den Verwaltungslink kannst du ihn nicht mehr verwalten.',
  'room.gone': 'Diesen Raum kannst du nicht mehr nutzen.',
  'extend.title': '„{room}“ verlängern',
  'extend.submit': 'Verlängern',
  'extend.current': 'Jetzt: gültig bis {date}',
  'extend.max':
    'Ein Raum kann höchstens {duration} im Voraus reserviert werden.',
  'home.inputLabel': 'Raumname oder Link',
  'home.inputPlaceholder': 'Raumname oder Link',
  'home.join': 'Beitreten',
  'home.recent': 'Letzte Meetings',
  'home.recentEmpty': 'Keine letzten Meetings.',
  'home.removeRecent': '„{room}“ aus den letzten Meetings entfernen?',
  'home.remove': 'Entfernen',
  'home.lastJoined': 'Zuletzt beigetreten {date}',
  'home.joinRoom': '{room} beitreten',
  'join.joining': 'Beitreten …',
  'join.invalid': 'Das ist kein Raumname und kein Meetinglink.',
  'join.reserveHint':
    'Dieser Link öffnet die Raumreservierung. Reserviere einen Raum unter „Meine Räume“.',
  'role.host': 'Moderation',
  'role.speaker': 'Sprecher',
  'role.viewer': 'Zuschauer',
  'error.invalid':
    'Dieser Link ist ungültig. Prüfe, ob er vollständig kopiert wurde.',
  'error.unknown':
    'Diesen Link kennen wir nicht. Prüfe, ob er vollständig kopiert wurde.',
  'error.forbidden':
    'Das ist ein Sprecherlink. Damit kannst du den Raum nicht moderieren.',
  'error.replaced':
    'Dieser Link wurde durch neue Links ersetzt. Frag die Moderation nach dem aktuellen Link.',
  'error.deleted':
    'Dieser Raum wurde gelöscht. Der Link funktioniert nicht mehr.',
  'error.expired':
    'Dieser Raum ist abgelaufen. Ist es dein Raum, verlängere ihn unter „Meine Räume“. Sonst frag die Moderation nach einem neuen Link.',
  'error.too_many_requests':
    'Zu viele Anfragen. Warte einige Minuten und versuch es dann nochmal.',
  'error.malformed': 'Die Anfrage ist ungültig.',
  'error.internal': 'Der Server hat ein Problem. Versuch es später nochmal.',
  'error.pow_malformed':
    'Der Rechencheck ist fehlgeschlagen. Versuch es nochmal.',
  'error.pow_bad_mac':
    'Der Rechencheck ist fehlgeschlagen. Versuch es nochmal.',
  'error.pow_expired': 'Der Rechencheck ist abgelaufen. Versuch es nochmal.',
  'error.pow_insufficient':
    'Der Rechencheck ist fehlgeschlagen. Versuch es nochmal.',
  'error.pow_replay':
    'Der Rechencheck wurde schon benutzt. Versuch es nochmal.',
  'error.network': 'Keine Verbindung zum Server. Prüfe dein Netzwerk.',
  'error.aborted': 'Abgebrochen.',
  'error.http': 'Der Server meldet einen Fehler ({status}).',
};
