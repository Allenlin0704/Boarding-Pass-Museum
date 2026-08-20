async function hashPassword(password){
const data =
await crypto.subtle.digest(
"SHA-256",
new TextEncoder().encode(password)
);

console.log(
Buffer.from(data).toString("hex")
);

}

hashPassword("test1234");
