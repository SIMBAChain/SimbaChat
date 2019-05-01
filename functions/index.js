/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Note: You will edit this file in the follow up codelab about the Cloud Functions for Firebase.
const Vision = require('@google-cloud/vision');
const vision = new Vision.ImageAnnotatorClient();
const spawn = require('child-process-promise').spawn;

const path = require('path');
const os = require('os');
const fs = require('fs');
const cors = require('cors')({origin: true});
const EthereumTx = require('ethereumjs-tx');
const request = require('request-promise');

const Firestore = require('@google-cloud/firestore');

// Import the Firebase SDK for Google Cloud Functions.
const functions = require('firebase-functions');
// const request = require('request-promise');

// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
admin.initializeApp();


//public address
const from = "0x4c01d2810e6E38947addFD6C5A086C2F62da296B";

//base url for simba
const baseUrl = "https://api.simbachain.com/v1/simbaChatz/";






function safePromise(promise) {
    return promise.then(data => [ data ]).catch(error => [ null, error ]);
}

// // Adds a message that welcomes new users into the chat.
// exports.addWelcomeMessages = functions.auth.user().onCreate(async (user) => {
//     console.log('A new user signed in for the first time.');
//     const fullName = user.displayName || 'Anonymous';
//
//     // Saves the new welcome message into the database
//     // which then displays it in the FriendlyChat clients.
//     await admin.database().ref('messages').push({
//         name: 'Firebase Bot',
//         profilePicUrl: '/images/firebase-logo.png', // Firebase logo
//         text: `${fullName} signed in for the first time! Welcome!`,
//     });
//     console.log('Welcome message written to database.');
// });

// // Checks if uploaded images are flagged as Adult or Violence and if so blurs them.
// exports.blurOffensiveImages = functions.runWith({memory: '2GB'}).storage.object().onFinalize(
//     async (object) => {
//         const image = {
//             source: {imageUri: `gs://${object.bucket}/${object.name}`},
//         };
//
//         // Check the image content using the Cloud Vision API.
//         const batchAnnotateImagesResponse = await vision.safeSearchDetection(image);
//         const safeSearchResult = batchAnnotateImagesResponse[0].safeSearchAnnotation;
//         const Likelihood = Vision.types.Likelihood;
//         if (Likelihood[safeSearchResult.adult] >= Likelihood.LIKELY ||
//             Likelihood[safeSearchResult.violence] >= Likelihood.LIKELY) {
//             console.log('The image', object.name, 'has been detected as inappropriate.');
//             return blurImage(object.name);
//         }
//         console.log('The image', object.name, 'has been detected as OK.');
//     });
//
// // Blurs the given image located in the given bucket using ImageMagick.
// async function blurImage(filePath) {
//     const tempLocalFile = path.join(os.tmpdir(), path.basename(filePath));
//     const roomId = filePath.split(path.sep)[1];
//     const messageId = filePath.split(path.sep)[2];
//     const bucket = admin.storage().bucket();
//
//     // Download file from bucket.
//     await bucket.file(filePath).download({destination: tempLocalFile});
//     console.log('Image has been downloaded to', tempLocalFile);
//     // Blur the image using ImageMagick.
//     await spawn('convert', [tempLocalFile, '-channel', 'RGBA', '-blur', '0x24', tempLocalFile]);
//     console.log('Image has been blurred');
//     // Uploading the Blurred image back into the bucket.
//     await bucket.upload(tempLocalFile, {destination: filePath});
//     console.log('Blurred image has been uploaded to', filePath);
//     // Deleting the local file to free up disk space.
//     fs.unlinkSync(tempLocalFile);
//     console.log('Deleted local file.');
//     // Indicate that the message has been moderated.
//     await admin.database().ref(`/messages/${roomId}/${messageId}`).update({moderated: true});
//     console.log('Marked the image as moderated in the database.');
// }
//

exports.webhook = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {});
    console.log('Here we receive notifications from Simba');

    const json = request.body;

    if(json.key === 'simbachain.blockchain.submit_transaction.success'){
        console.log('The transaction has been submitted to the blockchain!');

        if(json.methodname === 'createRoom'){
            var txnId = json.txn.id;
            var hash = json.txn.transaction_hash;
            console.log('This was a createRoom call');
            // Respond to transaction success
            let docRef = admin.firestore().collection("rooms");
            await docRef.where("txnId", "==", txnId).get().then(function(querySnapshot){
                console.log("Matching rooms", querySnapshot);
                querySnapshot.forEach(function(doc){
                    console.log("Found matching doc", doc.data(), doc.id, doc);
                    docRef.doc(doc.id).update({"hash":hash})
                });
            }).catch(function(error) {
                console.error('Error updating room with it\'s hash on Firestore', error);
            });
        }else if(json.methodname === 'sendMessage') {
            var chatRoomHash = request.body.txn.payload.inputs.chatRoom;
            var txnId = json.txn.id;
            var hash = json.txn.transaction_hash;
            console.log('This was a sendMessage call', txnId, hash);
            // Respond to transaction success
            let docRef = admin.firestore().collection("rooms");
            await docRef.where("hash", "==", chatRoomHash).limit(1).get().then(function(querySnapshot){
                let doc = querySnapshot.docs[0];
                let msgDocRef = docRef.doc(doc.id).collection('messages');
                msgDocRef.where("txnId", "==", txnId).get().then(function(msgQuerySnapshot){
                    msgDocRef.doc(msgQuerySnapshot.docs[0].id).update({"hash":hash})
                });
            }).catch(function(error) {
                console.error('Error updating room with it\'s hash on Firestore', error);
            });
        }else {
            // Catch others, and errors here
            console.log("Got unhandled call", json.methodname, json);
        }
    }else {
        // Catch others, and errors here
        console.log("Got unhandled key", json.key, json);
    }
    response.json({message:"Hello from Firebase!"});
});

