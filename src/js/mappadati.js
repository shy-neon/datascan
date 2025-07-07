import '../style.css'
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import { Chart } from 'chart.js/auto';
import PopupTemplate from "@arcgis/core/PopupTemplate";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";



const ctx = document.getElementById('graficoTorta').getContext('2d');

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

      
      tabella([fullFeature.attributes["Attenzionati"], fullFeature.attributes["Malfunzionanti"], fullFeature.attributes["Zero_Pioggia"], fullFeature.attributes["Discordanti"], ( fullFeature.attributes["Cart_Elaborati"]- fullFeature.attributes["Attenzionati"]-  fullFeature.attributes["Malfunzionanti"] -fullFeature.attributes["Zero_Pioggia"] - fullFeature.attributes["Discordanti"])], ctx)

      console.log("Cart_elaborati:", fullFeature.attributes["Cart_elaborati"]);
    }
  }

   var tableLayer = webmap.tables.getItemAt(0);

      var featureTable = new FeatureTable({
        view: view,
        layer: tableLayer,
        container: "tableDiv"
      });

     
});

  }
});


function tabella (dati, ctx) {

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
          label: 'Percentuale di vendite',
          data: dati,
          backgroundColor: [
             'rgba(96, 165, 250, 0.6)',   // blu deciso - funzionanti
  'rgba(234, 179, 8, 0.6)',   // giallo semaforo - da attenzionare
  'rgba(239, 68, 68, 0.6)',   // rosso semaforo - malfunzionanti
  'rgba(209, 213, 219, 0.6)', // grigio medio - zero pioggia
  'rgba(30, 64, 175, 0.6)'   // verde semaforo scuro - discordanti
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