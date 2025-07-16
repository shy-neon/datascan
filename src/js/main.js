var amount = document.getElementById('count');
const presentazione = document.getElementById('presentazione')

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
        descrizione(i)
        
        // Rimuove "selected" da tutti
        for (let j = 0; j < profs.length; j++) {
            profs[j].classList.remove("selected");
            
        }
        // Aggiunge "selected" solo a quello cliccato
        this.classList.add("selected");
    });
}

function descrizione (caso ) {
    switch (caso){
        case 0:
            presentazione.innerHTML = "1 Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ipsa, rem. Et non repellat ad eum numquam corporis nemo. Sit atque nostrum quos ullam vitae ipsa reprehenderit, voluptatem quibusdam eos Lorem ipsum dolor sit amet consectetur adipisicing elit. Error laudantium obcaecati tempora cupiditate deserunt, reprehenderit enim repellendus explicabo"
        break
        case 1:
             presentazione.innerHTML = "2 Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ipsa, rem. Et non repellat ad eum numquam corporis nemo. Sit atque nostrum quos ullam vitae ipsa reprehenderit, voluptatem quibusdam eos Lorem ipsum dolor sit amet consectetur adipisicing elit. Error laudantium obcaecati tempora cupiditate deserunt, reprehenderit enim repellendus explicabo"
        break
        case 2:
             presentazione.innerHTML = "3 Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ipsa, rem. Et non repellat ad eum numquam corporis nemo. Sit atque nostrum quos ullam vitae ipsa reprehenderit, voluptatem quibusdam eos Lorem ipsum dolor sit amet consectetur adipisicing elit. Error laudantium obcaecati tempora cupiditate deserunt, reprehenderit enim repellendus explicabo"
        break
        case 3:
             presentazione.innerHTML = "4 Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ipsa, rem. Et non repellat ad eum numquam corporis nemo. Sit atque nostrum quos ullam vitae ipsa reprehenderit, voluptatem quibusdam eos Lorem ipsum dolor sit amet consectetur adipisicing elit. Error laudantium obcaecati tempora cupiditate deserunt, reprehenderit enim repellendus explicabo"
        break
    }
}