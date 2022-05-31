import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import 'firebase-functions';
if (admin.apps.length === 0) {
    admin.initializeApp();
  }
const db = admin.firestore();
export const checkUserExists = functions.region('asia-south1').runWith({
    maxInstances: 20,
    timeoutSeconds: 60,
    memory : "128MB"
}).https.onCall((data,context) => {
    if (context.app == undefined && !process.env.FUNCTIONS_EMULATOR) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'The function must be called from an App Check verified app.')
    }
    if(!context.auth){
        return {
            status : 'error' ,
            code : 401,
            message : 'Not Signed In',
        };
    }
   return new Promise((resolve, reject)=>{ 
       admin.auth().getUserByEmail(data.email)
        .then(userRecord=>{
            if(data.type == 'org'){
                db.collection('Organizations').doc(userRecord.uid).get().then(snap => {
                    functions.logger.log(snap.exists);
                    if(snap.exists){
                        resolve("Organization-Exists");
                    }
                    else{
                        resolve("Organization-not-Exists");
                    }
                });
            }
            else{
                db.collection('Users').doc(userRecord.uid).get().then(snap => {
                    if(snap.exists){
                        if(snap.data()!['google'] == true){
                            resolve("authCheck/Google-exists")
                        }
                        resolve("User-exists");
                    }
                    else{
                        resolve("User-not-Exists");
                    }
                });
            }
        })
        .catch(error => {});
    });
});