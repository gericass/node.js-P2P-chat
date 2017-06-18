/**
 * Created by b1016126 on 2017/03/29.
 */



$(function(){

    var socketio = io.connect('http://ptpchat.herokuapp.com/');
    var PID = '';
    var name = '';


    socketio.on("connected",function(name) {});
    socketio.on("publish", function (data) { addRoom(data.name,data.id); });
    socketio.on("user-out" ,function (data){//disconnect時
        delete $('#'+data).remove();
    });

    var peer = new Peer({
        // Set API key for cloud server (you don't need this if you're running your
        // own.
        key: ''
        // Set highest debug level (log everything!)
    });

    var connectedPeers = {};
    var connectedUserName = {};
    peer.on('connection', connect);

    function connect(c){
        if (c.label === 'chat') {
            // Select connection handler.
            c.on('data', function(data) {
                $('<li class="other">'+connectedUserName[c.peer]+': '+data+'</li>').appendTo('#chat');
                scrl();
            });
            c.on('close', function() {
                //alert(connectedUserName[c.peer] + ' が退出しました');
                $('<li class="notice-out">' + connectedUserName[c.peer] + ' が退出しました</li>').appendTo('#chat');
                scrl();

                c.destroy();
                delete connectedPeers[c.peer];
                delete connectedUserName[c.peer];
            });
        } else if (c.label === 'file') {
            c.on('data', function(data) {
                // If we're getting a file, create a URL for it.
                if (data.constructor === ArrayBuffer) {
                    var dataView = new Uint8Array(data);
                    var dataBlob = new Blob([dataView]);
                    var url = window.URL.createObjectURL(dataBlob);
                    $('<li class="other">'+connectedUserName[c.peer]+': <a target="_blank" href="' + url + '">ファイル</a>を送信しました</li>').appendTo('#chat');
                    scrl();
                }
            });
        }else if (c.label === 'greeting') {
            var requestedPeer = c.peer;
            connectedPeers[c.peer] = c.peer; //connectedPeers[接続した相手のPeerId] = 相手のPeerId
            connectedUserName[c.peer] = c.metadata; //connectedUserName[接続した相手のPeerId] = 相手のユーザー名



            var d = peer.connect(requestedPeer, {
                label: 'chat',
                serialization: 'none',
                metadata: 'KUSO'
            });

            d.on('error', function() {
                delete connectedPeers[d.peer];
                delete connectedUserName[d.peer];
            });
            var f = peer.connect(requestedPeer, { label: 'file', reliable: true });

            f.on('error', function() {
                delete connectedPeers[f.peer];
                delete connectedUserName[f.peer];
            });


            $('<li class="notice">'+c.metadata+' と接続を開始しました</li>').appendTo('#chat');
            scrl();

        }
        //scrl();
    }




    socketio.on("render",function(data) {//左側にユーザーリスト作成
        for(var i=0;i<data.si.length;i++){
            $('<li class="user" id="'+ data.si[i] + '">'+data.un[data.si[i]]+'<dev class="pidinput" style="margin:50px;display:none;">ID:<input type="text" id="password"></input><input type="submit" value="送信" id="passsub"></input></dev>'+'</li>').appendTo('#user-list');
        }
    });

    socketio.on("CON",function(data){//こちら側から接続したとき
        if(connectedPeers[data.pi]!=data.pi) {
            var requestedPeer = data.pi;
            connectedPeers[data.pi] = data.pi; //connectedPeers[接続した相手のPeerId] = 相手のPeerId
            connectedUserName[data.pi] = data.un; //connectedUserName[接続した相手のPeerId] = 相手のユーザー名

            // Create 2 connections, one labelled chat and another labelled file.
            var c = peer.connect(requestedPeer, {
                label: 'chat',
                serialization: 'none',
                metadata: 'Hello'
            });
            /*
             c.on('open', function() {
             //connect(c);
             });
             */

             c.on('error', function() {
                 delete connectedPeers[c.peer];
                 delete connectedUserName[c.peer];
             });

            var f = peer.connect(requestedPeer, {label: 'file', reliable: true});
            /*
             f.on('open', function() {
             //connect(f);
             });
             */

             f.on('error', function() {
                 delete connectedPeers[c.peer];
                 delete connectedUserName[c.peer];
             });

            var g = peer.connect(requestedPeer, {
                label: 'greeting',
                serialization: 'none',
                metadata: name
            });
            /*
             g.on('open', function() {
             //connect(g);
             //g.send();
             });
             */

             g.on('error', function() {
                 delete connectedPeers[c.peer];
                 delete connectedUserName[c.peer];
             });


            $('<li class="notice">' + data.un + ' と接続を開始しました</li>').appendTo('#chat');
            scrl();
        }
    });



    function addRoom (name,uid) {//ユーザーリストに追加
        $('<li class="user" id="'+ uid + '">'+name+'<dev class="pidinput" style="margin:50px;display:none;">ID:<input type="text" id="password"></input><input type="submit" value="送信" id="passsub"></input></dev>'+'</li>').appendTo('#user-list');
    }


    peer.on('open', function(id){ //自分のPeerId取得
        PID = id;
        $('#head-txt').text('Your ID: '+id);
    });



    $(document).on("click", "li", (function(){//ユーザリストクリック時
        var id = $(this).attr('id');
        $('#'+id).css({'font-size':'20px'});
        $(this).children('dev').css('display','');

    }));

    $(document).on("click", "#passsub", (function(){//ユーザリスト「送信」クリック時
        if($(this).prev('#password').val()!=''){
            socketio.emit("idconfirm",{soc:$(this).parents('.user').attr('id'),pid:$(this).prev('#password').val()});
            $(this).prev('#password').val('')
        }
    }));


    socketio.emit("render");//接続中ユーザーの表示をリクエスト



    /*----------------WebRTC関連----------------------------*/
    var box = $('.drag');
    box.on('dragenter', doNothing);
    box.on('dragover', doNothing);
    box.on('drop', function(e){
        e.originalEvent.preventDefault();
        var file = e.originalEvent.dataTransfer.files[0];
        activeconnections(function(c) {
            if (c.label === 'file') {
                c.send(file);
            }
        });
        $('<li class="you">ファイルを送信しました</li>').appendTo('#chat');
        scrl();
    });
    function doNothing(e){
        e.preventDefault();
        e.stopPropagation();
    }


    $('#sub').click(function(e){//メッセージ送信ボタン
        e.preventDefault();
        var msg = $('#msg_input').val();
        //socketio.emit("publish",{ value:$('#msg_input').val()});
        activeconnections(function(m){
           // $('<li class="you">'+m.label+'</li>').appendTo('#chat');
           if(m.label==='chat'){
               m.send(msg);
           }
        });
        $('<li class="you">'+msg+'</li>').appendTo('#chat');
        scrl();
        $('#msg_input').val('');
        return false;
    });



    function activeconnections(fn) {
        for (p in connectedPeers) {
            var conns = peer.connections[connectedPeers[p]];
            for (var i = 0; i < conns.length; i += 1) {
                fn(conns[i]);
                //$('<li class="you">'+connectedPeers[p]+'</li>').appendTo('#chat');
            }
        }
    }
    /*------------スクロール----------------*/
    function scrl(){
        $('#right_frame').delay(100).animate({
            scrollTop: $(document).height()
        },800);
    }

    /*-------------------以下ポップアップ関連---------------*/

    $('[data-remodal-id=modal]').remodal().open();//モーダルウィンドウ起動

    $('#user-ok').click(function(){      //モーダルウィンドウのOK押下時
        name = $('#modal1Desc').val();
        socketio.emit("save",{ name:$('#modal1Desc').val(),peerid:PID});
        $('#modal1Desc').val('');
        $('[data-remodal-id=modal]').remodal().close();
        return false;
    });
    $('#user-cancel').click(function(){         //cancel押下時
       // socketio.emit("publish",{ value:$('#modal1Desc').val()});
        $('#modal1Desc').val('');
        return false;
    });

});



