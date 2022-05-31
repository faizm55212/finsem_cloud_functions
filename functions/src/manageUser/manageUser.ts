import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import 'firebase-functions';
if (admin.apps.length === 0) {
    admin.initializeApp();
  }
const db = admin.firestore();

export const manageUser = functions.region('asia-south1').runWith({
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
        return {status : 'error' , code : 401, message : 'Not Signed In'};
    }
    return new Promise((resolve, reject)=>{
            if(data.req == "add_user"){
                admin.auth().createUser({
                    displayName : data.name,
                    email : data.email,
                    emailVerified: false,
                    password : data.passwd,
                }).then((userRecord) => {
                    db.collection('Users').doc(userRecord.uid).set({
                        'name' : userRecord.displayName,
                        'email' : userRecord.email,
                        'google' : false,
                        'age': data.age,
                        'gender': data.gender,
                        'mobile': data.mobile,
                        'block': data.block,
                        'flatNo': data.flatNo,
                        'idType': data.idType,
                        'idNo': data.idNo,
                        'occupation':data.occupation,
                        'total_pending' : 0,
                    }).then((create)=>{
                        db.collection('Users').doc(userRecord.uid).collection('add_req').doc(data.oid).set({
                            "name" : data.org,
                            "monthly" : data.monthly,
                            "OID" : data.oid,
                            "pending" : data.pending,  
                        }).then((_)=>{
                            resolve('Org '+ data.org+' Added to user request ' + userRecord.displayName);
                        });
                    });
    
                }).catch((error)=> {
                    if (error.code == 'auth/email-already-exists'){
                        admin.auth().getUserByEmail(data.email).then((userRecord)=>{  
                            db.collection('Users').doc(userRecord.uid).collection('add_req').doc(data.oid).set({
                                "name" : data.org,
                                "monthly" : data.monthly,
                                "OID" : data.oid,
                                "pending" : data.pending,  
                            }).then((_)=>{
                                resolve('Org '+ data.org+' Added to user request ' + userRecord.displayName);
                            });
                        }).catch((error)=> {
                            throw new functions.https.HttpsError( error.code,error.message,error);
                        });  
                    }
                    else{
                        throw new functions.https.HttpsError( error.code,error.message,error);
                   }        
                });  
            }
            else if(data.req == "delete_user"){
                admin.auth().getUserByEmail(data.email).then((userRecords)=>{
                    db.collection('Users').doc(userRecords.uid).get().then((userSnap)=>{
                        const org_length = userSnap.data()!['org'].length;
                        const org_list = userSnap.data()!['org'];
                        let new_org_list = [];
                        for(let i = 0;i<org_length;i++){
                            if(org_list[i]['name']!=data.org){
                                new_org_list.push(org_list[i]);
                            }
                        }
                        userSnap.ref.update({
                            org: new_org_list,
                        });
                        resolve('Org Deleted ' + data.org);
                    });                
                }).catch((error)=>{
                    throw new functions.https.HttpsError( error.code,error.message,error);
                });           
            }
            else {
                functions.logger.info("No Operations perfomed", {structuredData: true});
            }
    });
  });
  