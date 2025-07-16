import '../style.css'
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "flatpickr/dist/flatpickr.min.css";
import 'tabulator-tables/dist/css/tabulator.min.css';
import 'chartjs-adapter-date-fns';

const med = document.getElementById('media')
const scart = document.getElementById('SQM')

export function calcolaSpan(tabella) {
    let span = document.getElementById("span");
    let ultimoRecord;
    let primorecord;
    tabella.queryFeatures({
        where: "1=1",
        outFields: ["*"],
        orderByFields: ["OBJECTID DESC"],
        returnGeometry: false,
        num: 1
    }).then((result) => {
        if (result.features.length > 0) {
            ultimoRecord = result.features[0].attributes;
            tabella.queryFeatures({
                where: "1=1",
                outFields: ["*"],
                returnGeometry: false,
                num: 1
            }).then((result) => {
                if (result.features.length > 0) {
                    primorecord = result.features[0].attributes;
                    console.log("primo record:", primorecord);
                    console.log("Ultimo record:", ultimoRecord);
                    const spanval = (formattaData(new Date(primorecord.DataOra)) + " ~ " + formattaData(new Date(ultimoRecord.DataOra)))
                    span.innerHTML = spanval
                    return [formattaData(new Date(primorecord.DataOra)), formattaData(new Date(ultimoRecord.DataOra))]
                } else {
                    console.log("Nessun record trovato.");
                }
            })
        } else {
            console.log("Nessun record trovato.");
        }
    })
}



export function convertToCSV(objArray) {
    const array = Array.isArray(objArray) ? objArray : JSON.parse(objArray);
    const header = Object.keys(array[0]).join(",") + "\n";
    const rows = array.map(obj => Object.values(obj).join(",")).join("\n");
    return header + rows;
}

export function downloadCSV(array, filename = "data.csv") {
    const csv = convertToCSV(array);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function calcolaMediaESqmPioggia(array) {
    if (!array.length) {
        throw new Error("Array vuoto");
    }

    const piogge = array
        .map(item => item.Pioggia_mm)
        .filter(val => typeof val === "number" && !isNaN(val));

    if (!piogge.length) {
        throw new Error("Nessun valore numerico Pioggia_mm trovato");
    }

    const somma = piogge.reduce((acc, val) => acc + val, 0);
    const media = somma / piogge.length;

    const sommaQuadrati = piogge.reduce((acc, val) => acc + Math.pow(val - media, 2), 0);
    const sqm = Math.sqrt(sommaQuadrati / piogge.length);

    med.innerHTML = media.toFixed(3)
    scart.innerHTML = sqm.toFixed(3)
    return {
        media: Number(media.toFixed(3)),
        sqm: Number(sqm.toFixed(3))
    };
}

export function formattaData(data) {
    const yyyy = data.getFullYear();
    const mm = String(data.getMonth() + 1).padStart(2, '0'); // Mese da 1 a 12
    const dd = String(data.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
}


export function pergiornoietogramma(dati) {
    let datiarray = [];
    let x;
    let y;
    let giorno = dati[0].Giorno
    let mmgiorno = 0
    dati.forEach(d => {
        if (d.Giorno == giorno) {
            mmgiorno = mmgiorno + d.Pioggia_mm
        } else {
            let dato = { x, y }
            dato.y = mmgiorno / 24;
            dato.x = giorno;
            datiarray.push(dato)
            giorno = d.Giorno
            mmgiorno = d.Pioggia_mm
        }
    });
    return datiarray
}

export function peroraietogramma(dati) {
    let datiarray = dati.map(d => ({
            x: d.DataOra,
            y: d.Pioggia_mm,
        }))
    return datiarray
}


export function cumula(datiTabella) {
    let cumulated = 0;
    let tabellasist = datiTabella.map(d => {
        cumulated += d.Pioggia_mm;
        return {
            x: d.DataOra,
            y: cumulated
        };
    });
    return tabellasist
}


export function formattaDataPerQuery(unixTimestamp) {
    const date = new Date(unixTimestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}




export function formatUnixToDateTime(unixTimestamp) {
    const date = new Date(unixTimestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function getmindate(table) {
    if (table == null) {
        return "2025-01-01"
    }
    let primorecord
    let result = table.queryFeatures({
        where: "1=1",
        outFields: ["*"],
        returnGeometry: false,
    }).then((result) => {
        if (result.features.length > 0) {
            primorecord = result.features[0].attributes;
            console.log("mindate." + formattaDataPerQuery(primorecord.DataOra));
            return formattaDataPerQuery(primorecord.DataOra)
        } else {
            console.log("Nessun record trovato.");
        }
    })
    return result
}

export function getmaxdate(table) {
    if (table == null) {
        return "2025-01-01"
    }
    let ultimorecord
    let result = table.queryFeatures({
        where: "1=1",
        outFields: ["*"],
        orderByFields: ["OBJECTID DESC"],
        returnGeometry: false,
        num: 1
    }).then((result) => {
        if (result.features.length > 0) {
            ultimorecord = result.features[0].attributes;
            console.log("mindate." + formattaDataPerQuery(ultimorecord.DataOra));
            return formattaDataPerQuery(ultimorecord.DataOra)
        } else {
            console.log("Nessun record trovato.");
        }
    })
    return result
}

export function pergiorno(dati) {
    let datiarray = [];
    let x;
    let y;
    let giorno = dati[0].Giorno
    let mmgiorno = 0
    dati.forEach(d => {
        if (d.Giorno == giorno) {
            mmgiorno = mmgiorno + d.Pioggia_mm
        } else {
            let dato = { x, y }
            dato.y = mmgiorno;
            dato.x = giorno;
            datiarray.push(dato)
            giorno = d.Giorno
            mmgiorno = d.Pioggia_mm
        }
    });
    return datiarray
}

export function differenzaMinoreDiQuattroGiorni(data1, data2) {
    const msPerGiorno = 24 * 60 * 60 * 1000;

    // Assicurati che siano oggetti Date
    const d1 = new Date(data1);
    const d2 = new Date(data2);

    const differenza = Math.abs(d1 - d2);
    const giorniDifferenza = differenza / msPerGiorno;

    return giorniDifferenza <= 4;
}