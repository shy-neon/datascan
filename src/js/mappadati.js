import '../style.css'
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { Italian } from "flatpickr/dist/l10n/it.js";
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import 'chartjs-adapter-date-fns';

import * as graph from "./graphfunctions.js"
import * as service from "./services.js"

const ctx = document.getElementById('graficoTorta').getContext('2d');
const cumul = document.getElementById('cumulata').getContext('2d');
const iet = document.getElementById('ietogramma').getContext('2d');

const sel = document.getElementById('sel')
const mappa = document.getElementById('viewDiv')
const dat = document.getElementById('datediv')

const tablediv = document.getElementById("tablediv")
const tabdiv = document.getElementById("graphdiv")
const statdiv = document.getElementById("statdiv")

const appearOC = document.getElementsByClassName("appearOC")
const tuttiDati = document.getElementsByClassName("tuttiDati")

let datas = []

if (window.matchMedia("(min-width:1080px)").matches) {
  mappa.style.width = "185%"
  dat.style.display = "hidden"

} else {
  console.log("Siamo sotto sm (base)");
  mappa.style.width = "100%"
  mappa.style.height = "190%";
  dat.style.display = "none"
  sel.style.display = "none";
  mappa.style.boxShadow = "0px 5px 8px -4px rgba(0, 0, 0, 0.25)"
}

let tabel = null;

export let cal = flatpickr("#datePicker", {
  inline: true,
  mode: "range",
  locale: Italian,
  onChange: function (selectedDates, dateStr, instance) {
    console.log("ciaoo" + dateStr)
    if (selectedDates.length >= 2) {
      let query = ("DataOra BETWEEN '" + dateStr.substring(0, 10) + "' AND '" + dateStr.substring(14, 25) + "'")
      console.log(query)
      graph.graficocumulata(cumul, tabel, query)
      if(service.differenzaMinoreDiQuattroGiorni(new Date(dateStr.substring(0,10)), new Date(dateStr.substring(dateStr.length - 10,dateStr.length)))){
        graph.graficoietogrammaPreciso(iet, tabel, query)
      } else {
        graph.graficoietogramma(iet, tabel, query)
      }
      
      if (query == null) {
        tabella(tabel, "1=1")
      } else {
        tabella(tabel, query)
      }
    }
  }
});

const webmap = new WebMap({
  portalItem: {
    id: "07696c5b72e64125ae75f65226471f60",
    popupEnabled: false
  },

});

const view = new MapView({
  container: "viewDiv",
  map: webmap,
  
   constraints: {
      minZoom: 4,         // livello fisso
      maxZoom: 4
  }
});

view.ui.remove("zoom");
view.on("drag", (event) => event.stopPropagation());



