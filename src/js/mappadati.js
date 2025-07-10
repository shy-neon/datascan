import '../style.css'
import "@arcgis/map-components/components/arcgis-map";

import "@arcgis/map-components/components/arcgis-zoom";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import { Chart } from 'chart.js/auto';
import PopupTemplate from "@arcgis/core/PopupTemplate";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { Italian } from "flatpickr/dist/l10n/it.js";
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { resolve } from 'chart.js/helpers';
import 'chartjs-adapter-date-fns';
import { get } from 'jquery';

const ctx = document.getElementById('graficoTorta').getContext('2d');
const cumul = document.getElementById('cumulata').getContext('2d');
const iet = document.getElementById('ietogramma').getContext('2d');
const info = document.getElementById('info')
const sel = document.getElementById('sel')
const mappa = document.getElementById('viewDiv')
const dat = document.getElementById('datediv')

const med = document.getElementById('media')
const scart = document.getElementById('SQM')


function calcolaMediaPioggia(array) {
  if (!array.length) {
    throw new Error("Array vuoto");
  }

  // Filtra solo quelli che hanno Pioggia_mm numerico
  const piogge = array
    .map(item => item.Pioggia_mm)
    .filter(val => typeof val === "number" && !isNaN(val));

  if (!piogge.length) {
    throw new Error("Nessun valore numerico Pioggia_mm trovato");
  }

  const somma = piogge.reduce((acc, val) => acc + val, 0);
  const media = somma / piogge.length;
  med.innerHTML = media.toFixed(3)
  return media;
}

function calcolaMediaESqmPioggia(array) {
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



if (window.matchMedia("(min-width:1080px)").matches) {
  mappa.style.width = "185%"
  dat.style.display = "hidden"
} else {
  console.log("Siamo sotto sm (base)");
  mappa.style.width = "100%"
  mappa.style.height = "190%";
  dat.style.display = "none"

}

let tabel = null;

let cal = flatpickr("#datePicker", {
  inline: true,
  mode: "range",
   locale: Italian,
  onChange: function(selectedDates, dateStr, instance) {
    console.log(dateStr)
    if(selectedDates.length >= 2){
      let query = ("DataOra BETWEEN '" + dateStr.substring(0,10) + "' AND '" +  dateStr.substring(14,25) + "'")
      console.log(query)
      graficocumulata(cumul, tabel, query)
      graficoietogramma(iet, tabel, query)
      if(query == null){
        tabella(tabel, "1=1")
      }else {
        tabella(tabel, query)
      }
    }
  }
});

const webmap = new WebMap({
  portalItem: {
    id: "07696c5b72e64125ae75f65226471f60",
    popupEnabled: false
  }
});

const view = new MapView({
  container: "viewDiv",
  map: webmap
});



view.when(() => {
  // Trova il layer interessato
  const layer = view.map.layers.find(l => l.title === "Centraline");

  if (layer) {
    layer.popupEnabled = false;


    const inizio = new Date('1941-01-01')
    const fine = new Date('1941-01-03')
    console.log(inizio)
    console.log(fine)



    // Cattura il click sulla mappa
    view.on("click", async (event) => {
      const response = await view.hitTest(event);
      const result = response.results.find(r => r.graphic?.layer === layer);

      if (result) {
        const clickedGraphic = result.graphic;

        // Usa OBJECTID per ricaricare la feature completa
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

          
          grafico([fullFeature.attributes["Attenzionati"], fullFeature.attributes["Malfunzionanti"], fullFeature.attributes["Zero_Pioggia"], fullFeature.attributes["Discordanti"], (fullFeature.attributes["Cart_Elaborati"] - fullFeature.attributes["Attenzionati"] - fullFeature.attributes["Malfunzionanti"] - fullFeature.attributes["Zero_Pioggia"] - fullFeature.attributes["Discordanti"])], ctx)

          console.log(fullFeature.attributes["ID_Centralina"])
          tabel = webmap.tables.find(t => t.title === fullFeature.attributes["ID_Centralina"])
          console.log(tabel)
           dat.style.display = "absolute"

          
          tabella(tabel, "1=1")
          calcolaSpan(tabel)

          console.log(getmindate(tabel))
          
          
          if (window.matchMedia("(min-width:1080px)").matches) {
            
            
          } else {
            mappa.style.height = "100%"
            dat.style.display = "block"

          }

          viewDiv.style.width = "100%";
          info.style.visibility ="visible";
          sel.style.visibility ="hidden";
          setMinDateFromAPI();
          
          graficocumulata(cumul, tabel, "1=1")
          graficoietogramma(iet, tabel, "1=1")
        }
      }
    });
  }
});

function calcolaSpan(tabella) {
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
          const spanval = (formattaData( new Date(primorecord.DataOra)) + " ~ " + formattaData( new Date(ultimoRecord.DataOra)))
          span.innerHTML = spanval
          return [formattaData( new Date(primorecord.DataOra)), formattaData( new Date(ultimoRecord.DataOra))]
        } else {
          console.log("Nessun record trovato.");
        }
      })

    } else {
      console.log("Nessun record trovato.");
    }
  })

 
}

