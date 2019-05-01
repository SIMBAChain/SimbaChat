
'use strict';




// Template for messages.
var MESSAGE_TEMPLATE =
    '<div class="message-container">' +
    '<div class="spacing"><div class="pic"></div></div>' +
    '<div class="message"></div>' +
    '<div class="lower">' +
    '<span class="name"></span>' +
    '<span class="hash"></span>' +
    '</div>' +
    '</div>';

// A loading image URL.
// var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// Displays a Message in the UI.
function displayMessage(key, name, hash, text, picUrl, imageUrl) {
    var div = document.getElementById(key);
    // If an element for that message does not exists yet we create it.
    if (!div) {
        var container = document.createElement('div');
        container.innerHTML = MESSAGE_TEMPLATE;
        div = container.firstChild;
        div.setAttribute('id', key);
        messageListElement.appendChild(div);
    }
    if (picUrl) {
        div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
    }
    if(hash === 'PENDING'){
        div.querySelector('.hash').textContent = hash;
    }else{
        var link = document.createElement('a');
        // link.href = 'https://rinkeby.etherscan.io/tx/' + hash;
        link.href = '#';
        link.innerText = hash;
        // link.target = '_blank';
        div.querySelector('.hash').innerHTML = '';
        div.querySelector('.hash').appendChild(link);
    }

    div.querySelector('.name').textContent = name;
    var messageElement = div.querySelector('.message');
    if (text) { // If the message is text.
        messageElement.textContent = text;
        // Replace all line breaks by <br>.
        messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
    } else if (imageUrl) { // If the message is an image.
        var image = document.createElement('img');
        image.addEventListener('load', function() {
            messageListElement.scrollTop = messageListElement.scrollHeight;
        });
        image.src = imageUrl + '&' + new Date().getTime();
        messageElement.innerHTML = '';
        messageElement.appendChild(image);
    }
    // Show the card fading-in and scroll to view the new message.
    setTimeout(function() {div.classList.add('visible')}, 1);
    messageListElement.scrollTop = messageListElement.scrollHeight;
    messageInputElement.focus();
}

// Saves a new message containing an image in Firebase.
// This first saves the image in Firebase storage.
// function saveImageMessage(file) {
//     // 1 - We add a message with a loading icon that will get updated with the shared image.
//     firebase.database().ref('/messages/' + currentChatRoom + '/').push({
//         name: getUserName(),
//         imageUrl: LOADING_IMAGE_URL,
//         profilePicUrl: getProfilePicUrl()
//     }).then(function(messageRef) {
//         // 2 - Upload the image to Cloud Storage.
//         var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + file.name;
//         return firebase.storage().ref(filePath).put(file).then(function(fileSnapshot) {
//             // 3 - Generate a public URL for the file.
//             return fileSnapshot.ref.getDownloadURL().then((url) => {
//                 // 4 - Update the chat message placeholder with the image's URL.
//                 return messageRef.update({
//                     imageUrl: url,
//                     storageUri: fileSnapshot.metadata.fullPath
//                 });
//             });
//         });
//     }).catch(function(error) {
//         console.error('There was an error uploading a file to Cloud Storage:', error);
//     });
// }

