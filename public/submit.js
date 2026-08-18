// =====================================
// BoardingPassMuseum
// submit.js P1
// 登录 + 全球航司机场搜索
// =====================================


// =====================================
// 登录检查
// =====================================

if(!currentUser){

    alert(
        "请登录后再投稿"
    );

    window.location.href =
    "login.html";

}



// =====================================
// 数据
// =====================================

let airlines = [];

let airports = [];


let selectedAirline = null;

let selectedAirport = null;



// =====================================
// 页面元素
// =====================================

const airlineInput =
document.getElementById(
    "airlineSearch"
);


const airlineResults =
document.getElementById(
    "airlineResults"
);



const airportInput =
document.getElementById(
    "departureSearch"
);



const airportResults =
document.getElementById(
    "departureResults"
);



const submitBtn =
document.getElementById(
    "submitBtn"
);




// =====================================
// 加载航司数据库
// =====================================


fetch(
    "/data/airlines-global.json"
)

.then(
    res => res.json()
)

.then(
    data => {

        airlines = data;


        console.log(
            "航司数据:",
            airlines.length
        );


    }

)

.catch(
    err => {

        console.error(
            "航司加载失败",
            err
        );

    }
);





// =====================================
// 加载机场数据库
// =====================================


fetch(
    "/data/airports-global.json"
)

.then(
    res => res.json()
)

.then(
    data => {

        airports = data;


        console.log(
            "机场数据:",
            airports.length
        );


    }

)

.catch(
    err => {

        console.error(
            "机场加载失败",
            err
        );

    }
);






// =====================================
// 航司搜索
// =====================================


if(airlineInput){


airlineInput.addEventListener(
"input",

function(){


selectedAirline = null;


searchList(

this.value,

airlines,

airlineResults,

"airline"

);



}


);


}






// =====================================
// 机场搜索
// =====================================


if(airportInput){


airportInput.addEventListener(
"input",

function(){


selectedAirport = null;


searchList(

this.value,

airports,

airportResults,

"airport"

);



}


);


}






// =====================================
// 搜索函数
// =====================================


function searchList(

keyword,

data,

container,

type

){



if(!container)
return;



const text =

keyword
.toLowerCase()
.trim();



container.innerHTML = "";



if(!text)
return;





const results =

data.filter(

item => {


const target = [

item.name_cn || "",

item.name_en || "",

item.iata || "",

item.icao || ""

]

.join(" ")

.toLowerCase();



return target.includes(text);



}

);





results
.slice(0,10)
.forEach(

item => {


const div =
document.createElement(
"div"
);



div.className =
"search-result";





div.innerHTML = `


<strong>

${item.name_cn || item.name_en || ""}

</strong>


<br>


<span>

${item.name_en || ""}

</span>


<br>


<small>

IATA:
${item.iata || "-"}

/

ICAO:
${item.icao || "-"}

</small>


`;







div.onclick = function(){



if(type==="airline"){


selectedAirline = item;


airlineInput.value =
displayName(item);



}



if(type==="airport"){


selectedAirport = item;


airportInput.value =
displayName(item);



}



container.innerHTML = "";



};




container.appendChild(div);



}

);



}






// =====================================
// 显示名称
// =====================================


function displayName(item){


if(!item)
return "";



let name =

item.name_cn
||
item.name_en
||
"";



if(item.iata){


name +=
" ("+
item.iata+
")";


}



return name;



}
// =====================================
// BoardingPassMuseum
// submit.js P2
// 图片处理 + 水印 + 投稿
// =====================================




// =====================================
// 提交按钮
// =====================================


if(submitBtn){


submitBtn.onclick = submitFlight;


}






// =====================================
// 提交投稿
// =====================================


async function submitFlight(){



try{



// -------------------------
// 检查选择
// -------------------------


if(!selectedAirline){


alert(
"请选择航空公司"
);


return;


}



if(!selectedAirport){


alert(
"请选择出发机场"
);


return;


}







// -------------------------
// 基础信息
// -------------------------


const flightInput =

document.getElementById(
"flight"
);



const dateInput =

document.getElementById(
"date"
);



const storyInput =

document.getElementById(
"story"
);



const imageInput =

document.getElementById(
"ticketImage"
);







const flight =

flightInput.value.trim();





if(!flight){


alert(
"请输入航班号"
);


return;


}




if(!dateInput.value){


alert(
"请选择日期"
);


return;


}






// -------------------------
// 图片
// -------------------------


const canvas =

document.getElementById(
"watermarkCanvas"
);





if(!canvas || canvas.width===0){


alert(
"请先上传并处理图片"
);


return;


}






const image =

canvas.toDataURL(

"image/jpeg",

0.9

);






// -------------------------
// 创建投稿数据
// -------------------------


let flightData = {


id:

Date.now(),

user_id:
1,


author:

currentUser.username,



authorEmail:

currentUser.email,




airline:

displayName(
selectedAirline
),



airline_iata:

selectedAirline.iata
||
"",



airline_icao:

selectedAirline.icao
||
"",






airport:

displayName(
selectedAirport
),



airport_iata:

selectedAirport.iata
||
"",



airport_icao:

selectedAirport.icao
||
"",






flight:

flight,



date:

dateInput.value,



story:

storyInput.value.trim(),



image:

image,



status:

"pending"



};







// -------------------------
// 保存投稿
// -------------------------




console.log(
"发送JSON:",
JSON.stringify(flightData)
);



await fetch(
API_BASE + "/api/submit",
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(
flightData
)

}
)
.then(
res=>res.json()
)
.then(
data=>{

console.log(
"投稿结果:",
data
);

}
);






alert(

"投稿成功！\n已进入管理员审核队列"

);






resetSubmitForm();





}

catch(error){



console.error(

"投稿错误:",

error

);



alert(

"投稿失败，请查看控制台"

);



}



}







// =====================================
// 清空表单
// =====================================


function resetSubmitForm(){



selectedAirline = null;


selectedAirport = null;





if(airlineInput)

airlineInput.value="";



if(airportInput)

airportInput.value="";





if(airlineResults)

airlineResults.innerHTML="";



if(airportResults)

airportResults.innerHTML="";







const flightInput =

document.getElementById(
"flight"
);



const dateInput =

document.getElementById(
"date"
);



const storyInput =

document.getElementById(
"story"
);



const imageInput =

document.getElementById(
"ticketImage"
);






if(flightInput)

flightInput.value="";



if(dateInput)

dateInput.value="";



if(storyInput)

storyInput.value="";



if(imageInput)

imageInput.value="";



}