async function signAndSendTransaction(data, docRef){
    console.log('We need to sign the transaction!', data);
    const json = JSON.parse(data);
    let txnId = json.id;
    let rawTxn = json.payload.raw;

    let tx = new EthereumTx(rawTxn);
    console.log("rawTxn:", rawTxn);
    console.log("Private Key:", functions.config().signing.key);

   // tx.sign(Buffer.from(functions.config().signing.key,'hex'));
    let key = functions.config().signing.key;
    console.log('Got key : ' + key);
    tx.sign(Buffer.from(key,'hex'));
   
    
    let signedTx = '0x' + tx.serialize().toString('hex');
    console.log('Signed Transaction', signedTx);
   
    await docRef.update({
        txnId: txnId
    }).catch(function(error) {
        console.error('Error writing new message to Firestore', error);
    });

    var options = {
        headers: {
            'APIKEY':functions.config().simba.key
        },
        form: {
            "payload": signedTx,
        },
        url:baseUrl + 'transaction/' + txnId + '/'
    };

    const [txnData, txnError] = await safePromise(request.post(options));

    if(txnError){
        console.error("Error submitting transaction to Simbachain!", txnError);
    }else {
        console.log("Signed transaction submitted back to Simbachain!", txnData);
    }
}

// call sendMessage on simbachain
exports.createRoomOnBlockchain = functions.firestore.document('rooms/{roomId}').onCreate(
    async (snapshot, context) => {
        const roomId = context.params.roomId;
        console.log('Room Created, now we call Simbachain', roomId);
        var options = {
            headers: {
                'APIKEY':functions.config().simba.key
            },
            form: {
                from: from,
                assetId: '',
                name: snapshot.id,
                createdBy: snapshot.data().created_by_id
            },
            url:baseUrl + 'createRoom/'
        };

        const [data, error] = await safePromise(request.post(options));
        if(error){
            console.error("Error calling Simbachain!", error);
        }else {
            let docRef = admin.firestore().collection("rooms").doc(snapshot.id);
            await signAndSendTransaction(data, docRef);
        }
    }
);

// call sendMessage on simbachain
exports.sendMessageToBlockchain = functions.firestore.document('rooms/{roomId}/messages/{messageId}').onCreate(
    async (snapshot, context) => {
        const roomId = context.params.roomId;
        const messageId = snapshot.id;
        console.log('Message Created, now we call Simbachain', roomId, messageId);

        let docRef = admin.firestore().collection("rooms").doc(roomId);
        await docRef.get().then(async function(doc){
            console.log('Room: ', doc.data());

            //TODO: include attachments, e.g. images for messages.
            var options = {
                headers: {
                    'APIKEY':functions.config().simba.key
                },
                form: {
                    from: from,
                    message: snapshot.data().text,
                    sentBy: snapshot.data().user,
                    chatRoom: doc.data().hash,
                    assetId: ''
                },
                url:baseUrl + 'sendMessage/'
            };

            const [data, error] = await safePromise(request.post(options));
            if(error){
                console.error("Error calling Simbachain!", error);
            }else {
                let msgDocRef = docRef.collection('messages').doc(messageId);
                await signAndSendTransaction(data, msgDocRef);
            }
        }).catch(function(error) {
            console.error('Error updating room with it\'s hash on Firestore', error);
        });
    }
);

// // Sends a notifications to all users when a new message is posted.
exports.sendNotifications = functions.firestore.document('rooms/{roomId}/messages/{messageId}').onCreate(
    async (snapshot, context) => {
        // Notification details.
        const room = context.params.roomId;
        const data = snapshot.data();

        var tokens = [];

        let docRef = admin.firestore().collection('users').where("rooms", "array-contains", room);

        await docRef.get().then(function(querySnapshot){
            querySnapshot.forEach(function (doc) {
                var data = doc.data();
                tokens = tokens.concat(data.fcmTokens);
            });
        });

        const payload = {
            notification: {
                title: `${data.name} posted ${data.text ? 'a message' : 'an image'}`,
                body: data.text ? (data.text.length <= 100 ? data.text : data.text.substring(0, 97) + '...') : '',
                icon: data.photoUrl || '/images/profile_placeholder.png',
                click_action: `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com`,
            }
        };

        // Send notifications to all tokens.
        const response = await admin.messaging().sendToDevice(tokens, payload);
        await cleanupTokens(response, tokens, docRef);
        console.log('Notifications have been sent and tokens cleaned up.');
    }
);

// Cleans up the tokens that are no longer valid.
async function cleanupTokens(response, tokens, docRef) {
    // For each notification we check if there was an error.
    const tokensToRemove = [];
    response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
            console.error('Failure sending notification to', tokens[index], error);
            // Cleanup the tokens who are not registered anymore.
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                tokensToRemove.push(tokens[index]);
            }
        }
    });

    return docRef.get().then( async function(querySnapshot){
        return querySnapshot.forEach(async function (doc) {
            let userTokens = doc.data().fcmTokens;

            return userTokens.forEach(async function(token, idx, arr){
                if(tokensToRemove.indexOf(token) >= 0){
                    await admin.firestore().collection('users').doc(doc.id).set({
                        fcmTokens: Firestore.FieldValue.arrayRemove(token)
                    }).catch(function (error) {
                        console.error('Error writing new message to Firestore', error);
                    });
                }
            });
        });
    });
}





