
require([
      "esri/WebMap",
      "esri/views/MapView",
      "esri/widgets/FeatureTable",
      "esri/core/reactiveUtils"
    ], function(WebMap, MapView, FeatureTable, reactiveUtils) {

      var webmap = new WebMap({
        portalItem: {
          id: "07696c5b72e64125ae75f65226471f60"  // Inserisci qui l’ID della tua WebMap
        }
      });

      var view = new MapView({
        container: "viewDiv",
        map: webmap
       
      });

      webmap.when(() => {
        if (webmap.tables.length === 0) {
          alert("La WebMap non contiene tabelle!");
          return;
        }

        var tableLayer = webmap.tables.getItemAt(0);

        var featureTable = new FeatureTable({
          view: view,
          layer: tableLayer,
          container: "tableDiv"
        });
      
      reactiveUtils.when(() => view.popup.selectedFeature != null, () => {
        const selectedFeature = view.popup.selectedFeature;
        if (!selectedFeature) return;

        // Prendo il valore del campo "nomeElemento"
        const idcentralina = selectedFeature.attributes.ID_Centralina;
        console.log(idcentralina)
        if (!idcentralina) {
            // Se campo mancante, resetto filtro
            featureTable.filterGeometry = null;
            featureTable.filterDefinitionExpression = null;
            
            return;
          }

          featureTable.layer.definitionExpression = `ID_Centralina = '${idcentralina.replace(/'/g,"''")}'`;
    });

    downloadBtn.addEventListener("click", async () => {

  const query = featureTable.layer.createQuery();
  query.where = featureTable.layer.definitionExpression || "1=1"; 
  query.outFields = ["*"];
  query.returnGeometry = false;

  const result = await featureTable.layer.queryFeatures(query);
  const features = result.features;

  if (features.length === 0) {
    alert("Nessun dato da scaricare");
    return;
  }
 
  const csv = featuresToCSV(features);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dati_featuretable.csv";
  a.click();
  URL.revokeObjectURL(url);
});

function featuresToCSV(features) {
  if (features.length === 0) return "";

  // Prendo i nomi campi dal primo elemento
  const fields = Object.keys(features[0].attributes);
  
  // Riga intestazione
  const header = fields.join(",") + "\n";

  // Riga dati
  const rows = features.map(f => {
    return fields.map(field => {
      let val = f.attributes[field];
      if (val === null || val === undefined) val = "";
      else if (typeof val === "string" && val.includes(",")) {
        val = `"${val.replace(/"/g, '""')}"`; // escape virgolette e metto tra doppi apici
      }
      return val;
    }).join(",");
  }).join("\n");

  return header + rows;
}

 });

 });


    