// Saves a new message on the Firebase DB.
function saveMessage(messageText) {
    var messageRef = firebase.firestore().collection('rooms').doc(currentChatRoom)
        .collection('messages');

    return messageRef.add({
        name: getUserName(),
        user: firebase.auth().currentUser.uid,
        text: messageText,
        profilePicUrl: getProfilePicUrl(),
        hash: 'PENDING',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function(error) {
        console.error('Error writing new message to Firestore', error);
    });
}

function clearMessages() {
    var messages = messageListElement.querySelectorAll('.message-container');
    // console.log(messages);

    for(var message of messages){
        message.remove();
    }
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {
    clearMessages();

    messagesCardElement.classList.remove('hidden');

    firebase.firestore().collection('rooms') //.where(...
        .doc(currentChatRoom)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        
        .onSnapshot(function(querySnapshot){
            querySnapshot.forEach(function(doc) {
                displayMessage(doc.id,
                    doc.data().name,
                    doc.data().hash,
                    doc.data().text,
                    doc.data().profilePicUrl,
                    doc.data().imageUrl);
            });
        });
}

function setChatRoom(name) {
    // console.log(name);
    roomNameElement.innerHTML = name;
    currentChatRoom = name;
    // We load currently existing chat messages and listen to new ones.
    loadMessages();
}

// Saves a new message on the Firestore.
function saveRoom(name) {
    // Add a new message entry to the Firestore.
    let docRef = firebase.firestore().collection("rooms").doc(name);
    docRef.get().then(function (doc) {
        if(doc.exists){
            //TODO: Alert User
            console.error('Room already exists!');
        }else{
            docRef.set({
                creator: getUserName(),
                created_by_id: firebase.auth().currentUser.uid,
                hash: 'PENDING',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function(error) {
                console.error('Error writing new message to Firestore', error);
            });
        }
    });
}

function showCreateRoomDialog() {
    if(!checkSignedInWithMessage()){
        return false;
    }
    var dialog = document.getElementById('create-room-dialog');
    if (! dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }
    dialog.showModal();

    dialog.querySelector('.close').addEventListener('click', function() {
        dialog.close();
    });

    dialog.querySelector('.create').addEventListener('click', function(e) {
        e.preventDefault();
        var name = dialog.querySelector('.room-name').value;

        resetMaterialTextfield(dialog.querySelector('.room-name'));

        saveRoom(name);
        dialog.close();
    });
}

// Template for messages.
var ROOM_TEMPLATE =
    '<li class="mdl-list__item mdl-list__item--three-line">' +
    '  <span class="mdl-list__item-primary-content">' +
    '    <span class="mdl-list__item-avatar"></span>' +
    '    <span class="text"></span>' +
    '    <span class="mdl-list__item-text-body">' +
    '      <span class="description"></span>"' +
    '      <span class="hash"></span>"' +
    '    </span>' +
    '  </span>' +
    '  <span class="mdl-list__item-secondary-content">' +
    '    <a class="mdl-list__item-secondary-action" href="#"><i class="material-icons star-icon">star</i></a>' +
    '  </span>' +
    '</li>';

// Displays a Message in the UI.
function displayRoom(key, hash, imageUrl) {
    // console.log(firebase.auth().currentUser.uid);
    var anchor = document.getElementById('room_' + key);
    // If an element for that message does not exists yet we create it.

    if (!anchor) {
        var container = document.createElement('div');
        container.innerHTML = ROOM_TEMPLATE;
        anchor = container.firstChild;
        anchor.setAttribute('id', 'room_' + key);
        roomListElement.appendChild(anchor);
    }

    var star = anchor.querySelector('.mdl-list__item-secondary-action');

    var star_onclick = function (e) {
        if(e)e.preventDefault();
        if(e)e.stopPropagation();

        var docRef = firebase.firestore()
            .collection('users')
            .doc(firebase.auth().currentUser.uid);

        docRef.get().then(function(doc){
            if(doc.exists){
                let data = doc.data();
                if(data && 'rooms' in data && data.rooms.indexOf(key) >= 0){
                    docRef.update({
                        rooms: firebase.firestore.FieldValue.arrayRemove(key)
                    }).catch(function(error) {
                        console.error('Error writing new message to Firestore', error);
                    });
                }else{
                    docRef.update({
                        rooms: firebase.firestore.FieldValue.arrayUnion(key)
                    }).catch(function(error) {
                        console.error('Error writing new message to Firestore', error);
                    });
                }
            }else{
                docRef.set({
                    rooms:[key],
                    fcmTokens: []
                }).catch(function(error) {
                    console.error('Error writing new message to Firestore', error);
                });
            }
        });
    };

    star.addEventListener('click', star_onclick);

    firebase.firestore()
        .collection('users')
        .doc(firebase.auth().currentUser.uid)
        .onSnapshot(function (doc) {
            let data = doc.data();
            if(data && 'rooms' in data && data.rooms.indexOf(key) >= 0){
                star.classList.add('active');
            }else{
                star.classList.remove('active');
            }
    });

    if (imageUrl) {
        anchor.querySelector('.pic').style.backgroundImage = 'url(' + imageUrl + ')';
    }

    anchor.querySelector('.text').textContent = key;

    if(hash === 'PENDING'){
        anchor.querySelector('.hash').textContent = 'Processing...';
    }else{
        anchor.querySelector('.hash').textContent = 'Active!';
    }

    var anchor_onclick = function(e){
        // console.log('anchor_onclick');
        e.preventDefault();
        if(hash === 'PENDING'){
            // console.log("Not available yet");
            // Display a message to the user using a Toast.
            var data = {
                message: 'This room is still being created, please wait.',
                timeout: 2000
            };
            signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
        }else{
            if(!star.classList.contains('active')){
                star_onclick()
            }

            roomListElement.querySelectorAll('.mdl-list__item').forEach(function (value, i, array) {
                value.classList.remove('active');
            });

            anchor.classList.add('active');

            setChatRoom(key);

        }
    };

    function toggle_drawer() {
        var drawer = document.getElementsByClassName('mdl-layout__drawer')[0];
        var drawer_obfuscator = document.getElementsByClassName('mdl-layout__obfuscator')[0];
        drawer.classList.remove("is-visible");
        drawer_obfuscator.classList.remove("is-visible");
    };

    anchor.addEventListener('click', anchor_onclick);
    anchor.addEventListener('click', toggle_drawer);

    // Show the card fading-in and scroll to view the new message.
    setTimeout(function() {anchor.classList.add('visible')}, 1);
    roomListElement.scrollTop = roomListElement.scrollHeight;
    roomListElement.focus();
}


// Loads rooms and listens for upcoming ones.
function loadRooms() {
    firebase.firestore().collection('rooms').onSnapshot(function (querySnapshot) {
        querySnapshot.forEach(function (doc){
            displayRoom(doc.id,
                doc.data().hash,
                doc.data().imageUrl);
        })
    })
}

// Signs-in SIMBA Chat.
function signIn() {
    // Sign in Firebase using popup auth and Google as the identity provider.
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
}

// Signs-out of SIMBA Chat.
function signOut() {
    // Sign out of Firebase.
    firebase.auth().signOut();
    window.location.reload();
}

// Initiate firebase auth.
function initFirebaseAuth() {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
    return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
    return firebase.auth().currentUser.displayName;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
    return !!firebase.auth().currentUser;
}

// Saves the messaging device token to the datastore.
function saveMessagingDeviceToken() {
    firebase.messaging().getToken().then(function(currentToken) {
        if (currentToken) {
            // console.log('Got FCM device token:', currentToken);

            let docRef = firebase.firestore().collection("users").doc(firebase.auth().currentUser.uid);
            docRef.get().then(function (doc) {
                if(doc.exists){
                    if(doc.data().fcmTokens.indexOf(currentToken) < 0) {
                        docRef.update({
                            fcmTokens: firebase.firestore.FieldValue.arrayUnion(currentToken)
                        }).catch(function (error) {
                            console.error('Error writing new message to Firestore', error);
                        });
                    }
                }else{
                    docRef.set({
                        rooms:[],
                        fcmTokens: [currentToken]
                    }).catch(function(error) {
                        console.error('Error writing new message to Firestore', error);
                    });
                }
            })

        } else {
            // Need to request permissions to show notifications.
            requestNotificationsPermissions();
        }
    }).catch(function(error){
        console.error('Unable to get messaging token.', error);
    });
}

// Requests permissions to show notifications.
function requestNotificationsPermissions() {
    // console.log('Requesting notifications permission...');
    firebase.messaging().requestPermission().then(function() {
        // Notification permission granted.
        saveMessagingDeviceToken();
    }).catch(function(error) {
        console.error('Unable to get permission to notify.', error);
    });
}

// Triggered when a file is selected via the media picker.
function onMediaFileSelected(event) {
  event.preventDefault();
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  imageFormElement.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // Check if the user is signed-in
  if (checkSignedInWithMessage()) {
    saveImageMessage(file);
  }
}

// Triggered when the send new message form is submitted.
function onMessageFormSubmit(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (messageInputElement.value && checkSignedInWithMessage()) {
    saveMessage(messageInputElement.value).then(function() {
      // Clear message text field and re-enable the SEND button.
      resetMaterialTextfield(messageInputElement);
      toggleButton();
    });
  }
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) { // User is signed in!
    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();
    loadRooms();

    // Set the user's profile pic and name.
    //userPicElement.style.backgroundImage = 'url(' + profilePicUrl + ')';
    userPicElement.src = profilePicUrl;
    userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    userNameElement.removeAttribute('hidden');
    userBtnElement.removeAttribute('hidden');
    createRoomButtonElement.removeAttribute('hidden');
    userPicElement.removeAttribute('hidden');
    roomTitleElement.removeAttribute('hidden');
    signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');
    signInIconElement.setAttribute('hidden', 'true');
    welcomeCardElement.setAttribute('hidden', 'true');

    // We save the Firebase Messaging Device token and enable notifications.
    saveMessagingDeviceToken();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userBtnElement.setAttribute('hidden', 'true');
    createRoomButtonElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    roomTitleElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');
    welcomeCardElement.removeAttribute('hidden');
    signInIconElement.removeAttribute('hidden');
  }
}

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

// Resets the given MaterialTextField.
function resetMaterialTextfield(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

// Enables or disables the submit button depending on the values of the input
// fields.
function toggleButton() {
  if (messageInputElement.value) {
    submitButtonElement.removeAttribute('disabled');
  } else {
    submitButtonElement.setAttribute('disabled', 'true');
  }
}

// Checks that the Firebase SDK has been correctly setup and configured.
function checkSetup() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
}

// Checks that Firebase has been imported.
checkSetup();

// Shortcuts to DOM Elements.
var messagesCardElement = document.getElementById('messages-card');
var roomListElement = document.getElementById('rooms');
var messageListElement = document.getElementById('messages');
var messageFormElement = document.getElementById('message-form');
var messageInputElement = document.getElementById('message');
var submitButtonElement = document.getElementById('submit');
var imageButtonElement = document.getElementById('submitImage');
var imageFormElement = document.getElementById('image-form');
var mediaCaptureElement = document.getElementById('mediaCapture');
var userPicElement = document.getElementById('user-picture');
var roomTitleElement = document.getElementById('room-title');
var userNameElement = document.getElementById('user-name');
var userBtnElement = document.getElementById('accbtn');
var signInButtonElement = document.getElementById('sign-in');
var signInIconElement = document.getElementById('icon');
var signOutButtonElement = document.getElementById('sign-out');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');
var createRoomButtonElement = document.getElementById('create-room-button');
var roomNameElement = document.getElementById('room-name');
var welcomeCardElement = document.getElementById('welcome-card');

var currentChatRoom = null;
var currentMessageRef = null;

// Saves message on form submit.
messageFormElement.addEventListener('submit', onMessageFormSubmit);
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

// Events for image upload.
imageButtonElement.addEventListener('click', function(e) {
  e.preventDefault();
  mediaCaptureElement.click();
});
mediaCaptureElement.addEventListener('change', onMediaFileSelected);

createRoomButtonElement.addEventListener('click', showCreateRoomDialog);

// initialize Firebase
initFirebaseAuth();

const firestore = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
firestore.settings(settings);

// We load rooms and listen for new ones.
loadRooms();
