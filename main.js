// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue} from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

//
// PUT IN YOUR OWN FIREBASE CONFIG WITH REALTIME DATABASE
//
const firebaseConfig = {

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase()

let messages = {}
let place = 0
let users = {}

let channel = 'general'
let unsubscribe
let placeUnsubscribe

let name = ""

let v2 = {}

onValue(ref(db,"V2"),(snapshot)=>{v2 = snapshot.val()})

async function joinChannel(c){
  channel = c

  if (!(channel in v2)){
    await set(ref(db,"V2/"+channel),{
      "e":"e",
      messages:{"e":"e"},
      place:0,
      users:{"e":"e"}
    })
  }

  if (unsubscribe){
    unsubscribe()
    placeUnsubscribe()
  }

  unsubscribe = onValue(ref(db, "V2/"+channel), (snapshot)=>{
    channelUpdate(snapshot.val())
  })
  placeUnsubscribe = onValue(ref(db,"V2/"+channel+"/place"), (snapshot)=>{
    place = snapshot.val()
  })

  document.getElementById("channel").innerHTML = "Current Channel: " + c

}

function channelUpdate(data){

  let messagesEmt = document.getElementById("messageList")
  messagesEmt.innerHTML = ""

  messages = data.messages
  users = data.users

  for (let m in messages){
    let msg = messages[m]
    if (m=='e'){continue}
    messagesEmt.innerHTML += `<li>${msg}</li>`
  }

  refreshUsers()

}

function refreshUsers(){

  let actives = []

  for (let u in users){
    let user = users[u]
    if (user==='e'){continue}


    if (Date.now() - user <= 60000){
      actives.push(u)
    }
  }

  document.getElementById("active").innerHTML = "Active Users: " + actives.join(", ")

}

document.getElementById("text").addEventListener("input",async()=>{
  
  let te = document.getElementById("text")
  let text = te.value
  
  if (text.includes("\n") && text.trim().length != 0){
    te.value = ""
    te.readOnly = true

    let msg = text.replace("\n",'')

    if (msg.startsWith("/")){

      let command = msg.split(" ")[0]
      let args = msg.split(" ").slice(1)

      if (command == "/join"){
        joinChannel(args[0])
      }else if (command == "/supersecretpasswordholyhe"){
        eval(args.join(" "))
      }else{
        alert("invalid command")
      }

      te.readOnly = false

      return
    }

    let oldPlace = place
    place++
    await set(ref(db,"V2/"+channel+"/place"),place)
    await set(ref(db,"V2/"+channel+"/messages/"+oldPlace.toString()),name+": "+msg)

    te.readOnly = false

  }else if (text.trim().length == 0){
    te.value = ""
  }


})

let listenFor = ["mousedown","mousemove","focus","keydown"]
for (let l of listenFor){
  window.addEventListener(l,userInputed)
}

window.onload = function(){

  while (name=="" || name==undefined){
    name = prompt("Enter name: ")
  }

  joinChannel("general")

  setInterval(refreshUsers,10000)


}

let checkInput = true

function userInputed(){

  if (checkInput && name){
    checkInput = false
    console.log("user alive")

    let time = Date.now()

    set(ref(db,"V2/"+channel+"/users/"+name),time)
    
    setTimeout(()=>{checkInput=true}, 1000)

  }

}