function tabella(tabel, where) {
  let datiTabella = [];
  tabel.queryFeatures({
    where: where,
    outFields: ["*"],
    returnGeometry: false
  }).then(result => {
    datiTabella = result.features.map(f => ({ ...f.attributes }));

    calcolaMediaESqmPioggia(datiTabella);

    let tabellasist = datiTabella.map(d => ({
      data: formatUnixToDateTime(d.DataOra),
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
        { title: "Cartellino", field: "cartellino" }
      ],

      layout: "fitColumns",
    });
  });
}

function grafico(dati, ctx) {

  const existingChart = Chart.getChart("graficoTorta");

  if (existingChart) {
    existingChart.data.datasets[0].data = dati;
    existingChart.update();
    return;
  }

  const graficoTorta = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Attenzionare', 'Malfunzionanti', 'Zero Pioggia', 'Discordanti', 'Elaborati'],
      datasets: [{
        
        data: dati,
        backgroundColor: [
          'rgba(96, 165, 250, 0.6)',   // funzionanti
          'rgba(234, 179, 8, 0.6)',   // da attenzionare
          'rgba(239, 68, 68, 0.6)',   // malfunzionanti
          'rgba(209, 213, 219, 0.6)', // zero pioggia
          'rgba(30, 64, 175, 0.6)'   // zdiscordanti
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          maxHeight: 100,
          align: "center",
          position: 'right'
        },
        title: {
          text: 'Grafico Cartellini'
        }
      }
    }
  });
}

