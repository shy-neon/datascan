var amount = document.getElementById('count');


var current = 0;
var current1 = 0;


update();

function update() {
    amount.innerText = current.toLocaleString("en-US");
  
}

function update1() {
    
}

setInterval(function(){
    if(current < 3440000){
        current = current + 4523
    }
    update();
},0.0001);

