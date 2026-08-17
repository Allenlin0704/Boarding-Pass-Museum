let flights = [];


// =====================
// 优先读取审核通过展品
// =====================


const savedFlights =

JSON.parse(

localStorage.getItem(
"flights"
)

);



if(savedFlights && savedFlights.length > 0){


flights = savedFlights;


renderMuseum();


}

else{


let savedFlights =
JSON.parse(
    localStorage.getItem("flights")
)
||
null;



if(savedFlights){

    flights =
        savedFlights;

    renderMuseum();


}

else{


fetch("/data/flights.json")


.then(res=>res.json())


.then(data=>{


flights =
data;


renderMuseum();


});


}


}




// =====================
// 展厅渲染
// =====================


function renderMuseum(){


const museum =

document.getElementById(
"museum"
);



if(!museum)
return;



museum.innerHTML="";



flights.forEach(
(flight,index)=>{


let card =

document.createElement("div");



card.className="card";



card.onclick=function(){


location.href =

`detail.html?id=${index}`;


};



card.innerHTML = `

<img
src="${flight.image || ''}"
class="ticket-image"
>


<span class="tag">
${flight.airline || "Unknown Airline"}
</span>


<h3>
${flight.flight || ""}
</h3>


<p>
📍 ${flight.airport || ""}
</p>


<p>
📅 ${flight.date || ""}
</p>


<p class="story">
${flight.story || ""}
</p>


`;



museum.appendChild(card);


});


}