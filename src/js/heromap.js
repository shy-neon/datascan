
require([
  "esri/WebMap",
  "esri/views/MapView",
  "esri/widgets/FeatureTable",
  "esri/core/reactiveUtils",
  "esri/layers/support/ImageElement"
], function (WebMap, MapView, FeatureTable, reactiveUtils, ImageElement) {

  var webmap = new WebMap({
    portalItem: {
      id: "07696c5b72e64125ae75f65226471f60"  // Inserisci qui l’ID della tua WebMap
    }
  });

  var view = new MapView({
    container: "viewDiv",
    map: webmap,
    constraints: {
      minZoom: 4,
      maxZoom: 4
    },


  });




  view.ui.remove("zoom");
  view.ui.remove("OUTLINE");

  view.on("mouse-wheel", (event) => event.stopPropagation());
  view.on("click", (event) => event.stopPropagation());
  view.on("drag", (event) => event.stopPropagation());
  view.on("double-click", (event) => event.stopPropagation());
  view.on("double-click", ["Control"], (event) => event.stopPropagation());

  view.when(function () {
    view.goTo(
      {
        center: [-7.48, 41.74],
        zoom: 10
      },
      {
        duration: 4000 // 4 secondi
      }
    );
  });
})