function formattaData(data) {
  const yyyy = data.getFullYear();
  const mm = String(data.getMonth() + 1).padStart(2, '0'); // Mese da 1 a 12
  const dd = String(data.getDate()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy}`;
}

function graficoPrecipitazione(graf, tabel, where) {
  let datiTabella = [];
  const existingChart = Chart.getChart("precipitazioni");

  if (existingChart) {
    tabel.queryFeatures({
    where: where,
    outFields: ["*"],
    returnGeometry: false
    }).then(result => {
      datiTabella = result.features.map(f => ({ ...f.attributes }));
      existingChart.data.datasets[0].data = pergiorno(datiTabella);
      existingChart.update();
    return;
    });
    return;
  }

  tabel.queryFeatures({
    where: "1=1",
    outFields: ["*"],
    returnGeometry: false
  }).then(result => {
    datiTabella = result.features.map(f => ({ ...f.attributes }));
    let tabellasist = datiTabella.map(d => ({
      x: d.DataOra,
      y: d.Pioggia_mm,
    }))

    const graficoTorta = new Chart(graf, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Pioggia in mm',
        data: pergiorno(datiTabella),
        backgroundColor: '#1266CD',
        borderWidth: 0
      }]
    },
    options: {
      parsing: false,
      scales:{
        x: {
          type: 'time',
          time: {
            unit: 'day',
          }
        },
        y: {
          title: {
            display: true,
            text: 'mm'
          }
        }
      }
    },
    plugins: [shadowPlugin]
  });
  });

  
}

function pergiorno (dati) {
  let datiarray = [];
  let x;
  let y;
  let giorno = dati[0].Giorno
  let mmgiorno = 0
  dati.forEach(d => {
    if(d.Giorno == giorno){
      mmgiorno = mmgiorno + d.Pioggia_mm
    } else {
      let dato = {x,y}
      dato.y = mmgiorno;
      dato.x = giorno;
      datiarray.push(dato)
      giorno = d.Giorno
      mmgiorno = d.Pioggia_mm
    }
  });
  return datiarray
}

const shadowPlugin = {
    id: 'shadowLine',
    beforeDatasetsDraw(chart, args, options) {
        const { ctx } = chart;
        ctx.save();
        ctx.shadowColor = options.shadowColor || 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = options.shadowBlur || 10;
        ctx.shadowOffsetX = options.shadowOffsetX || 0;
        ctx.shadowOffsetY = options.shadowOffsetY || 4;
    },
    afterDatasetsDraw(chart, args, options) {
        chart.ctx.restore();
    }
};

function graficocumulata(graf, tabel, where) {
  
  const existingChart = Chart.getChart("cumulata");
let datiTabella = [];
  if (existingChart) {
    tabel.queryFeatures({
    where: where,
    outFields: ["*"],
    returnGeometry: false
    }).then(result => {
      datiTabella = result.features.map(f => ({ ...f.attributes }));
      let cumulata = 0;
      let dati = cumula(datiTabella);
      existingChart.data.datasets[0].data = dati;
      existingChart.update();
    return;
    });
    return;
  }

  tabel.queryFeatures({
    where: "1=1",
    outFields: ["*"],
    returnGeometry: false
  }).then(result => {
    let cumulated = 0;
    datiTabella = result.features.map(f => ({ ...f.attributes }));
    let tabellasist = datiTabella.map(d => {
    cumulated += d.Pioggia_mm;
    return {
        x: d.DataOra,
        y: cumulated
    };
  });

    const graficoTorta = new Chart(graf, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Pioggia in mm',
        data: tabellasist,
        backgroundColor: '#1266CD',
        spanGaps: true,
        borderWidth: 0
      }]
    },
    options: {
      parsing: false,
      scales:{
        x: {
          type: 'time',
          time: {
            unit: 'day',
          }
        },
        y: {
          title: {
            display: true,
            text: 'mm'
          }
        }
      }
    },
  });
  });

  
}

function graficoietogramma(graf, tabel, where) {
  
  const existingChart = Chart.getChart("ietogramma");
  let datiTabella = [];
  if (existingChart) {
    tabel.queryFeatures({
    where: where,
    outFields: ["*"],
    returnGeometry: false
    }).then(result => {
      datiTabella = result.features.map(f => ({ ...f.attributes }));
      existingChart.data.datasets[0].data = pergiornoietogramma(datiTabella);
      existingChart.update();
    return;
    });
    return;
  }

  tabel.queryFeatures({
    where: "1=1",
    outFields: ["*"],
    returnGeometry: false
  }).then(result => {
    datiTabella = result.features.map(f => ({ ...f.attributes }));
    let tabellasist = datiTabella.map(d => ({
      x: d.DataOra,
      y: d.Pioggia_mm,
    }))

    const graficoTorta = new Chart(graf, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Pioggia in mm',
        data: pergiornoietogramma(datiTabella),
        backgroundColor: '#1266CD',
        borderWidth: 0
      }]
    },
    options: {
      parsing: false,
      scales:{
        x: {
          type: 'time',
          time: {
            unit: 'day',
          }
        },
        y: {
          title: {
            display: true,
            text: 'mm/h'
          }
        }
      }
    },
    plugins: [shadowPlugin]
  });
  });

  
}

function pergiornoietogramma (dati) {
  let datiarray = [];
  let x;
  let y;
  let giorno = dati[0].Giorno
  let mmgiorno = 0
  dati.forEach(d => {
    if(d.Giorno == giorno){
      mmgiorno = mmgiorno + d.Pioggia_mm
    } else {
      let dato = {x,y}
      dato.y = mmgiorno/24;
      dato.x = giorno;
      datiarray.push(dato)
      giorno = d.Giorno
      mmgiorno = d.Pioggia_mm
    }
  });
  return datiarray
}


function cumula (datiTabella) {
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


function dataselected(){
  console.log(tabel)
}

function formattaDataPerQuery(unixTimestamp) {
   const date = new Date(unixTimestamp); 

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function defquery (query) {
  if(query == null){
    return "1=1"
  } else {
    return query
  }
}

function initdate (table) {

  if(table == null){
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

function formatUnixToDateTime(unixTimestamp) {
    const date = new Date(unixTimestamp); 

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getmindate (table) {
  if(table == null){
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
      console.log("mindate."+ formattaDataPerQuery(primorecord.DataOra));
      return formattaDataPerQuery(primorecord.DataOra)
    } else {
      console.log("Nessun record trovato.");
    }
  })
  return result
}

function getmaxdate (table) {
  if(table == null){
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
      console.log("mindate."+ formattaDataPerQuery(ultimorecord.DataOra));
      return formattaDataPerQuery(ultimorecord.DataOra)
    } else {
      console.log("Nessun record trovato.");
    }
  })
  return result
}

async function setMinDateFromAPI() {
  const minDate = await getmindate(tabel); 
  const maxdate = await getmaxdate(tabel)
  cal.set("minDate", minDate); 
  cal.set("maxDate", maxdate); 
  initdate(tabel)
         
}

const dati = [
  { Data: "2025-07-01", Pioggia_mm: 10, Temp: 30 },
  { Data: "2025-07-02", Pioggia_mm: 5, Temp: 31 },
  { Data: "2025-07-03", Pioggia_mm: 0, Temp: 29 },
];

function esportaCSVdaOggetti(arrayOggetti, nomeFile = "dati.csv") {
  if (!arrayOggetti.length) {
    alert("Nessun dato da esportare.");
    return;
  }

  const intestazioni = Object.keys(arrayOggetti[0]);

  const righe = [
    intestazioni.join(","), // Header
    ...arrayOggetti.map(obj =>
      intestazioni.map(k => JSON.stringify(obj[k] ?? "")).join(",")
    )
  ].join("\n");

  const blob = new Blob([righe], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.getElementById("a");
  a.href = url;
  a.download = nomeFile;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Collega al bottone
document.getElementById("esportaCsvBtn").addEventListener("click", () => {
  esportaCSVdaOggetti(dati, "dati_pioggia.csv");
});