var amount = document.getElementById('count');

let profs = document.getElementsByClassName('prof')
var current = 0;

update();

function update() {
    amount.innerText = current.toLocaleString("en-US");
}


setInterval(function () {
    if (current < 3440000) {
        current = current + 4523
    }
    update();
}, 0.0001);

console.log(profs)

for (let i = 0; i < profs.length; i++) {
    profs[i].addEventListener("click", function () {
        // Rimuove "selected" da tutti
        for (let j = 0; j < profs.length; j++) {
            profs[j].classList.remove("selected");
        }
        // Aggiunge "selected" solo a quello cliccato
        this.classList.add("selected");
    });
}

