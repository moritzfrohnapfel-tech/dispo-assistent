import test from "node:test";
import assert from "node:assert/strict";
import {parseDispatch,splitRequests,formatEntries,PARSER_VERSION} from "../parser.mjs";
const now=new Date("2026-10-12T12:00:00");
const parse=t=>parseDispatch(t,{now});
test("Original-Diktat: zwei Vorgänge mit richtiger Orts- und Personenzuordnung",()=>{
const data=parse("Viernau Rainer Saur ein LKW leer auf Baustelle um 7 Uhr und in Schenklengsfeld braucht Jens noch zwei LKWs die sollen 0-32 Basalt von Ufhausen mitbringen.");
assert.equal(data.length,2);
assert.deepEqual([data[0].site,data[0].person,data[0].resources,data[0].time],["Viernau","Rainer Saur","1 × LKW","07:00"]);
assert.deepEqual([data[1].site,data[1].person,data[1].resources,data[1].material,data[1].pickup],["Schenklengsfeld","Jens","2 × LKW","0/32 Basalt","Ufhausen"]);
});
test("Mehrere Baustellen und eine eigene Aufgabe",()=>{
const data=parse("Morgen braucht Volker in Gersprung einen Kran. Ich muss noch die Pläne überprüfen. Andreas braucht einen LKW auf der Baustelle Fulda.");
assert.equal(data.length,3);assert.equal(data[0].site,"Gersprung");assert.equal(data[0].date,"13.10.2026");assert.equal(data[1].kind,"Aufgabe");assert.equal(data[2].person,"Andreas");assert.equal(data[2].site,"Fulda");
});
test("Datumszahlen bleiben zusammen",()=>{
const data=parse("Volker braucht am 15.10. um 8 Uhr einen Kran nach Hünfeld");
assert.equal(data.length,1);assert.equal(data[0].date,"15.10.2026");assert.equal(data[0].time,"08:00");assert.equal(data[0].person,"Volker");
});
test("Gesprochene Uhrzeiten werden nicht als Mengen gezählt",()=>{
let data=parse("Volker braucht um halb acht einen LKW in Fulda");assert.equal(data[0].time,"07:30");assert.equal(data[0].resources,"1 × LKW");
data=parse("Um viertel nach sieben LKW nach Fulda");assert.equal(data[0].site,"Fulda");assert.equal(data[0].time,"07:15");assert.equal(data[0].resources,"1 × LKW");
});
test("Zwei Personen ohne Ortsnamen werden nicht als Orte gelesen",()=>{
const data=parse("Rainer Saur braucht morgen zwei LKWs und Jens braucht einen Kran");
assert.equal(data.length,2);assert.equal(data[0].person,"Rainer Saur");assert.equal(data[1].person,"Jens");assert.equal(data[1].site,"");
});
test("Person namens und mehrere Bedarfe",()=>{
const data=parse("Morgen braucht die Baustelle Fulda einen LKW und einen Helfer namens Andreas");
assert.equal(data[0].person,"Andreas");assert.equal(data[0].resources,"1 × LKW, 1 × Helfer/Personal");assert.equal(data[0].site,"Fulda");
});
test("Unklare Angaben bleiben offen und werden nicht erfunden",()=>{
const data=parse("Morgen brauchen wir zwei LKW");
assert.equal(data.length,1);assert.equal(data[0].site,"");assert.ok(data[0].warnings.some(w=>w.includes("Baustelle")));
});
