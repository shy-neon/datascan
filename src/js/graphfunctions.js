import '../style.css'
import "@arcgis/map-components/components/arcgis-map";

import "@arcgis/map-components/components/arcgis-zoom";
import { Chart } from 'chart.js/auto';
import "flatpickr/dist/flatpickr.min.css";
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import 'chartjs-adapter-date-fns';
import * as service from "./services.js"

export let datas = [];

export function grafico(dati, ctx) {

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


export function tabella(tabel, where) {
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
                        return `<a href="https://datascan.it/DatiCentraline/Bovolenta/${row.cartellino}.jpg" target="_blank">${row.cartellino}</a>`;
                    }
                }
            ],

            layout: "fitColumns",
        });
    });
}


export function graficocumulata(graf, tabel, where) {

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
            let dati = service.cumula(datiTabella);
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
                plugins: {
                    dragData: {
                        round: 1,
                        showTooltip: true,
                        onDragEnd: (e, datasetIndex, index, value) => {
                            console.log(`Nuovo valore: ${value}`);
                        }
                    }
                },
                parsing: false,
                scales: {
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


export function graficoietogramma(graf, tabel, where) {

    const existingChart = Chart.getChart("ietogramma");
    let datiTabella = [];
    if (existingChart) {
        tabel.queryFeatures({
            where: where,
            outFields: ["*"],
            returnGeometry: false
        }).then(result => {
            datiTabella = result.features.map(f => ({ ...f.attributes }));
            existingChart.data.datasets[0].data = service.pergiornoietogramma(datiTabella);
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
                    data: service.pergiornoietogramma(datiTabella),
                    backgroundColor: '#1266CD',
                    borderWidth: 0
                }]
            },
            options: {
                parsing: false,
                scales: {
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
            
        });
    });
}


export function graficoietogrammaPreciso(graf, tabel, where) {

    const existingChart = Chart.getChart("ietogramma");
    let datiTabella = [];
    if (existingChart) {
        tabel.queryFeatures({
            where: where,
            outFields: ["*"],
            returnGeometry: false
        }).then(result => {
            datiTabella = result.features.map(f => ({ ...f.attributes }));
            existingChart.data.datasets[0].data = service.peroraietogramma(datiTabella);
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
                    data: tabellasist,
                    backgroundColor: '#1266CD',
                    borderWidth: 0
                }]
            },
            options: {
                parsing: false,
                scales: {
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
            
        });
    });
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
