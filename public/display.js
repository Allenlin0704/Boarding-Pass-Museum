// =================================
// BoardingPassMuseum Display Helper
// =================================



function airlineDisplay(item){


if(!item){
    return "";
}


return (

item.name_cn

||

item.name_en

||

item.iata

||

item.icao

||

"Unknown Airline"

);


}




function airportDisplay(item){


if(!item){
    return "";
}


return (

item.name_cn

||

item.name_en

||

item.iata

||

item.icao

||

"Unknown Airport"

);


}




function codeDisplay(item){


if(!item){
    return "";
}


let codes=[];


if(item.iata){

codes.push(
item.iata
);

}


if(item.icao){

codes.push(
item.icao
);

}


return codes.join(
" / "
);


}