import '../style.css'
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import { Chart } from 'chart.js/auto';
import PopupTemplate from "@arcgis/core/PopupTemplate";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';

const webmap = new WebMap({
    portalItem: {
        id: "07696c5b72e64125ae75f65226471f60"
    }
});
let datiTabella = [];

webmap.load().then(() => {
    console.log("WebMap caricata");

    const tables = webmap.tables;

    if (tables.length === 0) {
        console.log("Nessuna tabella nella webmap");
        return;
    }

    const inizio = new Date('1941-01-01')
    const fine = new Date('1941-01-03')
    console.log(inizio)
    console.log(fine)


    const tutteLeQuery = tables.map(table => {
        console.log(table);

        return table.queryFeatures({
            where: "DataOra BETWEEN \'" + formattaData(inizio) + "\' AND \'" + formattaData(fine) + "\'",
            outFields: ["*"],
            returnGeometry: false
        }).then(result => {

            return result.features.map(f => ({ ...f.attributes }));
        });
    });

    // Aspetta tutte le query
    Promise.all(tutteLeQuery).then(resultatiQuery => {
        // Unisci tutto in un unico array
        datiTabella = resultatiQuery.flat();
        const filtered = datiTabella.filter(d => d.DataOra != null);

        const datiGrafico = filtered
            .map(d => ({
                x: d.DataOra,
                y: Number(d.Pioggia_mm)
            }));







    });
});

function formattaData(data) {
    const yyyy = data.getFullYear();
    const mm = String(data.getMonth() + 1).padStart(2, '0'); // Mese da 1 a 12
    const dd = String(data.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}


function pergiorno(dati) {
    let datiarray = [];
    let x;
    let y;

    let giorno = dati[0].Giorno;
    let mmgiorno = 0;
    dati.forEach(d => {
        if (d.Giorno == giorno) {
            mmgiorno = mmgiorno + d.Pioggia_mm;
            console.log
        } else {
            let dato = { x, y };
            dato.y = mmgiorno;
            dato.x = giorno;
            datiarray.push(dato);
            giorno = d.Giorno;
            mmgiorno = d.Pioggia_mm;
        }
    });
    console.log(datiarray)
    return datiarray;
}