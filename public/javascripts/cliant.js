/**
 * Created by b1016126 on 2017/03/29.
 */
var socketio = io.connect('http://ptpchat.herokuapp.com/'||'http://localhost:8000');

socketio.on("connected", function(name) {});
socketio.on("publish", function (data) { addMessage(data.value); });
socketio.on("disconnect", function () {});

// 2.イベントに絡ませる関数の定義
function start(name) {
    socketio.emit("connected", name);
}

function publishMessage() {
    var textInput = document.getElementById('msg_input');
    var msg = "[" + myName + "] " + textInput.value;
    socketio.emit("publish", {value: msg});
    textInput.value = '';
}

function addMessage (msg) {
    $('<li class="user">'+msg+'</li>').appendTo('ul');

    //var domMeg = document.createElement('div');
    //domMeg.innerHTML = new Date().toLocaleTimeString() + ' ' + msg;
    //msgArea.appendChild(domMeg);
}



$(function(){
    $('#sub').click(function(){
        socketio.emit("publish",{ value:$('#msg_input').val()});
        $('#msg_input').val('');
        return false;
    });

    $('[data-remodal-id=modal]').remodal().open();

    $('#user-ok').click(function(){
        socketio.emit("publish",{ value:$('#modal1Desc').val()});
        $('#modal1Desc').val('');
        $('[data-remodal-id=modal]').remodal().close();
        return false;
    });
    $('#user-cancel').click(function(){
       // socketio.emit("publish",{ value:$('#modal1Desc').val()});
        $('#modal1Desc').val('');
        return false;
    });

});


// 3.開始処理

//var msgArea = document.getElementById("msg");
//var myName = Math.floor(Math.random()*100) + "さん";
//addMessage("貴方は" + myName + "として入室しました");
//start(myName);
