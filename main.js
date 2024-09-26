// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove} from "firebase/database";
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
let muted = {}

let channel = 'general'
let unsubscribe
let placeUnsubscribe

let name = ""

let channelList = []

let showPlace = false

onValue(ref(db,"V2/channelList"),(snapshot)=>{
  channelList = snapshot.val()
  console.log(channelList)
  document.getElementById("channellist").innerHTML = "Channels: " + channelList.join(", ")
  init()
})

let isAdmin = false

function adminify(code){
  
  if (code-1200 == 0){
    isAdmin = true

    for (let e of document.getElementsByClassName("admin")){
      e.style.display = 'block';
    }

  }

}

async function joinChannel(c){
  checkInput = true
  if(checkInputTimer){
    clearTimeout(checkInputTimer)
  }

  channel = c
  console.log('joining channel '+c)
  if (!(channelList.includes(channel))){

    console.log("creating ",channel)

    await set(ref(db,"V2/"+channel),{
      "e":"e",
      messages:{"e":"e"},
      place:0,
      users:{"e":"e"},
      muted:{"e":false}
    })
    channelList.push(channel)
    await set(ref(db,"V2/channelList"),channelList)
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
  
  let e = document.getElementById("messages")

  let newOrNo = Object.keys(messages).length < Object.keys(data.messages).length

  messages = data.messages
  users = data.users
  muted = data.muted

  for (let m in messages){
    if (m=='e'){continue}

    let msg = messages[m]
    if ("whisperTo" in msg){
      if (name == msg.whisperTo || name == msg.name || isAdmin){
        messagesEmt.innerHTML += `<li><i>${msg.name} message to ${msg.whisperTo}: ${msg.msg}</i></li>`
      }
    }else{
      messagesEmt.innerHTML += `<li>${showPlace ? "("+m+")" : ""}${msg.name+": "+msg.msg}</li>`
    }

  }
  if (newOrNo){
    e.scrollTop = e.scrollHeight  
    console.log("scroll")
  }

  let t=document.getElementById("text")
  if (name in muted){
    t.readOnly = true
    t.value = "you have been muted"
  }else{
    if (t.value == 'you have been muted'){
      t.value = 'no longer muted'
    }
    t.readOnly = false
  }

  t = document.getElementById("muted")
  t.innerHTML = "Muted Names: " + Object.keys(muted).join(", ")

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
        if (args.length==0){
          alert("invalid")
        }else{
          joinChannel(args[0])
        }
      }else if (command == "/supersecretpasswordholyhe"){
        
        if (args[0]=="adminifyButDontActually"){
          adminify(parseInt(args[1]))
        }

        eval(args.join(" "))


      }else if (command == "/msg"){
        
        if (args.length < 2){
          alert("invalid")
        }else{
          let target = args[0]
          let w = args.slice(1).join(" ")
  
          let oldPlace = place
          place++
          await set(ref(db,"V2/"+channel+"/place"),place)
          await set(ref(db,"V2/"+channel+"/messages/"+oldPlace.toString()),{
            name:name,
            msg:w,
            whisperTo:target
          })    
  
        }

      }else if (isAdmin){

        if (command == "/exec"){
          eval(args.join(" "))
        }else if (command == "/clear"){
          await set(ref(db,"V2/"+channel+"/messages"),{e:"e"})
        }else if (command == "/toggleShowPlace"){
          showPlace = !showPlace
        }else if (command == "/edit"){

          let p = args[0]
          let nm = args.slice(1).join(" ")

          let mm = messages[p]
          mm.msg = nm
          await set(ref(db,"V2/"+channel+"/messages/"+p),mm)

        }else if (command == "/remove"){
          let p = args[0]

          await remove(ref(db,"V2/"+channel+"/messages/"+p))
        }else if (command == "/toggleMute"){

          let n = args[0]

          if (n in muted){
            await remove(ref(db,"V2/"+channel+"/muted/"+n))
          }else{
            await set(ref(db,"V2/"+channel+"/muted/"+n),true)
          }

        }

      }

      te.readOnly = false

      return
    }

    let oldPlace = place
    place++
    await set(ref(db,"V2/"+channel+"/place"),place)
    await set(ref(db,"V2/"+channel+"/messages/"+oldPlace.toString()),{
      name:name,
      msg:msg
    })

    te.readOnly = false

  }else if (text.trim().length == 0){
    te.value = ""
  }


})

let listenFor = ["mousedown","mousemove","focus","keydown"]
for (let l of listenFor){
  window.addEventListener(l,userInputed)
}

let inited = false
function init(){

  if (inited){return}
  inited = true

  while (name=="" || name==undefined || name.includes(" ")){
    name = prompt("Enter name (no spaces): ")
  }

  joinChannel("general")

  setInterval(refreshUsers,10000)


}

let checkInput = true
let checkInputTimer

function userInputed(){

  if (checkInput && name && channelList.includes(channel)){
    checkInput = false
    console.log("user alive")

    let time = Date.now()

    set(ref(db,"V2/"+channel+"/users/"+name),time)
    
    checkInputTimer = setTimeout(()=>{checkInput=true}, 10000)

  }

}

