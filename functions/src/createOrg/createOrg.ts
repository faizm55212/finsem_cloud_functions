import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  
const db = admin.firestore();
export const createOrg = functions.https.onRequest((req, res)=>{
    admin.auth().createUser({
        email: req.body['email'],
        emailVerified: false,
        displayName : req.body['name'],
        password: req.body['passwd'],
    }).then(userRecord => {
        db.collection('Organizations').doc(userRecord.uid).set({
            'name' : userRecord.displayName,
            'email' : userRecord.email,
            'address' : req.body['add'],
        }).then((create)=>{
            res.send("Organization Created : " + userRecord.uid);
        });
        
    }).catch(error =>{
        res.send("Error : "+ error);
    });
});