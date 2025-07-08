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
import { resolve } from 'chart.js/helpers';


import 'chartjs-adapter-date-fns';

const ctx = document.getElementById('graficoTorta').getContext('2d');
const prec = document.getElementById('precipitazioni').getContext('2d');
const cumul = document.getElementById('cumulata').getContext('2d');
const iet = document.getElementById('ietogramma').getContext('2d');


flatpickr("#datePicker", {
  inline: true,
  mode: "range",
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
          const tabel = webmap.tables.find(t => t.title === fullFeature.attributes["ID_Centralina"])
          console.log(tabel)


          tabella(tabel)
          calcolaSpan(tabel)

          

          graficoPrecipitazione(prec, tabel)
          graficocumulata(cumul, tabel)
          graficoietogramma(iet, tabel)
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
    where: "1=1", // oppure un filtro più specifico
    outFields: ["*"],
    orderByFields: ["OBJECTID DESC"], // cambia con il campo giusto
    returnGeometry: false,
    num: 1 // solo il primo record (cioè l’ultimo in base all'ordinamento)
  }).then((result) => {
    if (result.features.length > 0) {
      ultimoRecord = result.features[0].attributes;
      tabella.queryFeatures({
        where: "1=1", // oppure un filtro più specifico
        outFields: ["*"],
        returnGeometry: false,
        num: 1 // solo il primo record (cioè l’ultimo in base all'ordinamento)
      }).then((result) => {
        if (result.features.length > 0) {
          primorecord = result.features[0].attributes;
          console.log("primo record:", primorecord);
          console.log("Ultimo record:", ultimoRecord);
          const spanval = ("dal " + formattaData( new Date(primorecord.DataOra)) + " al " + formattaData( new Date(ultimoRecord.DataOra)))
          span.innerHTML = spanval
        } else {
          console.log("Nessun record trovato.");
        }
      })

    } else {
      console.log("Nessun record trovato.");
    }
  })
}

function tabella(tabel) {
  let datiTabella = [];
  tabel.queryFeatures({
    where: "1=1",
    outFields: ["*"],
    returnGeometry: false
  }).then(result => {
    datiTabella = result.features.map(f => ({ ...f.attributes }));
    let tabellasist = datiTabella.map(d => ({
      data: formattaData(new Date(d.DataOra)),
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
      labels: ['Attenzionare', 'Malfunzionanti', 'Zero Pioggia', 'Discordanti', 'Regolari'],
      datasets: [{
        label: 'Percentuale di vendite',
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

function graficoPrecipitazione(graf, tabel) {
  let datiTabella = [];
  const existingChart = Chart.getChart("precipitazioni");

  if (existingChart) {
    tabel.queryFeatures({
    where: "1=1",
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

function graficocumulata(graf, tabel) {
  
  const existingChart = Chart.getChart("cumulata");
let datiTabella = [];
  if (existingChart) {
    tabel.queryFeatures({
    where: "1=1",
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

function graficoietogramma(graf, tabel) {
  
  const existingChart = Chart.getChart("ietogramma");
  let datiTabella = [];
  if (existingChart) {
    tabel.queryFeatures({
    where: "1=1",
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