view.when(() => {
  // Trova il layer interessato
  const layer = view.map.layers.find(l => l.title === "Centraline");
  layer.queryFeatures({
    where: "1=1",
    outFields: ["*"],
    returnGeometry: false
  }).then(result => {
    let dati = result.features.map(f => ({ ...f.attributes }));
    console.log(dati);
  });


  if (layer) {
    layer.popupEnabled = false;

    view.on("click", async (event) => {
      const response = await view.hitTest(event);
      const result = response.results.find(r => r.graphic?.layer === layer);

      if (result) {
        const clickedGraphic = result.graphic;

        const objectId = clickedGraphic.attributes[layer.objectIdField];

        const query = layer.createQuery();
        query.objectIds = [objectId];
        query.outFields = ["*"];
        query.returnGeometry = false;

        const { features } = await layer.queryFeatures(query);

        if (features.length > 0) {
          const fullFeature = features[0];
          console.log("Attributi completi:", fullFeature.attributes);

          const nomeLabel = document.getElementById("nome")
          nomeLabel.innerHTML = fullFeature.attributes["Nome_Stazione"]

          const ID_Centralina = document.getElementById("id")
          ID_Centralina.innerHTML = fullFeature.attributes["ID_Centralina"]

          const cartellini = document.getElementById("numero")
          cartellini.innerHTML = fullFeature.attributes["Cart_Elaborati"]


          graph.grafico([fullFeature.attributes["Attenzionati"], fullFeature.attributes["Malfunzionanti"], fullFeature.attributes["Zero_Pioggia"], fullFeature.attributes["Discordanti"], (fullFeature.attributes["Cart_Elaborati"] - fullFeature.attributes["Attenzionati"] - fullFeature.attributes["Malfunzionanti"] - fullFeature.attributes["Zero_Pioggia"] - fullFeature.attributes["Discordanti"])], ctx)

          console.log(fullFeature.attributes["ID_Centralina"])
          tabel = webmap.tables.find(t => t.title === fullFeature.attributes["ID_Centralina"])
          console.log(tabel)

          Array.from(appearOC).forEach(f => {
            if (f.style.visibility === "hidden") {
              f.style.visibility = "visible";
            } else {
              f.style.display = "flex";
            }
          })

          tabella(tabel, "1=1")
          service.calcolaSpan(tabel)

          if (window.matchMedia("(min-width:1080px)").matches) {
            sel.style.display = "none"

          } else {
            mappa.style.height = "100%"
            dat.style.display = "block"

          }

          viewDiv.style.width = "100%";

          sel.style.visibility = "hidden";

          setMinDateFromAPI();
          graph.graficocumulata(cumul, tabel, "1=1")
          graph.graficoietogramma(iet, tabel, "1=1")
          
          let urltuttidati = 'https://www.datascan.it/DatiCentraline/' + fullFeature.attributes["ID_Centralina"] + '.txt'
          document.getElementById('tuttiDati').addEventListener('click', function() {
            window.open(urltuttidati, '_blank');
          });
        }
      }
    });
  }
});

function tabella(tabel, where) {
  let datiTabella = [];
  tabel.queryFeatures({
    where: where,
    outFields: ["*"],
    returnGeometry: false
  }).then(result => {
    datiTabella = result.features.map(f => ({ ...f.attributes }));
    service.calcolaMediaESqmPioggia(datiTabella);
    datas = datiTabella
    let tabellasist = datiTabella.map(d => ({
      data: service.formatUnixToDateTime(d.DataOra),
      mm: d.Pioggia_mm,
      qualita: d.Qualita,
      cartellino: d.Cartellino
    }))

    console.log(tabellasist);

    const table = new Tabulator("#example-table", {
      data: tabellasist,
      height: "300px",
      columns: [
        { title: "Data", field: "data" },
        { title: "mm Pioggia", field: "mm" },
        { title: "Qualita", field: "qualita" },
        {
          title: "Cartellino",
          formatter: function (cell, formatterParams) {
            let row = cell.getRow().getData(); // dati di riga
            return `<a href="https://datascan.it/cartellini/${row.cartellino}.jpg" target="_blank">${row.cartellino}</a>`;
          }
        }
      ],

      layout: "fitColumns",
    });
  });
}

async function setMinDateFromAPI() {
  const minDate = await service.getmindate(tabel);
  const maxdate = await service.getmaxdate(tabel)
  cal.set("minDate", minDate);
  cal.set("maxDate", maxdate);
  initdate(tabel)
}

const btn = document.getElementById("download");

btn.addEventListener("click", () => {
  console.log("ciao " + tabel)
  downloadCSV(datas, "datiPioggia.csv");
});

function convertToCSV(objArray) {
  const array = Array.isArray(objArray) ? objArray : JSON.parse(objArray);
  const header = Object.keys(array[0]).join(",") + "\n";
  const rows = array.map(obj => Object.values(obj).join(",")).join("\n");
  return header + rows;
}

function downloadCSV(array, filename = "data.csv") {
  console.log("cioaa")
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

function initdate(table) {
    if (table == null) {
        cal.jumpToDate(new Date())
    }
    let primorecord;
    table.queryFeatures({
        where: "1=1",
        outFields: ["*"],
        returnGeometry: false,
        num: 1
    }).then((result) => {
        if (result.features.length > 0) {
            primorecord = result.features[0].attributes;
            cal.jumpToDate(new Date(primorecord.DataOra))
        } else {
            console.log("Nessun record trovato.");
        }
    })
}

