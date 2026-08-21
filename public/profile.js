const user =

JSON.parse(

localStorage.getItem(
"currentUser"
)

);



if(!user){


showToast(
"请先登录"
);


window.location.href =
"login.html";


}



else{


document.getElementById(
"username"
).innerHTML =
user.username;



document.getElementById(
"email"
).innerHTML =
user.email;



const favorites =

JSON.parse(

localStorage.getItem(
"favoriteFlights"
)

)

|| [];



document.getElementById(
"favoriteCount"
).innerHTML =
favorites.length;



const submits =

JSON.parse(

localStorage.getItem(
"pendingFlights"
)

)

|| [];



document.getElementById(
"submitCount"
).innerHTML =
submits.length;



}