// Dispo Assistent – lokale, nachvollziehbare Heuristik. Keine KI / keine Datenübertragung.
export const PARSER_VERSION = "0.7.0";
const PLACEHOLDER = "Nicht erkannt";
const QTY = {ein:1,eine:1,einen:1,einem:1,einer:1,eins:1,zwei:2,drei:3,vier:4,fünf:5,sechs:6,sieben:7,acht:8,neun:9,zehn:10};
const VEHICLES = "(?:LKWs?|LKW|Lastwagen|Laster|Vierachser|Dreiachser|Kipper|Kräne|Kran|Bagger|Radbagger|Radlader|Walzen?|Tieflader|Anhänger|Helfer|Fahrer|Mitarbeiter|Leute|Mann|Achttonner)";
const QTY_PATTERN = "(?:(\\d+|ein(?:e|en|em|er|s)?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\\s+)?";
const RESOURCE_REGEX = new RegExp("\\b" + QTY_PATTERN + "(" + VEHICLES + ")\\b", "giu");
const CITY = "[\\p{Lu}][\\p{L}äöüÄÖÜß-]+";
const notName = /^(?:Ich|Wir|Er|Sie|Morgen|Heute|Übermorgen|Baustelle|LKW|LKWs|Kran|Bagger|Der|Die|Das|Ein|Eine|Einen|Noch|Und|Um|Ab|Bitte)$/i;
function clean(value){return (value||"").replace(/\s+/g," ").trim()}
function dayStr(d){return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d)}
function shiftDay(now,n){let d=new Date(now);d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return dayStr(d)}
function weekdayDate(name, now, next){const days=["sonntag","montag","dienstag","mittwoch","donnerstag","freitag","samstag"];let idx=days.indexOf(name.toLowerCase());if(idx<0)return null;let delta=(idx-now.getDay()+7)%7;if(delta===0||next)delta+=(delta===0?7:next?7:0);return shiftDay(now,delta)}
function parseDate(s,now){let m=s.match(/\b(?:am\s+)?(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?\b/);if(m){let year=m[3]?Number(m[3]):now.getFullYear();if(year<100)year+=2000;const d=new Date(year,Number(m[2])-1,Number(m[1]),12);if(d.getMonth()===Number(m[2])-1&&d.getDate()===Number(m[1]))return dayStr(d)}
if(/\bübermorgen\b/i.test(s))return shiftDay(now,2);
if(/\bmorgen\b/i.test(s))return shiftDay(now,1);
if(/\bheute\b/i.test(s))return shiftDay(now,0);
const week=s.match(/\b(?:(nächsten?|kommenden?)\s+)?(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/i);if(week)return weekdayDate(week[2],now,Boolean(week[1]));
return "";}
const HOUR_WORDS={null:0,ein:1,eins:1,eine:1,zwei:2,drei:3,vier:4,fünf:5,sechs:6,sieben:7,acht:8,neun:9,zehn:10,elf:11,zwölf:12,dreizehn:13,vierzehn:14,fünfzehn:15,sechzehn:16,siebzehn:17,achtzehn:18,neunzehn:19,zwanzig:20,einundzwanzig:21,zweiundzwanzig:22,dreiundzwanzig:23};
function hour(value){return /^\d+$/.test(value)?Number(value):HOUR_WORDS[value?.toLowerCase()]}
function timeStr(h,m){return Number.isInteger(h)&&h>=0&&h<=23&&m>=0&&m<=59?String(h).padStart(2,"0")+":"+String(m).padStart(2,"0"):""}
function parseTime(s){
const spoken="(?:\\d{1,2}|ein(?:s)?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn|zwanzig|einundzwanzig|zweiundzwanzig|dreiundzwanzig)";
let m=s.match(new RegExp("\\b(?:um|gegen|ab|bis|spätestens)\\s+halb\\s+("+spoken+")\\b","i"));if(m){let h=hour(m[1]);return timeStr(h===0?23:h-1,30)}
m=s.match(new RegExp("\\b(?:um|gegen|ab|bis|spätestens)\\s+(?:viertel\\s+vor|dreiviertel)\\s+("+spoken+")\\b","i"));if(m){let h=hour(m[1]);return timeStr(h===0?23:h-1,45)}
m=s.match(new RegExp("\\b(?:um|gegen|ab|bis|spätestens)\\s+viertel\\s+nach\\s+("+spoken+")\\b","i"));if(m)return timeStr(hour(m[1]),15);
m=s.match(/\b(?:um|ab|gegen|bis|spätestens)\s+(\d{1,2})(?:[:.](\d{2}))?\s*(?:uhr)?\b/i)||s.match(/\b(\d{1,2}):(\d{2})\s*(?:uhr)?\b/i)||s.match(/\b(\d{1,2})\s*uhr\b/i);
if(m)return timeStr(Number(m[1]),Number(m[2]||0));
m=s.match(new RegExp("\\b(?:um|ab|gegen|bis|spätestens)\\s+("+spoken+")\\s*(?:uhr)?\\b","i"));
if(m)return timeStr(hour(m[1]),0);
return "";}
function number(value){if(!value)return 1;return QTY[value.toLowerCase()]||Number(value)||1}
function standardVehicle(v){let low=v.toLowerCase();if(/^lkw|^lastwagen|^laster/.test(low))return "LKW";if(/^kr/.test(low))return "Kran";if(/^wal/.test(low))return "Walze";if(/^hel|^mitarbeiter|^leute|^mann/.test(low))return "Helfer/Personal";if(/^fahr/.test(low))return "Fahrer";return v[0].toUpperCase()+v.slice(1).toLowerCase()}
function parseResources(s){let cleaned=s.replace(/\b(?:um|gegen|ab|bis|spätestens)\s+(?:halb|viertel\s+(?:vor|nach)|dreiviertel)\s+(?:\d{1,2}|ein(?:s)?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)\b/gi,"");let a=[];for(const m of cleaned.matchAll(RESOURCE_REGEX)){let label=standardVehicle(m[2]);let count=number(m[1]);let existing=a.find(x=>x.label===label);if(existing)existing.amount+=count;else a.push({label,amount:count})}return a.map(x=>x.amount+" × "+x.label).join(", ")}
function newRequestStart(s){let t=s.trim();if(/^(?:ich|wir)\s+(?:muss|müssen|soll|sollen|habe|haben)\b/i.test(t))return true;
if(/^(?:in|nach|für|bei)\s+[\p{Lu}][\p{L}-]+(?:\s+[\p{Lu}][\p{L}-]+)?\s+(?:braucht|benötigt|muss|soll)\b/u.test(t))return true;
if(/^auf\s+(?:der\s+)?baustelle\s+[\p{Lu}][\p{L}-]+(?:\s+[\p{Lu}][\p{L}-]+)?\s+(?:braucht|benötigt|muss|soll)\b/iu.test(t))return true;
if(new RegExp("^"+CITY+"(?:\\s+"+CITY+")?\\s+(?:braucht|benötigt|muss|soll)\\b","u").test(t))return true;
if(/^(?:morgen|übermorgen|heute)\s+(?:braucht|muss|soll|in\s+|auf\s+)/i.test(t))return true;
return false;}
export function splitRequests(raw){
let s=clean(raw).replace(/\s+(?:außerdem|zusätzlich|danach|des weiteren)\s*[:,]?\s+/gi,". ");
const protectedDates=s.replace(/\b\d{1,2}\.\d{1,2}(?:\.\d{2,4})?\.?/g,m=>m.replace(/\./g,"§"));const parts=protectedDates.split(/[.!?;\n]+/).map(x=>clean(x.replace(/§/g,"."))).filter(Boolean);
const result=[];
for(let p of parts){let start=0;const and=/\s+und\s+/gi;let m;while((m=and.exec(p))!==null){if(newRequestStart(p.slice(m.index+m[0].length))){let piece=clean(p.slice(start,m.index));if(piece)result.push(piece);start=m.index+m[0].length;}}
let tail=clean(p.slice(start));if(tail)result.push(tail)}
return result;
}
function plausiblePlace(name){return name&&/^\p{Lu}/u.test(name)&&!/^(?:Um|Ab|Gegen|Auf|Der|Die|Das|Ein|Einen|Eine|Noch|Heute|Morgen|Uhr)$/i.test(name)}
function parsePlace(s){
let m=s.match(new RegExp("\\b(?:auf\\s+der\\s+Baustelle|auf\\s+Baustelle|Baustelle)\\s+("+CITY+")","iu"));
if(m&&plausiblePlace(m[1]))return {value:m[1],confidence:"hoch"};
const locations=[...s.matchAll(new RegExp("\\b(?:in|nach)\\s+("+CITY+")","giu"))];
for(let item of locations){if(plausiblePlace(item[1]))return {value:item[1],confidence:"hoch"}}
m=s.match(new RegExp("^("+CITY+")\\s+("+CITY+")\\s+("+CITY+")\\s+(?:(?:\\d+|ein\\w*|zwei|drei|vier)\\s+)?(?:"+VEHICLES+")\\b","iu"));
if(m&&plausiblePlace(m[1]))return {value:m[1],confidence:"mittel",leadingPerson:m[2]+" "+m[3]};
return {value:"",confidence:"offen"};
}
function parsePerson(s,place){
const candidates=[];const named=s.match(/\b(?:namens|name)\s+([\p{Lu}][\p{L}-]+(?:\s+[\p{Lu}][\p{L}-]+)?)/iu);if(named)candidates.push(named[1]);
const after=s.match(new RegExp("\\b(?:braucht|benötigt)\\s+("+CITY+"(?:\\s+"+CITY+")?)\\b","iu"));
if(after){
const a=after[1].split(/\s+/).filter(Boolean);
if(!/^(?:Ein|Eine|Einen|Noch|Zwei|Drei|Vier|Fünf|Einer|LKW|Bagger|Kran|Helfer|Die|Der|Das|Wir|Uns|Am|Um|Ab|Heute|Morgen|Übermorgen|In|Nach|Auf|Für|Bei)$/i.test(a[0])){
  candidates.push(a[0]);
}}
const before=s.match(new RegExp("\\b("+CITY+"(?:\\s+"+CITY+")?)\\s+(?:braucht|benötigt|möchte)\\b","iu"));
if(before){
let name=before[1].replace(/^(?:in|auf|nach|für|bei|heute|morgen|übermorgen)\s+/i,"");
if(name!==place.value&&!/^(?:in|auf|nach|für|bei)\b/i.test(before[1]))candidates.push(name);
}
const forPerson=s.match(new RegExp("\\b(?:für|bei)\\s+("+CITY+"(?:\\s+"+CITY+")?)\\s+(?=(?:noch\\s+|bitte\\s+|einen?\\s+|eine\\s+|zwei\\s+|drei\\s+|vier\\s+|\\d+\\s+|(?:"+VEHICLES+")\\b|$))","iu"));
if(forPerson)candidates.push(forPerson[1]);
if(place.leadingPerson)candidates.push(place.leadingPerson);
for(let candidate of candidates){let val=candidate.trim();if(notName.test(val)||val===place.value||/^(?:in|auf|nach|für|bei)\b/i.test(val))continue;return val}
return "";}
function parseMaterial(s){let m=s.match(/\b((?:0\s*[-\/]\s*\d{1,2}|0\s+\d{1,2})\s*(?:basalt|schotter|frostschutz|kies|splitt)|(?:basalt|schotter|frostschutz|kies|splitt|asphalt|sand|mutterboden|boden))\b/i);return m?m[1].replace(/\s*[-\/]\s*/g,"/").replace(/\b0\s+(\d{1,2})\b/,"0/$1"):""}
function parsePickup(s){let m=s.match(new RegExp("\\b(?:von|aus|abhol(?:en|ung)?\\s+(?:in|bei)?)\\s+("+CITY+")","iu"));return m&&plausiblePlace(m[1])?m[1]:""}
function parseDrop(s){let m=s.match(new RegExp("\\b(?:nach|zur\\s+Baustelle|auf\\s+die\\s+Baustelle)\\s+("+CITY+")","iu"));return m&&plausiblePlace(m[1])?m[1]:""}
function action(s){let acts=[];if(/\bleer\b/i.test(s))acts.push("leer");if(/\b(?:mitbringen|liefern|anliefern|bringen)\b/i.test(s))acts.push("mitbringen/liefern");if(/\b(?:abholen|holen)\b/i.test(s))acts.push("abholen");if(/\b(?:abfahren|abtransportieren|entsorgen)\b/i.test(s))acts.push("abtransportieren");return acts.join(", ")}
function isTask(s){return /\b(?:ich|wir)\s+(?:muss|müssen|soll|sollen|will|wollen)\b|\b(?:prüfen|überprüfen|kontrollieren|nachfragen|klären|bestellen|anrufen|erledigen)\b/i.test(s)&&!/\b(?:braucht|benötigt)\b/i.test(s)}
export function parseDispatch(raw,{now=new Date()}={}){
const source=String(raw||"").trim();if(!source)return [];
let currentDate="";let id=0;
return splitRequests(source).map(text=>{
const localDate=parseDate(text,now);if(localDate)currentDate=localDate;
let place=parsePlace(text);
let person=parsePerson(text,place);
const task=isTask(text),resource=parseResources(text);
const material=parseMaterial(text),pickup=parsePickup(text);
const drop=parseDrop(text),time=parseTime(text);
const kind=task?"Aufgabe":resource||/braucht|benötigt|fahren|liefern|mitbringen|abholen/i.test(text)?"Disposition":"Ungeklärt";
const warnings=[];
if(!place.value)warnings.push("Baustelle/Ort nicht sicher erkannt");
else if(place.confidence==="mittel")warnings.push("Ortszuordnung bitte prüfen");
if(!person&&kind==="Disposition")warnings.push("Zuständige Person fehlt");
if(!localDate&&!currentDate)warnings.push("Datum fehlt");
if(kind==="Ungeklärt")warnings.push("Anforderung nicht eindeutig");
if(!resource&&kind==="Disposition")warnings.push("Fahrzeug/Personal nicht erkannt");
return {id:++id,kind,date:localDate||currentDate||"",site:place.value||"",person,resources:resource,time,material,pickup,destination:drop,action:action(text),detail:text,warnings,confirmed:false};
});
}
export function formatEntries(entries){
return entries.map((e,i)=>[
(e.kind||"Eintrag").toUpperCase()+" "+(i+1),
"Datum: "+(e.date||"offen"),
"Baustelle/Ort: "+(e.site||"offen"),
...(e.person?["Person: "+e.person]:[]),
...(e.resources?["Bedarf: "+e.resources]:[]),
...(e.time?["Uhrzeit: "+e.time]:[]),
...(e.material?["Material: "+e.material]:[]),
...(e.pickup?["Abholort: "+e.pickup]:[]),
...(e.destination?["Ziel: "+e.destination]:[]),
...(e.action?["Hinweis: "+e.action]:[]),
"Originalaussage: "+e.detail
].join("\n")).join("\n\n");
}
